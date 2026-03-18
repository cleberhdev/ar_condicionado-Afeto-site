from django.db import models
from django.utils import timezone
from django.conf import settings

class Device(models.Model):
    BRAND_CHOICES = [
        ('Carrier', 'Carrier'),
        ('Midea', 'Midea'),
        ('Springer', 'Springer'),
        ('Fujitsu', 'Fujitsu'),
        ('Samsung', 'Samsung'),
        ('LG', 'LG'),
        ('Daikin', 'Daikin'),
        ('Consul', 'Consul'),
        ('Elgin', 'Elgin'),
        ('Gree', 'Gree'),
        ('generic', 'Genérico'),
    ]
    
    MODE_CHOICES = [
        ('cool', 'Resfriar'),
        ('heat', 'Aquecer'),
        ('fan', 'Ventilar'),
        ('dry', 'Desumidificar'),
        ('auto', 'Automático'),
    ]
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='devices',
        null=True,  # Deixamos null=True para não dar erro com os aparelhos que já existem no banco
        blank=True
    )

    # --- Identificação ---
    device_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    room = models.CharField(max_length=50)
    brand = models.CharField(max_length=20, choices=BRAND_CHOICES, default='Carrier')

    # --- Configuração Wi-Fi ---
    wifi_ssid = models.CharField(max_length=100, blank=True, null=True)
    wifi_password = models.CharField(max_length=100, blank=True, null=True)
    is_configured = models.BooleanField(default=False)

    # --- Estado atual (controlado pelo backend/MQTT) ---
    is_online = models.BooleanField(default=False)
    is_registered = models.BooleanField(default=False)  
    power = models.BooleanField(default=False)
    temperature = models.IntegerField(default=24)
    mode = models.CharField(max_length=10, choices=MODE_CHOICES, default='cool')

    # --- Timestamps ---
    last_seen = models.DateTimeField(null=True, blank=True)
    last_command = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.device_id})"

    class Meta:
        ordering = ['-is_online', 'name']
        verbose_name = "Dispositivo"
        verbose_name_plural = "Dispositivos"
