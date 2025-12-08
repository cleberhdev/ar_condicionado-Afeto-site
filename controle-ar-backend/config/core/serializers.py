from rest_framework import serializers
from .models import Device

class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = '__all__'

class CommandSerializer(serializers.Serializer):
    """
    Valida os dados que vêm do Frontend antes de enviar para a placa
    """
    power = serializers.BooleanField(required=False)
    temperature = serializers.IntegerField(min_value=16, max_value=30, required=False)
    mode = serializers.CharField(required=False)
    # Adicione outros campos se necessário (fan_speed, swing, etc)