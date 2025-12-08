from django.db import models
import uuid

class Device(models.Model):
    """
    Representa uma placa ESP32.
    O 'device_id' deve ser único e hardcodado na ESP32 ou gerado no primeiro setup.
    """
    name = models.CharField(max_length=100, help_text="Ex: Ar da Sala")
    device_id = models.CharField(max_length=50, unique=True, help_text="ID único da placa (Ex: MAC Address ou Serial)")
    
    # Estado atual do dispositivo (Espelho do que está na placa)
    room = models.CharField(max_length=100, blank=True)
    
    # --- NOVO CAMPO: MARCA ---
    # É importante ter um valor padrão ou permitir nulo para migrações suaves
    brand = models.CharField(max_length=50, default="Samsung", help_text="Marca do Ar-Condicionado (ex: Samsung, LG, Fujitsu)")
    
    # Campo opcional para modelo específico, caso precise de ajustes finos de protocolo
    model = models.CharField(max_length=50, blank=True, null=True, help_text="Modelo específico (opcional)")

    wifi_ssid = models.CharField(max_length=100, blank=True, null=True)
    
    # Status de controle
    is_online = models.BooleanField(default=False)
    power = models.BooleanField(default=False)
    temperature = models.IntegerField(default=24)
    mode = models.CharField(max_length=20, default='cool') # cool, heat, fan, dry
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.device_id}) - {self.brand}"

    @property
    def mqtt_topic_command(self):
        """Tópico onde o Django publica comandos para a ESP32"""
        return f"smart_ac/{self.device_id}/command"

    @property
    def mqtt_topic_state(self):
        """Tópico onde a ESP32 publica seu status atual para o Django ouvir"""
        return f"smart_ac/{self.device_id}/state"