from rest_framework import serializers
from .models import Device

class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = [
            'id', 'device_id', 'name', 'room', 'brand', 
            'wifi_ssid', 'wifi_password', 'is_online',
            'power', 'temperature', 'mode', 'is_registered',
            'is_configured', 'last_seen', 'last_command'
        ]
        read_only_fields = ['is_online', 'last_seen', 'last_command']

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
    """Serializer para comandos enviados para ESP32"""
    power = serializers.BooleanField(required=True)
    temperature = serializers.IntegerField(
        min_value=16, 
        max_value=30, 
        required=True,
        source='temp'  # Aceita 'temp' do frontend
    )
    mode = serializers.ChoiceField(
        choices=['cool', 'heat', 'fan', 'dry', 'auto'], 
        required=True
    )
    
    def validate(self, data):
        """Validação customizada"""
        # Pode adicionar validações extras aqui
        return data