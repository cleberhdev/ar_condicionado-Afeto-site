import paho.mqtt.publish as publish
import json
import os

# Configurações do Broker (Pode ser HiveMQ público para testes ou seu próprio Mosquitto)
# Em produção, use variáveis de ambiente!
MQTT_BROKER = "broker.hivemq.com" 
MQTT_PORT = 1883

def send_command_to_esp32(device_id, payload):
    """
    Envia um pacote JSON para a ESP32 via MQTT.
    """
    topic = f"smart_ac/{device_id}/command"
    
    # O payload deve bater com o que a ESP32 espera receber (igual definimos antes)
    # Ex: {"power": true, "temp": 23, "mode": "cool"}
    message = json.dumps(payload)
    
    try:
        print(f"Enviando MQTT para {topic}: {message}")
        publish.single(
            topic, 
            payload=message, 
            hostname=MQTT_BROKER, 
            port=MQTT_PORT
        )
        return True
    except Exception as e:
        print(f"Erro ao publicar no MQTT: {e}")
        return False