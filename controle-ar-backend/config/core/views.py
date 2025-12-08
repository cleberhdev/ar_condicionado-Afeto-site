from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Device
from .serializers import DeviceSerializer, CommandSerializer
from .mqtt_helper import send_command_to_esp32

class DeviceViewSet(viewsets.ModelViewSet):
    """
    CRUD completo dos dispositivos.
    GET /api/devices/ -> Lista todos
    POST /api/devices/ -> Cria novo
    """
    queryset = Device.objects.all()
    serializer_class = DeviceSerializer

    @action(detail=True, methods=['post'])
    def control(self, request, pk=None):
        """
        Endpoint para enviar comandos para a placa.
        POST /api/devices/{id}/control/
        Body: { "power": true, "temperature": 22, "mode": "cool" }
        """
        device = self.get_object()
        serializer = CommandSerializer(data=request.data)
        
        if serializer.is_valid():
            data = serializer.validated_data
            
            # 1. Atualiza o banco de dados do Django com o novo estado desejado
            if 'power' in data: device.power = data['power']
            if 'temperature' in data: device.temperature = data['temperature']
            if 'mode' in data: device.mode = data['mode']
            device.save()

            # 2. Monta o payload completo para enviar para a ESP32
            # É bom enviar o estado completo para garantir sincronia
            payload = {
                "power": device.power,
                "temp": device.temperature,
                "mode": device.mode,
                "brand": device.brand # Importante para a ESP32 saber qual protocolo IR usar
            }

            # 3. Envia via MQTT
            success = send_command_to_esp32(device.device_id, payload)

            if success:
                return Response({"status": "Comando enviado", "current_state": payload}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Falha ao conectar com Broker MQTT"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)