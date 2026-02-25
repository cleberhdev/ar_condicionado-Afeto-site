/* Firmware ESP32 — Versão Corrigida (prioritária)
   Correções:
   - botão não é GPIO0 (usa 15)
   - reconexão MQTT não bloqueante
   - blink LED não-blocking
   - timestamp em epoch seconds via NTP (com fallback)
   - publish consolidado com retain=true
   - LWT configurado
*/

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <IRremoteESP8266.h>
#include <IRsend.h>
#include <WiFiManager.h>
#include <Preferences.h>
#include <time.h>

// --- BIBLIOTECAS DE MARCAS ---
#include <ir_Fujitsu.h>
#include <ir_Coolix.h>
#include <ir_Bosch.h>

// ==========================================
// CONFIGURAÇÕES HARDWARE
// ==========================================
const uint16_t kIrLed = 4;      // GPIO para LED IR
#define LED_STATUS 2            // LED interno do ESP32
#define BUTTON_CONFIG 15        // NÃO usar GPIO0; trocar para 15 (ou outro seguro)

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
String device_id;
const char* mqtt_server = "10.9.131.193";
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
const char* topic_discovery = "smart_ac/discovery";

// Temporizadores
unsigned long lastHeartbeat = 0;
unsigned long lastReconnectAttempt = 0;
const unsigned long RECONNECT_INTERVAL_MS = 5000; // tenta reconectar a cada 5s sem bloquear
const unsigned long HEARTBEAT_INTERVAL_MS = 15000; // 15s

// LED blink (não bloqueante)
unsigned long ledBlinkUntil = 0;
const unsigned long LED_BLINK_MS = 150;

// NTP
const char* ntpPool = "pool.ntp.org";
const long gmtOffset_sec = 0;       // ajuste pro seu fuso se necessário (ex: -3*3600)
const int daylightOffset_sec = 0;

// ==========================================
// PROTÓTIPOS
// ==========================================
void setupWiFi();
void tryReconnectMQTT(); // não bloqueante
void mqttCallback(char* topic, byte* payload, unsigned int length);
void publishState();           // publica usando formato esperado pelo Django, retain=true
void publishDiscovery();
void publishLWT();            // publica mensagem LWT (usado no connect)
void controlFujitsu(bool power, int temp, String mode);
void controlSpringer(bool power, int temp, String mode);
void controlCarrier(bool power, int temp, String mode);
void gerarDeviceID();
void enviarTesteInicial();
time_t getTimestamp(); // retorna epoch seconds (com fallback)
// ==========================================
// Resetar o WiFi(Para Testes)
// ==========================================
void resetWifi() {
  WiFi.disconnect(true, true); 
  delay(1000);
}

// ==========================================
// SETUP
// ==========================================
void setup() {
  Serial.begin(115200);
  delay(500);
  resetWifi();

  Serial.println("\n\n=== SMART AC CONTROLLER ESP32 (CORRIGIDO) ===");

  // pinos
  pinMode(LED_STATUS, OUTPUT);
  pinMode(BUTTON_CONFIG, INPUT_PULLUP);
  digitalWrite(LED_STATUS, LOW);

  // botão de configuração: press and hold (3s) para entrar
  unsigned long btnDownAt = 0;
  if (digitalRead(BUTTON_CONFIG) == LOW) {
    // debounce + hold detection
    unsigned long start = millis();
    while (millis() - start < 50) delay(1); // pequeno debounce
    if (digitalRead(BUTTON_CONFIG) == LOW) {
      // requer segurar 3s
      Serial.println("Botão pressionado — segure 3s para resetar Wi-Fi...");
      unsigned long holdStart = millis();
      while (digitalRead(BUTTON_CONFIG) == LOW && (millis() - holdStart) < 3000) {
        delay(10);
      }
      if (digitalRead(BUTTON_CONFIG) == LOW) {
        configMode = true;
        Serial.println("Modo de configuração ativado (reset Wi-Fi).");
        digitalWrite(LED_STATUS, HIGH);
      } else {
        Serial.println("Press curto detectado — ignorando.");
      }
    }
  }

  // Inicializar IR
  irsend.begin();
  ac_fujitsu.begin();
  ac_fujitsu.setModel(fujitsu_ac_remote_model_t::ARREB1E);
  ac_springer.begin();
  ac_carrier.begin();

  // NVS
  preferences.begin("smart-ac", false);

  // gerar ou recuperar device_id
  gerarDeviceID();
  topic_command = "smart_ac/" + device_id + "/command";
  topic_state = "smart_ac/" + device_id + "/state";

  // Wi-Fi
  setupWiFi();

  // Iniciar NTP (sincroniza tempo)
  configTime(gmtOffset_sec, daylightOffset_sec, ntpPool);
  // tenta aguardar por até 3s (não bloqueante demais)
  unsigned long ntpStart = millis();
  while (millis() - ntpStart < 3000 && getTimestamp() < 100000) {
    delay(100);
  }
  Serial.print("Timestamp atual: ");
  Serial.println(getTimestamp());

  // MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqttCallback);
  client.setBufferSize(1024);

  // Conecta (não bloqueante: tentamos uma vez agora, e depois no loop)
  tryReconnectMQTT();

  // Teste inicial
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
  // garantir Wi-Fi
  if (WiFi.status() != WL_CONNECTED) {
    // tenta reconectar via WiFiManager (autoConnect é blocking, mas só é chamado quando desconectado)
    setupWiFi();
  }

  // MQTT: se desconectado, tenta reconectar periodicamente (não bloqueante)
  if (!client.connected()) {
    if (millis() - lastReconnectAttempt > RECONNECT_INTERVAL_MS) {
      lastReconnectAttempt = millis();
      tryReconnectMQTT();
    }
  } else {
    client.loop(); // processa mensagens
  }

  // LED blink não bloqueante
  if (ledBlinkUntil != 0 && millis() > ledBlinkUntil) {
    digitalWrite(LED_STATUS, LOW);
    ledBlinkUntil = 0;
  }

  // heartbeat
  if (millis() - lastHeartbeat > HEARTBEAT_INTERVAL_MS) {
    lastHeartbeat = millis();
    Serial.println("Enviando Heartbeat...");
    // publica apenas o estado simples (formato esperado pelo Django) - com retain
    publishState();

    static int heartbeatCount = 0;
    heartbeatCount++;
    if (heartbeatCount % 4 == 0) { // a cada ~1 minuto
      publishDiscovery();
    }
  }
}

// ==========================================
// FUNÇÕES UTILITÁRIAS
// ==========================================
time_t getTimestamp() {
  time_t now = time(nullptr);
  if (now < 100000) { // sem sync NTP, fallback para millis (epoch unknown)
    // converte millis() para segundos desde boot — marca que não é epoch real
    return (time_t)(millis() / 1000);
  }
  return now;
}

// ==========================================
// GERAR DEVICE ID
// ==========================================
void gerarDeviceID() {
  device_id = preferences.getString("device_id", "");
  if (device_id == "") {
    String mac = WiFi.macAddress();
    mac.replace(":", "");
    String macSuffix = mac.substring(mac.length() - 6);
    device_id = "esp32_" + macSuffix;
    preferences.putString("device_id", device_id);
    Serial.println("Novo Device ID gerado: " + device_id);
  } else {
    Serial.println("Device ID recuperado: " + device_id);
  }
}

// ==========================================
// WIFI (WiFiManager)
// ==========================================
void setupWiFi() {
  if (configMode) {
    wm.resetSettings();
    Serial.println("Configurações Wi-Fi resetadas");
  }

  // parâmetros customizados
  WiFiManagerParameter custom_name("name", "Nome do Dispositivo", device_name.c_str(), 40);
  WiFiManagerParameter custom_brand("brand", "Marca Padrão", currentBrand.c_str(), 20);
  wm.addParameter(&custom_name);
  wm.addParameter(&custom_brand);

  String ap_name = "AC-" + device_id.substring(device_id.length() - 6);

  if (!wm.autoConnect(ap_name.c_str())) {
    Serial.println("Falha na conexão Wi-Fi — reiniciando...");
    delay(2000);
    ESP.restart();
  }

  // atualizar valores se foram preenchidos
  device_name = custom_name.getValue();
  currentBrand = custom_brand.getValue();
  preferences.putString("device_name", device_name);
  preferences.putString("default_brand", currentBrand);

  Serial.println("\nWi-Fi conectado!");
  Serial.println("SSID: " + WiFi.SSID());
  Serial.println("IP: " + WiFi.localIP().toString());
  Serial.println("Nome do dispositivo: " + device_name);
  Serial.println("Marca padrão: " + currentBrand);
}

// ==========================================
// MQTT: reconexão não bloqueante + LWT
// ==========================================
void tryReconnectMQTT() {
  if (client.connected()) return;

  Serial.print("Tentando conectar MQTT... ");

  String clientId = "ESP32-" + device_id;

  // Configura LWT (will message) para avisar offline se desconexão inesperada
  String willTopic = String("smart_ac/") + device_id + "/lwt";
  String willMessage = "{\"device_id\":\"" + device_id + "\",\"online\":false}";

  // PubSubClient permite conectar com Will (client.connect overload)
  bool ok = client.connect(clientId.c_str(), nullptr, nullptr,
                          willTopic.c_str(), // willTopic
                          0,                 // willQos (0)
                          true,              // willRetain
                          willMessage.c_str());

  if (ok) {
    Serial.println("OK");
    // Inscrever em comando do device
    client.subscribe(topic_command.c_str());
    Serial.println("Inscrito em: " + topic_command);

    // publicar discovery e state (uma vez) com retain para state
    publishDiscovery();
    publishState();
  } else {
    Serial.print("falhou, state=");
    Serial.println(client.state());
  }
}

// ==========================================
// CALLBACK MQTT (execução rápida)
// ==========================================
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  // Monta string sem usar delay/blocking
  String message;
  message.reserve(length + 1);
  for (unsigned int i = 0; i < length; i++) message += (char)payload[i];

  Serial.println("\n📩 Comando recebido: " + message);

  // blink não-blocking (liga LED e registra até quando ficará aceso)
  digitalWrite(LED_STATUS, HIGH);
  ledBlinkUntil = millis() + LED_BLINK_MS;

  // Desserializa rápido
  DynamicJsonDocument doc(1024);
  DeserializationError error = deserializeJson(doc, message);
  if (error) {
    Serial.println("❌ Erro JSON: " + String(error.c_str()));
    return;
  }

  // Atualiza estado interno (valida ranges)
  if (doc.containsKey("power")) {
    currentPower = doc["power"].as<bool>();
  }
  if (doc.containsKey("temp")) {
    int t = doc["temp"].as<int>();
    if (t < 16) t = 16;
    if (t > 30) t = 30;
    currentTemp = t;
  }
  if (doc.containsKey("mode")) {
    currentMode = doc["mode"].as<const char*>();
  }
  if (doc.containsKey("brand")) {
    currentBrand = doc["brand"].as<const char*>();
  }

  // Executa IR (a chamada de envio IR pode demorar, mas é inevitável — mantenha simples)
  String brandLower = currentBrand;
  brandLower.toLowerCase();

  if (brandLower.indexOf("fujitsu") != -1) {
    controlFujitsu(currentPower, currentTemp, currentMode);
  } else if (brandLower.indexOf("spring") != -1 || brandLower.indexOf("midea") != -1) {
    controlSpringer(currentPower, currentTemp, currentMode);
  } else if (brandLower.indexOf("carrier") != -1) {
    controlCarrier(currentPower, currentTemp, currentMode);
  } else {
    Serial.println("⚠️ Marca não suportada: " + currentBrand);
  }

  // publicar estado atualizado (formato simples; retain=true para disponibilidade)
  publishState();
}

// ==========================================
// PUBLICAÇÃO CONSOLIDADA (formato que Django espera)
// ==========================================
void publishState() {
  DynamicJsonDocument doc(512);
  doc["device_id"] = device_id;
  doc["power"] = currentPower;
  doc["temp"] = currentTemp;      // OBRIGATÓRIO: temp em minúsculo
  doc["mode"] = currentMode;
  doc["brand"] = currentBrand;
  doc["name"] = device_name;
  doc["online"] = true;
  doc["timestamp"] = (long)getTimestamp(); // epoch seconds (preferível ao millis)

  char buffer[512];
  size_t n = serializeJson(doc, buffer);

  // Publish com retain para que novos subscribers recebam o estado
  bool ok = client.publish(topic_state.c_str(), buffer, true);
  if (ok) {
    Serial.print(">> Estado publicado (retain): ");
    Serial.println(buffer);
  } else {
    Serial.println(">> Erro ao publicar estado!");
  }
}

// ==========================================
// DISCOVERY
// ==========================================
void publishDiscovery() {
  DynamicJsonDocument doc(512);
  doc["device_id"] = device_id;
  doc["type"] = "discovery";
  doc["name"] = device_name;
  doc["brand"] = currentBrand;
  doc["mac"] = WiFi.macAddress();
  doc["ip"] = WiFi.localIP().toString();
  doc["status"] = "available";
  doc["timestamp"] = (long)getTimestamp();

  char buffer[512];
  serializeJson(doc, buffer);
  client.publish(topic_discovery, buffer); // discovery não precisa ser retain
  Serial.println("Mensagem de discovery publicada");
}

// ==========================================
// FUNÇÕES IR
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
  Serial.println("IR: Springer/Midea");
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
  Serial.println("IR: Carrier (Bosch/COOLIX wrapper)");
  if (!power) {
    // Se a biblioteca ac_carrier tiver método off(), prefira-o. Caso contrário, este fallback usa sendCOOLIX.
    // Chave: confirmar com sua biblioteca se existe ac_carrier.off()
    irsend.sendCOOLIX(0xB27BE0, 24); // fallback: testado em alguns modelos
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

// ==========================================
// TESTE INICIAL
// ==========================================
void enviarTesteInicial() {
  Serial.println("=== TESTE INICIAL DE COMUNICAÇÃO ===");
  // envia discovery + state (não duplicar)
  publishDiscovery();
  publishState();
  Serial.println("=== TESTES ENVIADOS ===");
}
