from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q  # Importante para a lógica de filtro
from .models import Device
from .serializers import DeviceSerializer, CommandSerializer, DeviceCreateSerializer
from .mqtt_helper import send_command_to_esp32, send_wifi_config
import time

class DeviceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        AJUSTE: Retorna os aparelhos do usuário OU aparelhos sem dono (user=None).
        Isso permite que o usuário encontre a placa 'órfã' para editá-la (registrar).
        """
        user = self.request.user
        return Device.objects.filter(Q(user=user) | Q(user__isnull=True))
    
    def get_serializer_class(self):
        if self.action == 'create':
            return DeviceCreateSerializer
        return DeviceSerializer

    def perform_create(self, serializer):
        # Ao criar manualmente, já vincula ao usuário logado
        device = serializer.save(user=self.request.user, is_registered=True)
        self._send_wifi_setup(device)

    def perform_update(self, serializer):
        """
        AJUSTE: No momento do registro (PATCH), vinculamos o usuário logado 
        e marcamos como registrado.
        """
        # Se o dispositivo não tinha dono, ele passa a ser do usuário que enviou o PATCH
        device = serializer.save(user=self.request.user, is_registered=True)
        self._send_wifi_setup(device)

    def _send_wifi_setup(self, device):
        """Função auxiliar para evitar repetição de código de envio MQTT"""
        if device.wifi_ssid and device.wifi_password:
            config_payload = {
                "type": "config",
                "wifi_ssid": device.wifi_ssid,
                "wifi_password": device.wifi_password,
                "device_name": device.name,
                "brand": device.brand,
                "timestamp": int(time.time())
            }
            success = send_wifi_config(device.device_id, config_payload)
            device.is_configured = success
            device.save()

    @action(detail=True, methods=['post'])
    def control(self, request, pk=None):
        # Apenas dispositivos do próprio usuário podem ser controlados
        device = self.get_object()
        if device.user != request.user:
            return Response({"error": "Não autorizado"}, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()
        if 'temp' in data and 'temperature' not in data:
            data['temperature'] = data['temp']
        
        serializer = CommandSerializer(data=data)
        if serializer.is_valid():
            data = serializer.validated_data
            device.power = data.get('power', device.power)
            device.temperature = data.get('temperature', device.temperature)
            device.mode = data.get('mode', device.mode)
            device.last_command = timezone.now()
            device.save()

            payload = {
                "power": device.power,
                "temp": device.temperature,
                "mode": device.mode,
                "brand": device.brand
            }

            success = send_command_to_esp32(device.device_id, payload)
            if success:
                return Response({"status": "Comando enviado", "current_state": payload}, status=status.HTTP_200_OK)
            return Response({"error": "Erro no Broker MQTT"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def unregistered(self, request):
        """Lista dispositivos na rede que ninguém 'reivindicou' ainda"""
        unregistered_devices = Device.objects.filter(
            user__isnull=True,
            is_online=True
        )
        serializer = self.get_serializer(unregistered_devices, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def offline(self, request):
        offline_devices = Device.objects.filter(user=request.user, is_online=False)
        serializer = self.get_serializer(offline_devices, many=True)
        return Response(serializer.data)