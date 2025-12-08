from django.contrib import admin
from .models import Device

@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    # Campos que aparecem na lista (tabela) do admin
    list_display = (
        'name', 
        'device_id', 
        'brand', 
        'wifi_ssid', 
        'is_online', 
        'power', 
        'temperature', 
        'mode', 
        'updated_at'
    )
    
    # Filtros laterais para facilitar a busca
    list_filter = ('brand', 'is_online', 'power', 'mode', 'room')
    
    # Campos onde a barra de busca vai procurar
    search_fields = ('name', 'device_id', 'wifi_ssid')
    
    # Campos que não podem ser editados (opcional, bom para datas)
    readonly_fields = ('created_at', 'updated_at')
    
    # Organização dos campos no formulário de edição
    fieldsets = (
        ('Identificação', {
            'fields': ('name', 'device_id', 'room', 'brand', 'model')
        }),
        ('Conexão', {
            'fields': ('wifi_ssid', 'is_online')
        }),
        ('Estado Atual', {
            'fields': ('power', 'temperature', 'mode')
        }),
        ('Datas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',) # Esconde essa seção por padrão
        }),
    )

    # Ordenação padrão (mais recentes primeiro)
    ordering = ('-updated_at',)