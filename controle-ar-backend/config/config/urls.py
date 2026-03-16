from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),
    
    # 👇 O ERRO ESTÁ AQUI: Você provavelmente esqueceu de adicionar ou salvar esta linha!
    path('api/auth/', include('accounts.urls')), 
]