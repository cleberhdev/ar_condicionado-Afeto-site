from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Device
from .serializers import DeviceSerializer, CommandSerializer, DeviceCreateSerializer
from .mqtt_helper import send_command_to_esp32, send_wifi_config
import time

class DeviceViewSet(viewsets.ModelViewSet):
    """
    CRUD completo dos dispositivos.
    GET /api/devices/ -> Lista todos
    POST /api/devices/ -> Cria novo
    """
    queryset = Device.objects.all()
    
    def get_serializer_class(self):
        """Usa serializer diferente para criação"""
        if self.action == 'create':
            return DeviceCreateSerializer
        return DeviceSerializer

    def perform_create(self, serializer):
        """
        Sobrescreve para enviar configurações Wi-Fi após criar dispositivo
        """
        device = serializer.save()
        
        # Se foi fornecido SSID e senha, envia para ESP32
        if device.wifi_ssid and device.wifi_password:
            print(f"📡 Enviando configuração Wi-Fi para {device.device_id}")
            
            # Monta payload de configuração
            config_payload = {
                "type": "config",
                "wifi_ssid": device.wifi_ssid,
                "wifi_password": device.wifi_password,
                "device_name": device.name,
                "brand": device.brand,
                "timestamp": int(time.time())
            }
            
            # Tenta enviar configuração via MQTT
            success = send_wifi_config(device.device_id, config_payload)
            
            if success:
                print(f"✅ Configuração Wi-Fi enviada para {device.device_id}")
                # Marca como configurado
                device.is_configured = True
                device.save()
            else:
                print(f"❌ Falha ao enviar configuração para {device.device_id}")
                device.is_configured = False
                device.save()
        else:
            print(f"⚠️ Dispositivo {device.device_id} criado sem configuração Wi-Fi")

    def perform_update(self, serializer):
        """
        Sobrescreve para enviar configurações Wi-Fi quando atualizadas
        """
        old_device = self.get_object()
        device = serializer.save()
        
        # Verifica se SSID ou senha foram alterados
        wifi_changed = (
            old_device.wifi_ssid != device.wifi_ssid or
            old_device.wifi_password != device.wifi_password
        )
        
        # Se houve alteração nas credenciais Wi-Fi, envia para ESP32
        if wifi_changed and device.wifi_ssid and device.wifi_password:
            print(f"📡 Atualizando configuração Wi-Fi para {device.device_id}")
            
            config_payload = {
                "type": "config",
                "wifi_ssid": device.wifi_ssid,
                "wifi_password": device.wifi_password,
                "device_name": device.name,
                "brand": device.brand,
                "timestamp": int(time.time())
            }
            
            success = send_wifi_config(device.device_id, config_payload)
            
            if success:
                print(f"✅ Configuração Wi-Fi atualizada para {device.device_id}")
                device.is_configured = True
                device.save()
            else:
                print(f"❌ Falha ao atualizar configuração para {device.device_id}")
                device.is_configured = False
                device.save()

    @action(detail=True, methods=['post'])
    def control(self, request, pk=None):
        """
        Endpoint para enviar comandos para a placa.
        POST /api/devices/{id}/control/
        Body: { "power": true, "temp": 22, "mode": "cool" }
        """
        device = self.get_object()
        
        # Aceita tanto 'temp' quanto 'temperature'
        data = request.data.copy()
        if 'temp' in data and 'temperature' not in data:
            data['temperature'] = data['temp']
        
        serializer = CommandSerializer(data=data)
        
        if serializer.is_valid():
            data = serializer.validated_data
            
            # 1. Atualiza o banco de dados
            device.power = data.get('power', device.power)
            
            # Aceita temperature ou temp
            if 'temperature' in data:
                device.temperature = data['temperature']
            elif 'temp' in data:
                device.temperature = data['temp']
                
            device.mode = data.get('mode', device.mode)
            device.last_command = timezone.now()
            device.save()

            # 2. Monta o payload para ESP32
            payload = {
                "power": device.power,
                "temp": device.temperature,  # Usa 'temp' para ESP32
                "mode": device.mode,
                "brand": device.brand
            }

            # 3. Envia via MQTT
            success = send_command_to_esp32(device.device_id, payload)

            if success:
                return Response({
                    "status": "Comando enviado", 
                    "current_state": payload,
                    "device_id": device.device_id,
                    "db_id": device.id
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    "error": "Falha ao conectar com Broker MQTT",
                    "device_id": device.device_id
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def reconfigure(self, request, pk=None):
        """
        Endpoint para reenviar configurações Wi-Fi para a placa.
        POST /api/devices/{id}/reconfigure/
        """
        device = self.get_object()
        
        if not device.wifi_ssid or not device.wifi_password:
            return Response({
                "error": "Dispositivo não tem SSID ou senha configurados"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        print(f"🔄 Reenviando configuração Wi-Fi para {device.device_id}")
        
        config_payload = {
            "type": "config",
            "wifi_ssid": device.wifi_ssid,
            "wifi_password": device.wifi_password,
            "device_name": device.name,
            "brand": device.brand,
            "timestamp": int(time.time())
        }
        
        success = send_wifi_config(device.device_id, config_payload)
        
        if success:
            device.is_configured = True
            device.save()
            return Response({
                "status": "Configuração reenviada",
                "device_id": device.device_id,
                "is_configured": device.is_configured
            }, status=status.HTTP_200_OK)
        else:
            device.is_configured = False
            device.save()
            return Response({
                "error": "Falha ao enviar configuração",
                "device_id": device.device_id,
                "is_configured": device.is_configured
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    @action(detail=False, methods=['get'])
    def unregistered(self, request):
        """
        Lista dispositivos detectados mas não cadastrados
        GET /api/devices/unregistered/
        """
        unregistered_devices = Device.objects.filter(
            is_registered=False,
            is_online=True
        )
        serializer = self.get_serializer(unregistered_devices, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def offline(self, request):
        """
        Lista dispositivos offline
        GET /api/devices/offline/
        """
        offline_devices = Device.objects.filter(is_online=False)
        serializer = self.get_serializer(offline_devices, many=True)
        return Response(serializer.data)