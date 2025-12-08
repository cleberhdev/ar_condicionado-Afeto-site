#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <IRremoteESP8266.h>
#include <IRsend.h>
#include <WiFiManager.h> // Configuração de Wi-Fi sem hardcode

// --- BIBLIOTECAS ESPECÍFICAS (Baseado nos seus anexos) ---
#include <ir_Fujitsu.h> // Para Fujitsu
#include <ir_Coolix.h>  // Para Springer Midea
#include <ir_Bosch.h>   // Para Carrier (Baseado no seu arquivo blynkIOT...Carrier...ino)

// --- CONFIGURAÇÕES DO DISPOSITIVO ---
// Este ID deve ser ÚNICO para cada placa e igual ao cadastrado no Django
char device_id[50] = "esp32_1765205238979"; 

// --- CONFIGURAÇÕES MQTT ---
const char* mqtt_server = "broker.hivemq.com"; 
const int mqtt_port = 1883;

// Tópicos
String topic_command;
String topic_state;

// --- HARDWARE ---
const uint16_t kIrLed = 4; // GPIO do LED IR (Ajuste conforme sua placa, geralmente 4 ou 22)
#define LED_STATUS 2       // LED da placa para feedback

// --- OBJETOS IR ---
IRsend irsend(kIrLed);
IRFujitsuAC ac_fujitsu(kIrLed);
IRCoolixAC ac_springer(kIrLed);
IRBosch144AC ac_carrier(kIrLed); // Carrier usa protocolo Bosch144 segundo seus arquivos

// --- REDE ---
WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  pinMode(LED_STATUS, OUTPUT);

  // 1. Inicializa IR
  irsend.begin();
  
  // Configura Fujitsu (Modelo ARREB1E conforme seu código)
  ac_fujitsu.begin();
  ac_fujitsu.setModel(fujitsu_ac_remote_model_t::ARREB1E);
  
  // Configura Springer (Coolix)
  ac_springer.begin();

  // Configura Carrier (Bosch)
  ac_carrier.begin();

  // 2. Conexão Wi-Fi (WiFiManager)
  // Se não conectar, cria uma rede "SmartAC-Config". Conecte nela para configurar.
  WiFiManager wm;
  Serial.println("Conectando ao WiFi...");
  digitalWrite(LED_STATUS, HIGH); // Liga LED enquanto conecta
  
  // wm.resetSettings(); // Descomente esta linha e upe 1 vez se quiser limpar o wifi salvo
  
  bool res = wm.autoConnect("SmartAC-Config"); // Nome da rede criada pela ESP

  if(!res) {
    Serial.println("Falha na conexão");
    ESP.restart();
  } 
  digitalWrite(LED_STATUS, LOW); // Apaga LED ao conectar
  Serial.println("WiFi Conectado!");

  // 3. Configura Tópicos com base no ID
  // Se quiser usar o MAC Address como ID automático, descomente abaixo:
  // String mac = WiFi.macAddress();
  // mac.replace(":", "");
  // strcpy(device_id, mac.c_str());
  
  topic_command = String("smart_ac/") + device_id + "/command";
  topic_state = String("smart_ac/") + device_id + "/state";
  
  Serial.print("ID do Dispositivo: "); Serial.println(device_id);
  Serial.print("Tópico de Comando: "); Serial.println(topic_command);

  // 4. Configura MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqttCallback);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
}

// --- FUNÇÃO DE RECONEXÃO MQTT ---
void reconnect() {
  while (!client.connected()) {
    Serial.print("Tentando conexão MQTT...");
    String clientId = "ESP32AC-";
    clientId += String(random(0xffff), HEX);
    
    if (client.connect(clientId.c_str())) {
      Serial.println("Conectado!");
      client.subscribe(topic_command.c_str());
      Serial.println("Inscrito em: " + topic_command);
    } else {
      Serial.print("Falha, rc=");
      Serial.print(client.state());
      Serial.println(" tentando novamente em 5s");
      delay(5000);
    }
  }
}

// --- CALLBACK: QUANDO CHEGA MENSAGEM DO DJANGO ---
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println("Recebido: " + message);

  // Parse do JSON
  DynamicJsonDocument doc(1024);
  DeserializationError error = deserializeJson(doc, message);

  if (error) {
    Serial.println("Erro no JSON!");
    return;
  }

  // Extrair dados
  bool power = doc["power"];
  int temp = doc["temp"];
  String modeStr = doc["mode"];   // "cool", "heat", "fan", "dry", "auto"
  String brand = doc["brand"];    // "Fujitsu", "Spring", "Carrier"
  
  // Normalizar nomes de marcas (maiúsculas/minúsculas)
  brand.toLowerCase();

  Serial.println("Processando para marca: " + brand);
  
  // Piscar LED para indicar comando recebido
  digitalWrite(LED_STATUS, HIGH);
  delay(100);
  digitalWrite(LED_STATUS, LOW);

  if (brand.indexOf("fujitsu") != -1) {
    controlFujitsu(power, temp, modeStr);
  } 
  else if (brand.indexOf("spring") != -1 || brand.indexOf("midea") != -1) {
    controlSpringer(power, temp, modeStr);
  }
  else if (brand.indexOf("carrier") != -1) {
    controlCarrier(power, temp, modeStr);
  }
  else {
    Serial.println("Marca desconhecida: " + brand);
  }
}

// --- CONTROLADORES ESPECÍFICOS ---

void controlFujitsu(bool power, int temp, String mode) {
  Serial.println("Enviando Fujitsu...");
  
  if (power) {
    ac_fujitsu.on();
    ac_fujitsu.setTemp(temp);
    
    if (mode == "cool") ac_fujitsu.setMode(kFujitsuAcModeCool);
    else if (mode == "heat") ac_fujitsu.setMode(kFujitsuAcModeHeat);
    else if (mode == "fan") ac_fujitsu.setMode(kFujitsuAcModeFan);
    else if (mode == "dry") ac_fujitsu.setMode(kFujitsuAcModeDry);
    else ac_fujitsu.setMode(kFujitsuAcModeAuto);
    
    ac_fujitsu.setFanSpeed(kFujitsuAcFanAuto); // Padrão
  } else {
    ac_fujitsu.off();
  }
  
  ac_fujitsu.send();
}

void controlSpringer(bool power, int temp, String mode) {
  // Protocolo Coolix (Springer Midea)
  Serial.println("Enviando Springer (Coolix)...");
  
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
  // Protocolo Bosch144 (Carrier)
  // Nota: Seus arquivos indicam que para DESLIGAR a Carrier usa Coolix (0xB27BE0)
  // Mas a biblioteca IRBosch144AC geralmente lida com isso. Vamos tentar via lib primeiro.
  
  Serial.println("Enviando Carrier (Bosch)...");
  
  ac_carrier.setPower(power);
  
  if (power) {
    ac_carrier.setTemp(temp);
    
    if (mode == "cool") ac_carrier.setMode(kBosch144Cool);
    else if (mode == "heat") ac_carrier.setMode(kBosch144Heat);
    else if (mode == "fan") ac_carrier.setMode(kBosch144Fan);
    else if (mode == "dry") ac_carrier.setMode(kBosch144Dry);
    else ac_carrier.setMode(kBosch144Auto);
  }

  ac_carrier.send();
}