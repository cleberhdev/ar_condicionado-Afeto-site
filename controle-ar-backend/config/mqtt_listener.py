import os
import django
import json
import paho.mqtt.client as mqtt
from datetime import datetime

# 1. Configura o Django para poder mexer no Banco de Dados
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Device

# --- CONFIGURAÇÕES IGUAIS ÀS DA PLACA ---
MQTT_BROKER = "broker.hivemq.com"
MQTT_PORT = 1883
# O '+' significa que ele ouve o estado de TODAS as placas
TOPIC_WILDCARD = "smart_ac/+/state"

def on_connect(client, userdata, flags, rc):
    print(f"✅ OUVINTE CONECTADO! Monitorando: {TOPIC_WILDCARD}")
    client.subscribe(TOPIC_WILDCARD)

def on_message(client, userdata, msg):
    try:
        payload = msg.payload.decode()
        print(f"\n📩 Status Recebido de {msg.topic}:")
        
        data = json.loads(payload)
        device_id = data.get('device_id')
        
        # Tenta achar a placa no banco e atualizar
        device = Device.objects.get(device_id=device_id)
        
        # --- ATUALIZA O BANCO ---
        device.is_online = True
        device.power = data.get('power', device.power)
        device.temperature = data.get('temp', device.temperature)
        device.mode = data.get('mode', device.mode)
        device.save()
        
        print(f"💾 Banco Atualizado: {device.name} está ONLINE (Temp: {device.temperature})")
            
    except Device.DoesNotExist:
        print(f"⚠️ Placa desconhecida: {device_id} (Cadastre no site primeiro!)")
    except Exception as e:
        print(f"❌ Erro: {e}")

# --- RODA O PROGRAMA ---
client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message

print("--- INICIANDO SISTEMA DE ESCUTA MQTT ---")
client.connect(MQTT_BROKER, MQTT_PORT, 60)
client.loop_forever()