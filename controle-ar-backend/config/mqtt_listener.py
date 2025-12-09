# mqtt_listener.py - ADICIONAR ESTAS FUNÇÕES
import os
import django
import json
import paho.mqtt.client as mqtt
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Device

MQTT_BROKER = "broker.hivemq.com"
MQTT_PORT = 1883

# Tópicos para monitorar
TOPIC_STATE = "smart_ac/+/state"
TOPIC_DISCOVERY = "smart_ac/discovery"

def on_connect(client, userdata, flags, rc):
    print(f"✅ Ouvinte MQTT conectado!")
    client.subscribe(TOPIC_STATE)
    client.subscribe(TOPIC_DISCOVERY)
    print(f"📡 Monitorando: {TOPIC_STATE}")
    print(f"🔍 Monitorando: {TOPIC_DISCOVERY}")

def on_message(client, userdata, msg):
    try:
        payload = msg.payload.decode()
        data = json.loads(payload)
        device_id = data.get('device_id')
        
        if not device_id:
            return
        
        print(f"\n📩 Mensagem recebida de {device_id}")
        
        # Verificar tipo de mensagem
        msg_type = data.get('type', 'status')
        
        if msg_type == 'discovery':
            handle_discovery(data)
        else:
            handle_status_update(data)
            
    except Exception as e:
        print(f"❌ Erro ao processar mensagem: {e}")

def handle_discovery(data):
    """Lida com mensagens de descoberta de novos dispositivos"""
    device_id = data['device_id']
    device_name = data.get('name', f"ESP32-{device_id[-6:]}")
    brand = data.get('brand', 'Carrier')
    
    try:
        # Verificar se dispositivo já existe
        device = Device.objects.filter(device_id=device_id).first()
        
        if device:
            # Atualizar dispositivo existente
            device.is_online = True
            device.name = device_name
            device.brand = brand
            device.save()
            print(f"🔄 Dispositivo atualizado: {device_name} ({device_id})")
        else:
            # Criar novo dispositivo com status "não cadastrado"
            device = Device.objects.create(
                device_id=device_id,
                name=device_name,
                room="Não cadastrado",
                brand=brand,
                is_online=True,
                power=False,
                temperature=24,
                mode="cool",
                wifi_ssid="",
                wifi_password="",
                is_registered=False  # Novo campo para indicar se foi cadastrado manualmente
            )
            print(f"🆕 Novo dispositivo detectado: {device_name} ({device_id})")
            
    except Exception as e:
        print(f"❌ Erro ao processar descoberta: {e}")

def handle_status_update(data):
    """Lida com atualizações de status normais"""
    device_id = data['device_id']
    
    try:
        device = Device.objects.get(device_id=device_id)
        
        # Atualizar status
        device.is_online = True
        device.power = data.get('power', device.power)
        device.temperature = data.get('temp', device.temperature)
        device.mode = data.get('mode', device.mode)
        device.last_seen = datetime.now()
        device.save()
        
        print(f"📊 Status atualizado: {device.name} - Temp: {device.temperature}°C")
        
    except Device.DoesNotExist:
        # Dispositivo não cadastrado ainda, tratar como descoberta
        handle_discovery(data)
    except Exception as e:
        print(f"❌ Erro ao atualizar status: {e}")

# Configurar e iniciar cliente
client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message

print("--- INICIANDO SISTEMA DE ESCUTA MQTT ---")
client.connect(MQTT_BROKER, MQTT_PORT, 60)
client.loop_forever()