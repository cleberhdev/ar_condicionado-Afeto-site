import paho.mqtt.publish as publish
import json
import time

# Configurações do Broker
MQTT_BROKER = "broker.hivemq.com"
MQTT_PORT = 1883

def send_command_to_esp32(device_id, payload):
    """
    Envia um comando para a ESP32 via MQTT.
    Tópico: smart_ac/{device_id}/command
    """
    topic = f"smart_ac/{device_id}/command"
    
    # Garante que o payload tem todos os campos necessários
    payload.setdefault("brand", "Carrier")
    payload.setdefault("timestamp", int(time.time()))
    
    message = json.dumps(payload)
    
    try:
        print(f"📡 Enviando comando para {topic}: {message}")
        publish.single(
            topic, 
            payload=message, 
            hostname=MQTT_BROKER, 
            port=MQTT_PORT,
            qos=1  # Quality of Service nível 1 (pelo menos uma entrega)
        )
        return True
    except Exception as e:
        print(f"❌ Erro ao publicar comando no MQTT: {e}")
        return False

def send_wifi_config(device_id, config_payload):
    """
    Envia configuração Wi-Fi para a ESP32 via MQTT.
    Tópico: smart_ac/{device_id}/config
    """
    topic = f"smart_ac/{device_id}/config"
    
    message = json.dumps(config_payload)
    
    try:
        print(f"📡 Enviando configuração para {topic}")
        print(f"📦 Payload: {message}")
        
        # Envia com QoS 2 para garantir entrega
        publish.single(
            topic, 
            payload=message, 
            hostname=MQTT_BROKER, 
            port=MQTT_PORT,
            qos=2,  # Quality of Service nível 2 (exatamente uma entrega)
            retain=False
        )
        
        # Envia novamente após 2 segundos para garantir
        time.sleep(2)
        publish.single(
            topic, 
            payload=message, 
            hostname=MQTT_BROKER, 
            port=MQTT_PORT,
            qos=2
        )
        
        return True
    except Exception as e:
        print(f"❌ Erro ao enviar configuração via MQTT: {e}")
        return False