#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <IRremoteESP8266.h>
#include <IRsend.h>
#include <WiFiManager.h>
#include <Preferences.h>

// --- BIBLIOTECAS DE MARCAS ---
#include <ir_Fujitsu.h> 
#include <ir_Coolix.h>  
#include <ir_Bosch.h>   

// ==========================================
// CONFIGURAÇÕES HARDWARE
// ==========================================
const uint16_t kIrLed = 4;      // GPIO para LED IR
#define LED_STATUS 2            // LED interno do ESP32
#define BUTTON_CONFIG 0         // Botão para modo de configuração (GPIO0)

// Objetos IR
IRsend irsend(kIrLed);
IRFujitsuAC ac_fujitsu(kIrLed);
IRCoolixAC ac_springer(kIrLed);
IRBosch144AC ac_carrier(kIrLed);

WiFiClient espClient;
PubSubClient client(espClient);
Preferences preferences;
WiFiManager wm;

// ==========================================
// VARIÁVEIS GLOBAIS
// ==========================================
String device_id;               // Gerado automaticamente
String mqtt_server = "broker.hivemq.com";
int mqtt_port = 1883;
bool configMode = false;

// Estado atual
bool currentPower = false;
int currentTemp = 24;
String currentMode = "cool";
String currentBrand = "Carrier";
String device_name = "ESP32-AC";

// Tópicos MQTT
String topic_command;
String topic_state;
String topic_discovery = "smart_ac/discovery";  // Tópico de descoberta

// Temporizadores
unsigned long lastHeartbeat = 0;
unsigned long lastReconnectAttempt = 0;

// ==========================================
// PROTÓTIPOS DE FUNÇÃO (ADICIONADOS NOVOS)
// ==========================================
void setupWiFi();
void reconnectMQTT();
void mqttCallback(char* topic, byte* payload, unsigned int length);
void publicarStatus();  
void publicarStatusComTipo(String tipo);  
void publicarDescoberta();
void publicarParaListener();  // NOVO: Função para enviar status para Django listener
void controlFujitsu(bool power, int temp, String mode);
void controlSpringer(bool power, int temp, String mode);
void controlCarrier(bool power, int temp, String mode);
void gerarDeviceID();
void enviarTesteInicial();    // NOVO: Função para teste inicial

// ==========================================
// SETUP
// ==========================================
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n=== SMART AC CONTROLLER ESP32 ===");
  
  // Configurar pinos
  pinMode(LED_STATUS, OUTPUT);
  pinMode(BUTTON_CONFIG, INPUT_PULLUP);
  digitalWrite(LED_STATUS, LOW);
  
  // Verificar botão de configuração
  if (digitalRead(BUTTON_CONFIG) == LOW) {
    configMode = true;
    Serial.println("Modo de configuração ativado");
    digitalWrite(LED_STATUS, HIGH);
  }
  
  // Inicializar IR
  irsend.begin();
  ac_fujitsu.begin();
  ac_fujitsu.setModel(fujitsu_ac_remote_model_t::ARREB1E);
  ac_springer.begin();
  ac_carrier.begin();
  
  // Inicializar memória não-volátil
  preferences.begin("smart-ac", false);
  
  // Gerar/ler device_id
  gerarDeviceID();
  
  // Configurar Wi-Fi
  setupWiFi();
  
  // Configurar MQTT
  client.setServer(mqtt_server.c_str(), mqtt_port);
  client.setCallback(mqttCallback);
  client.setBufferSize(1024);
  
  // Primeira conexão
  reconnectMQTT();
  
  // Teste inicial de comunicação
  delay(2000);
  enviarTesteInicial();
  
  Serial.println("\n=== SISTEMA PRONTO ===");
  Serial.println("Device ID: " + device_id);
  Serial.println("Tópico Comando: " + topic_command);
  Serial.println("Tópico Estado: " + topic_state);
}

// ==========================================
// LOOP PRINCIPAL
// ==========================================
void loop() {
  // Manter conexão Wi-Fi
  if (WiFi.status() != WL_CONNECTED) {
    setupWiFi();
  }
  
  // Manter conexão MQTT
  if (!client.connected()) {
    reconnectMQTT();
  }
  
  client.loop();
  
  // Heartbeat a cada 15 segundos (reduzido de 30 para melhor resposta)
  if (millis() - lastHeartbeat > 15000) {
    lastHeartbeat = millis();
    Serial.println("Enviando Heartbeat...");
    
    // Publicar para ambos os sistemas
    publicarStatus();            // Para sistema antigo (compatibilidade)
    publicarParaListener();      // PARA O DJANGO LISTENER - NOVO!
    
    // A cada 4 heartbeats (1 minuto), envia descoberta também
    static int heartbeatCount = 0;
    heartbeatCount++;
    if (heartbeatCount % 4 == 0) {
      publicarDescoberta();
    }
  }
}

// ==========================================
// NOVA FUNÇÃO: Teste inicial
// ==========================================
void enviarTesteInicial() {
  Serial.println("=== TESTE INICIAL DE COMUNICAÇÃO ===");
  publicarDescoberta();
  publicarStatus();
  publicarParaListener();  // 🔥 ENVIA PARA O DJANGO IMEDIATAMENTE
  Serial.println("=== TESTES ENVIADOS ===");
}

// ==========================================
// FUNÇÕES DE CONFIGURAÇÃO
// ==========================================
void gerarDeviceID() {
  // Tentar ler device_id salvo
  device_id = preferences.getString("device_id", "");
  
  if (device_id == "") {
    // Gerar novo ID baseado no MAC address
    String mac = WiFi.macAddress();
    mac.replace(":", "");
    // Pegar últimos 6 caracteres do MAC
    String macSuffix = mac.substring(mac.length() - 6);
    device_id = "esp32_" + macSuffix;
    
    // Salvar nas preferências
    preferences.putString("device_id", device_id);
    Serial.println("Novo Device ID gerado: " + device_id);
  } else {
    Serial.println("Device ID recuperado: " + device_id);
  }
  
  // Definir tópicos
  topic_command = "smart_ac/" + device_id + "/command";
  topic_state = "smart_ac/" + device_id + "/state";
}

void setupWiFi() {
  if (configMode) {
    wm.resetSettings();
    Serial.println("Configurações Wi-Fi resetadas");
  }
  
  // Parâmetros customizados
  WiFiManagerParameter custom_name("name", "Nome do Dispositivo", device_name.c_str(), 40);
  WiFiManagerParameter custom_brand("brand", "Marca Padrão", currentBrand.c_str(), 20);
  
  wm.addParameter(&custom_name);
  wm.addParameter(&custom_brand);
  
  // Nome do AP de configuração
  String ap_name = "AC-" + device_id.substring(device_id.length() - 6);
  
  // Tentar conectar
  if (!wm.autoConnect(ap_name.c_str())) {
    Serial.println("Falha na conexão Wi-Fi");
    ESP.restart();
  }
  
  // Atualizar configurações
  device_name = custom_name.getValue();
  currentBrand = custom_brand.getValue();
  
  // Salvar configurações
  preferences.putString("device_name", device_name);
  preferences.putString("default_brand", currentBrand);
  
  Serial.println("\nWi-Fi conectado!");
  Serial.println("SSID: " + WiFi.SSID());
  Serial.println("IP: " + WiFi.localIP().toString());
  Serial.println("Nome do dispositivo: " + device_name);
  Serial.println("Marca padrão: " + currentBrand);
  
  digitalWrite(LED_STATUS, LOW);
}

// ==========================================
// FUNÇÕES MQTT
// ==========================================
void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Conectando MQTT...");
    String clientId = "ESP32-" + device_id;
    
    if (client.connect(clientId.c_str())) {
      Serial.println(" CONECTADO!");
      client.subscribe(topic_command.c_str());
      Serial.println("Inscrito em: " + topic_command);
      
      // Publicar status inicial
      publicarStatus();
      publicarDescoberta();
      publicarParaListener();  // 🔥 NOVO: Notifica Django também
    } else {
      Serial.print(" Falha rc=");
      Serial.print(client.state());
      delay(5000);
    }
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (int i = 0; i < length; i++) message += (char)payload[i];
  
  Serial.println("\n📩 Comando recebido: " + message);
  
  // Piscar LED
  digitalWrite(LED_STATUS, HIGH);
  delay(100);
  digitalWrite(LED_STATUS, LOW);
  
  DynamicJsonDocument doc(1024);
  DeserializationError error = deserializeJson(doc, message);
  
  if (error) {
    Serial.println("❌ Erro JSON: " + String(error.c_str()));
    return;
  }
  
  // Atualizar estado interno
  if (doc.containsKey("power")) {
    currentPower = doc["power"].as<bool>();
  }
  
  if (doc.containsKey("temp")) {
    currentTemp = doc["temp"].as<int>();
    if (currentTemp < 16) currentTemp = 16;
    if (currentTemp > 30) currentTemp = 30;
  }
  
  if (doc.containsKey("mode")) {
    currentMode = doc["mode"].as<String>();
  }
  
  if (doc.containsKey("brand")) {
    currentBrand = doc["brand"].as<String>();
  }
  
  // Executar comando IR
  String brandLower = currentBrand;
  brandLower.toLowerCase();
  
  if (brandLower.indexOf("fujitsu") != -1) {
    controlFujitsu(currentPower, currentTemp, currentMode);
  } 
  else if (brandLower.indexOf("spring") != -1 || brandLower.indexOf("midea") != -1) {
    controlSpringer(currentPower, currentTemp, currentMode);
  } 
  else if (brandLower.indexOf("carrier") != -1) {
    controlCarrier(currentPower, currentTemp, currentMode);
  } 
  else {
    Serial.println("⚠️ Marca não suportada: " + currentBrand);
  }
  
  // 🔥 NOVO: Avisar Django que recebeu e executou o comando
  publicarParaListener();
  // Mantém também o status normal (para compatibilidade)
  publicarStatus();
}

// ==========================================
// 🔥 NOVA FUNÇÃO: Publicar para Django Listener
// ==========================================
void publicarParaListener() {
  // Publica no formato EXATO que o Django mqtt_listener.py espera
  // Tópico: smart_ac/device_id/state (mesmo que o tópico normal, mas com formato específico)
  
  DynamicJsonDocument doc(512);
  
  // 🔥 CAMPOS EXATOS QUE O DJANGO ESPERA:
  doc["device_id"] = device_id;
  doc["power"] = currentPower;
  doc["temp"] = currentTemp;      // 🔥 OBRIGATÓRIO: "temp" em minúsculo
  doc["mode"] = currentMode;
  doc["brand"] = currentBrand;
  doc["name"] = device_name;
  doc["online"] = true;
  doc["timestamp"] = millis();
  
  // 🔥 IMPORTANTE: NÃO incluir campo "type" para atualizações de status normais
  // O Django usa "type" apenas para discovery
  
  char buffer[512];
  serializeJson(doc, buffer);
  
  if (client.publish(topic_state.c_str(), buffer)) {
    Serial.print(">> Status enviado para Django: ");
    Serial.println(buffer);
  } else {
    Serial.println(">> Erro ao enviar status para Django!");
  }
}

// ==========================================
// FUNÇÕES DE PUBLICAÇÃO DE STATUS (ORIGINAIS)
// ==========================================
void publicarStatus() {
  // Versão sem parâmetro (mantém compatibilidade)
  publicarStatusComTipo("status");
}

void publicarStatusComTipo(String tipo) {
  DynamicJsonDocument doc(512);
  
  doc["device_id"] = device_id;
  doc["type"] = tipo;
  doc["online"] = true;
  doc["power"] = currentPower;
  doc["temp"] = currentTemp;
  doc["mode"] = currentMode;
  doc["brand"] = currentBrand;
  doc["name"] = device_name;
  doc["rssi"] = WiFi.RSSI();
  doc["timestamp"] = millis();
  
  char buffer[512];
  serializeJson(doc, buffer);
  
  if (client.publish(topic_state.c_str(), buffer)) {
    Serial.print(">> Status publicado (compatibilidade): ");
    Serial.println(buffer);
  } else {
    Serial.println(">> Erro ao publicar status!");
  }
}

void publicarDescoberta() {
  DynamicJsonDocument doc(512);
  
  doc["device_id"] = device_id;
  doc["type"] = "discovery";  // 🔥 IMPORTANTE: "type": "discovery" para o Django
  doc["name"] = device_name;
  doc["brand"] = currentBrand;
  doc["mac"] = WiFi.macAddress();
  doc["ip"] = WiFi.localIP().toString();
  doc["status"] = "available";
  doc["timestamp"] = millis();
  
  char buffer[512];
  serializeJson(doc, buffer);
  
  if (client.publish(topic_discovery.c_str(), buffer)) {
    Serial.println("Mensagem de descoberta publicada");
  }
}

// ==========================================
// FUNÇÕES IR (MANTIDAS COMO ANTES)
// ==========================================
void controlFujitsu(bool power, int temp, String mode) {
  Serial.println("IR: Fujitsu");
  if (power) {
    ac_fujitsu.on(); 
    ac_fujitsu.setTemp(temp);
    if (mode == "cool") ac_fujitsu.setMode(kFujitsuAcModeCool);
    else if (mode == "heat") ac_fujitsu.setMode(kFujitsuAcModeHeat);
    else if (mode == "fan") ac_fujitsu.setMode(kFujitsuAcModeFan);
    else if (mode == "dry") ac_fujitsu.setMode(kFujitsuAcModeDry);
    else ac_fujitsu.setMode(kFujitsuAcModeAuto);
  } else {
    ac_fujitsu.off();
  }
  ac_fujitsu.send();
}

void controlSpringer(bool power, int temp, String mode) {
  Serial.println("IR: Springer");
  ac_springer.setPower(power);
  if (power) {
    ac_springer.setTemp(temp);
    if (mode == "cool") ac_springer.setMode(kCoolixCool);
    else if (mode == "heat") ac_springer.setMode(kCoolixHeat);
    else if (mode == "fan") ac_springer.setMode(kCoolixFan);
    else if (mode == "dry") ac_springer.setMode(kCoolixDry);
    else ac_springer.setMode(kCoolixAuto);
  }
  ac_springer.send();
}

void controlCarrier(bool power, int temp, String mode) {
  Serial.println("IR: Carrier");
  if (!power) {
    irsend.sendCOOLIX(0xB27BE0, 24);
  } else {
    ac_carrier.setPower(true);
    ac_carrier.setTemp(temp);
    if (mode == "cool") ac_carrier.setMode(kBosch144Cool);
    else if (mode == "heat") ac_carrier.setMode(kBosch144Heat);
    else if (mode == "fan") ac_carrier.setMode(kBosch144Fan);
    else if (mode == "dry") ac_carrier.setMode(kBosch144Dry);
    else ac_carrier.setMode(kBosch144Auto);
    ac_carrier.send();
  }
}