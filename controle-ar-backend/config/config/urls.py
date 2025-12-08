from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Rota para a API do seu app 'core'
    # Tudo que começar com /api/ será tratado pelo core.urls
    path('api/', include('core.urls')),
]