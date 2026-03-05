import paho.mqtt.client as mqtt
import json

def on_connect(client, userdata, flags, rc):
    print("Conectado, código:", rc)
    client.subscribe("smart_ac/discovery")
    client.subscribe("smart_ac/+/state")

def on_message(client, userdata, msg):
    print(f"{msg.topic}: {msg.payload.decode()}")

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message
client.connect("broker.hivemq.com", 1883, 60)
client.loop_forever()