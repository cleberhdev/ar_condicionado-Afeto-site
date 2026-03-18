from rest_framework import serializers
from .models import Device

class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = '__all__'
        read_only_fields = [
            'is_online',
            'power',
            'temperature',
            'mode',
            'is_configured',
            'last_sent',
            'last_command'
        ]

class DeviceCreateSerializer(serializers.ModelSerializer):
    """Serializer específico para criação com campos extras"""
    wifi_ssid = serializers.CharField(required=False, allow_blank=True)
    wifi_password = serializers.CharField(required=False, allow_blank=True, write_only=True)
    
    class Meta:
        model = Device
        fields = [
            'id', 'device_id', 'name', 'room', 'brand',
            'wifi_ssid', 'wifi_password', 'is_registered'
        ]
        extra_kwargs = {
            'device_id': {'required': True},
            'name': {'required': True},
            'room': {'required': True},
            'brand': {'required': True},
        }
    
    def validate_device_id(self, value):
        """Valida se device_id é único"""
        if Device.objects.filter(device_id=value).exists():
            raise serializers.ValidationError("Já existe um dispositivo com este ID")
        return value

class CommandSerializer(serializers.Serializer):
    power = serializers.BooleanField(required=True)
    # Mudamos para aceitar 'temp' de forma simples
    temp = serializers.IntegerField(min_value=16, max_value=30, required=False)
    temperature = serializers.IntegerField(min_value=16, max_value=30, required=False)
    mode = serializers.ChoiceField(
        choices=['cool', 'heat', 'fan', 'dry', 'auto'], 
        required=True
    )

    def validate(self, data):
        # Lógica para garantir que temos uma temperatura, independente do nome da chave
        if 'temp' not in data and 'temperature' not in data:
            raise serializers.ValidationError("É necessário informar a temperatura (temp ou temperature).")
        return data