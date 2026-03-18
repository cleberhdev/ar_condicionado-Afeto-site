# mqtt_listener.py - VERSÃO CORRIGIDA COM WATCHDOG
import os
import django
import json
import time
import paho.mqtt.client as mqtt
from datetime import datetime, timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Device

MQTT_BROKER = "broker.hivemq.com"
MQTT_PORT = 1883

# Tópicos
TOPIC_STATE = "smart_ac/+/state"
TOPIC_DISCOVERY = "smart_ac/discovery"


# ============================================================
#  ON CONNECT
# ============================================================
def on_connect(client, userdata, flags, rc):
    print(f"✅ Ouvinte MQTT conectado!")
    client.subscribe(TOPIC_STATE)
    client.subscribe(TOPIC_DISCOVERY)
    print(f"📡 Monitorando status: {TOPIC_STATE}")
    print(f"🔍 Monitorando discovery: {TOPIC_DISCOVERY}")


# ============================================================
#  ON MESSAGE
# ============================================================
def on_message(client, userdata, msg):
    try:
        payload = msg.payload.decode()
        data = json.loads(payload)
        device_id = data.get("device_id")

        if not device_id:
            print("⚠️ Payload sem device_id ignorado")
            return

        print(f"\n📩 Mensagem recebida de {device_id}")

        msg_type = data.get("type")

        if msg_type == "discovery":
            handle_discovery(data)
        else:
            handle_status_update(data)

    except Exception as e:
        print(f"❌ Erro ao processar mensagem: {e}")


# ============================================================
#  DISCOVERY — quando a placa liga pela primeira vez
# ============================================================
def handle_discovery(data):
    """Registra ou atualiza dispositivos novos detectados via MQTT."""
    device_id = data["device_id"]
    device_name = data.get("name", f"ESP32-{device_id[-6:]}")
    brand = data.get("brand", "Carrier")

    try:
        device = Device.objects.filter(device_id=device_id).first()

        if device:
            # Atualiza status básico
            device.is_online = True
            device.last_seen = timezone.now()

            # ⚠️ NÃO alterar dados definidos pelo usuário (room, wifi, etc)
            # Atualizações seguras:
            if not device.name:
                device.name = device_name

            if not device.brand:
                device.brand = brand

            device.save()
            print(f"🔄 Dispositivo atualizado (discovery): {device_name} ({device_id})")

        else:
            # Criar dispositivo não cadastrado, aguardando usuário completar
            device = Device.objects.create(
                device_id=device_id,
                name=device_name,
                brand=brand,
                room="Não cadastrado",
                is_online=True,
                power=False,
                temperature=24,
                mode="cool",
                wifi_ssid="",
                wifi_password="",
                is_registered=False,      # só vira True quando o usuário completa o cadastro via API
                is_configured=False,
                last_seen=timezone.now()
            )
            print(f"🆕 Novo dispositivo descoberto: {device_name} ({device_id})")

    except Exception as e:
        print(f"❌ Erro ao processar discovery: {e}")


# ============================================================
#  STATUS UPDATE — atualizações normais do ESP32
# ============================================================
def handle_status_update(data):
    """Atualizações periódicas de status enviadas pela placa."""
    device_id = data["device_id"]

    try:
        device = Device.objects.filter(device_id=device_id).first()

        if not device:
            print(f"⚠️ Status recebido para device desconhecido → tratando como discovery")
            handle_discovery(data)
            return

        # Atualizar status
        device.is_online = True
        device.last_seen = timezone.now()

        # Recebe sempre "temp" do ESP32
        if "temp" in data:
            device.temperature = data["temp"]

        if "power" in data:
            device.power = data["power"]

        if "mode" in data:
            device.mode = data["mode"]

        device.save()

        print(f"📊 Status atualizado: {device.name} — Temp: {device.temperature}°C  Power: {device.power}")

    except Exception as e:
        print(f"❌ Erro ao atualizar status: {e}")


# ============================================================
#  CONFIGURAÇÃO DO CLIENTE MQTT E CÃO DE GUARDA
# ============================================================
client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message

print("\n--- INICIANDO SISTEMA DE ESCUTA MQTT ---\n")
client.connect(MQTT_BROKER, MQTT_PORT, 60)

# Inicia o loop em segundo plano para liberar a thread principal
client.loop_start()

print("⏱️ Iniciando o Cão de Guarda (Watchdog) de conexões...")

try:
    # Loop infinito que roda a cada 30 segundos
    while True:
        time.sleep(30)
        
        # Calcula qual era a hora exata 60 segundos atrás
        limite_tempo = timezone.now() - timedelta(seconds=60)
        
        # Puxa do banco todas as placas que estão marcadas como Online, 
        # MAS que não mandam sinal há mais de 60 segundos
        placas_fantasmas = Device.objects.filter(
            is_online=True, 
            last_seen__lt=limite_tempo
        )
        
        for placa in placas_fantasmas:
            placa.is_online = False
            placa.save()
            print(f"⚠️ ALERTA: Placa {placa.name} ({placa.device_id}) caiu! Marcada como OFFLINE.")

except KeyboardInterrupt:
    print("\nDesligando o ouvinte MQTT...")
    client.loop_stop()
    client.disconnect()