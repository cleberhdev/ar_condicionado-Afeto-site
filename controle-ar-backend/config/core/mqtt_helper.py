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

    if not device_id:
        print("❌ device_id inválido ao enviar comando.")
        return False

    topic = f"smart_ac/{device_id}/command"

    # Garante chaves obrigatórias
    payload = payload.copy()  # evita mutar payload externo

    payload.setdefault("type", "command")
    payload.setdefault("brand", "Carrier")
    payload.setdefault("timestamp", int(time.time()))

    # Normalização de campos
    if "temperature" in payload and "temp" not in payload:
        payload["temp"] = payload["temperature"]

    # Remove campos que não devem ser enviados para o microcontrolador
    payload.pop("wifi_password", None)

    message = json.dumps(payload)

    try:
        print(f"📡 Enviando comando para {topic}: {message}")
        publish.single(
            topic,
            payload=message,
            hostname=MQTT_BROKER,
            port=MQTT_PORT,
            qos=1
        )
        return True
    except Exception as e:
        print(f"❌ Erro ao publicar comando no MQTT: {e}")
        return False


def send_wifi_config(device_id, config_payload):
    """
    Envia configuração Wi-Fi para a ESP32 via MQTT.
    Tópico: smart_ac/{device_id}/config

    O payload deve conter:
    {
        "ssid": "...",
        "password": "...",
        "type": "wifi_config"
    }
    """

    if not device_id:
        print("❌ device_id inválido ao enviar configuração Wi-Fi.")
        return False

    topic = f"smart_ac/{device_id}/config"

    config_payload = config_payload.copy()  # evitar mutar o dict original
    config_payload.setdefault("type", "wifi_config")
    config_payload.setdefault("timestamp", int(time.time()))

    # Normalização
    if "wifi_ssid" in config_payload and "ssid" not in config_payload:
        config_payload["ssid"] = config_payload.pop("wifi_ssid")

    if "wifi_password" in config_payload and "password" not in config_payload:
        config_payload["password"] = config_payload.pop("wifi_password")

    # Garantir que ssid e senha existam
    if not config_payload.get("ssid"):
        print("❌ SSID ausente no payload de configuração Wi-Fi.")
        return False

    message = json.dumps(config_payload)

    try:
        print(f"📡 Enviando configuração para {topic}")
        print(f"📦 Payload: {message}")

        # QoS 2 (entrega garantida)
        publish.single(
            topic,
            payload=message,
            hostname=MQTT_BROKER,
            port=MQTT_PORT,
            qos=2,
            retain=False
        )

        # Reenvio opcional para robustez
        time.sleep(1.5)
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
