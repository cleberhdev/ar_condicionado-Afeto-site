#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <IRremoteESP8266.h>
#include <IRsend.h>

// --- BIBLIOTECAS DE MARCAS ---
#include <ir_Fujitsu.h> 
#include <ir_Coolix.h>  
#include <ir_Bosch.h>   

// ==========================================
// CONFIGURAÇÕES DA SUA CASA
// ==========================================
const char* ssid = "VIRTEX_A";        
const char* password = "lamar338";    

// O ID tem que ser IGUAL ao do banco de dados do Django
const char* device_id = "esp32_1765205238979";   

const char* mqtt_server = "broker.hivemq.com"; 
const int mqtt_port = 1883;
// ==========================================

// Tópicos
String topic_command = String("smart_ac/") + device_id + "/command";
String topic_state = String("smart_ac/") + device_id + "/state"; // <--- NOVO: Canal de retorno

// Hardware
const uint16_t kIrLed = 4; 
#define LED_STATUS 2       

// Objetos IR
IRsend irsend(kIrLed);
IRFujitsuAC ac_fujitsu(kIrLed);
IRCoolixAC ac_springer(kIrLed);
IRBosch144AC ac_carrier(kIrLed); 

WiFiClient espClient;
PubSubClient client(espClient);

// --- ESTADO ATUAL DA PLACA ---
bool currentPower = false;
int currentTemp = 24;
String currentMode = "cool";
String currentBrand = "Carrier"; // Padrão
unsigned long lastHeartbeat = 0;

// Funções
void setupWiFi();
void reconnectMQTT();
void mqttCallback(char* topic, byte* payload, unsigned int length);
void publicarStatus(); // <--- A MÁGICA ESTÁ AQUI
void controlFujitsu(bool power, int temp, String mode);
void controlSpringer(bool power, int temp, String mode);
void controlCarrier(bool power, int temp, String mode);

void setup() {
  Serial.begin(115200);
  pinMode(LED_STATUS, OUTPUT);

  irsend.begin();
  ac_fujitsu.begin(); ac_fujitsu.setModel(fujitsu_ac_remote_model_t::ARREB1E);
  ac_springer.begin();
  ac_carrier.begin();

  Serial.println("\n\n=== INICIANDO ===");
  setupWiFi();

  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqttCallback);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) setupWiFi();
  if (!client.connected()) reconnectMQTT();
  
  client.loop();

  // --- HEARTBEAT ---
  // A cada 30 segundos, avisa que está vivo
  if (millis() - lastHeartbeat > 30000) {
    lastHeartbeat = millis();
    Serial.println("Enviando Heartbeat (Sinal de Vida)...");
    publicarStatus();
  }
}

// --- FUNÇÃO QUE AVISA O SITE QUE ESTÁ ONLINE ---
void publicarStatus() {
  DynamicJsonDocument doc(512);
  
  // Monta o JSON de resposta
  doc["device_id"] = device_id;
  doc["is_online"] = true;       // O segredo!
  doc["power"] = currentPower;
  doc["temp"] = currentTemp;
  doc["mode"] = currentMode;
  doc["brand"] = currentBrand;

  char buffer[512];
  serializeJson(doc, buffer);

  // Publica no tópico de estado
  if (client.publish(topic_state.c_str(), buffer)) {
    Serial.println(">> Status enviado para o Broker: " + String(buffer));
  } else {
    Serial.println(">> Erro ao enviar status!");
  }
}

void setupWiFi() {
  delay(10);
  Serial.print("Conectando Wi-Fi: "); Serial.println(ssid);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int tentativas = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); Serial.print(".");
    digitalWrite(LED_STATUS, !digitalRead(LED_STATUS));
    tentativas++;
    if(tentativas > 40) ESP.restart();
  }
  digitalWrite(LED_STATUS, LOW);
  Serial.println("\nWi-Fi OK! IP: " + WiFi.localIP().toString());
}

void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Conectando MQTT...");
    String clientId = "ESP32-" + String(random(0xffff), HEX);
    if (client.connect(clientId.c_str())) {
      Serial.println(" CONECTADO!");
      client.subscribe(topic_command.c_str());
      
      // Assim que conecta, já avisa que tá online!
      publicarStatus(); 
    } else {
      Serial.print(" Falha rc="); Serial.print(client.state());
      delay(5000);
    }
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (int i = 0; i < length; i++) message += (char)payload[i];
  Serial.println("\ncomando <- " + message);

  DynamicJsonDocument doc(1024);
  deserializeJson(doc, message);

  // Atualiza estado interno
  currentPower = doc["power"];
  currentTemp = doc["temp"];
  currentMode = doc["mode"].as<String>();
  currentBrand = doc["brand"].as<String>();
  String brandLower = currentBrand;
  brandLower.toLowerCase();

  // Pisca LED
  digitalWrite(LED_STATUS, HIGH); delay(200); digitalWrite(LED_STATUS, LOW);

  // Executa Ação IR
  if (brandLower.indexOf("fujitsu") != -1) controlFujitsu(currentPower, currentTemp, currentMode);
  else if (brandLower.indexOf("spring") != -1 || brandLower.indexOf("midea") != -1) controlSpringer(currentPower, currentTemp, currentMode);
  else if (brandLower.indexOf("carrier") != -1) controlCarrier(currentPower, currentTemp, currentMode);
  else Serial.println("Marca desconhecida!");

  // Avisa o site que o comando foi recebido e o estado mudou
  publicarStatus();
}

// --- DRIVERS ---

void controlFujitsu(bool power, int temp, String mode) {
  Serial.println("IR: Fujitsu");
  if (power) {
    ac_fujitsu.on(); ac_fujitsu.setTemp(temp);
    if (mode == "cool") ac_fujitsu.setMode(kFujitsuAcModeCool);
    else if (mode == "heat") ac_fujitsu.setMode(kFujitsuAcModeHeat);
    else if (mode == "fan") ac_fujitsu.setMode(kFujitsuAcModeFan);
    else if (mode == "dry") ac_fujitsu.setMode(kFujitsuAcModeDry);
    else ac_fujitsu.setMode(kFujitsuAcModeAuto);
  } else ac_fujitsu.off();
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