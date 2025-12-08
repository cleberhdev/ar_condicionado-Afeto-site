Controle de Ar-Condicionado IoT (React + Django + ESP32)

Este projeto é um sistema completo para automação de ar-condicionados utilizando ESP32, React e Django. Ele permite controlar dispositivos de marcas como Samsung, LG, Fujitsu, Springer Midea e Carrier via interface web.

🚀 Arquitetura do Sistema

O sistema funciona da seguinte forma:

Frontend (React): O usuário interage com a interface para ligar/desligar, mudar temperatura ou modo.

API (Django): O frontend envia uma requisição HTTP para o backend.

MQTT (Broker): O backend publica uma mensagem JSON em um tópico MQTT específico para o dispositivo.

ESP32: A placa, conectada ao Wi-Fi e inscrita no tópico, recebe a mensagem e emite o sinal IR correspondente.

Feedback: A ESP32 publica seu novo estado em um tópico de resposta, que é lido pelo backend para atualizar a interface em tempo real.

📂 Estrutura do Projeto

1. Backend (controle-ar-backend/)

Tecnologias: Python, Django, Django REST Framework, Paho-MQTT.

Função: Gerenciar dispositivos, usuários e comunicação MQTT.

Principais Arquivos:

core/models.py: Define a tabela Device (nome, id, marca, status).

core/views.py: Recebe comandos da API e chama o MQTT.

core/mqtt_helper.py: Função para enviar mensagens ao broker.

mqtt_listener.py: Script que roda em paralelo para ouvir o status das placas.

2. Frontend (controle-ar-frontend/ ou src/)

Tecnologias: React, Vite, Tailwind CSS, Lucide Icons.

Função: Interface amigável para o usuário.

Principais Arquivos:

src/services/api.js: Comunicação com o backend Django.

src/pages/Devices.jsx: Lista e cadastro de dispositivos.

src/components/RemoteControlModal.jsx: Controle visual estilo app.

3. Hardware (ESP32)

Tecnologias: Arduino IDE/PlatformIO, C++.

Bibliotecas: WiFiManager, PubSubClient, ArduinoJson, IRremoteESP8266.

Função: Receber comandos MQTT e disparar IR.

🛠️ Como Rodar o Projeto (Passo a Passo)

Para o sistema funcionar, você precisa de 3 terminais rodando simultaneamente (Backend, Listener e Frontend) e a ESP32 ligada.

Pré-requisitos

Python instalado.

Node.js instalado.

Broker MQTT (usamos broker.hivemq.com público para testes).

Passo 1: Iniciar o Backend (Django)

Abra um terminal na pasta do backend (controle-ar-backend).

Crie e ative um ambiente virtual (opcional, mas recomendado):

python -m venv venv
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate


Instale as dependências:

pip install django djangorestframework django-cors-headers paho-mqtt


Prepare o banco de dados:

python manage.py makemigrations
python manage.py migrate


Crie um superusuário (para acessar /admin):

python manage.py createsuperuser


Rode o servidor:

python manage.py runserver


O backend estará rodando em: http://localhost:8000

Passo 2: Iniciar o Listener MQTT (Para Status em Tempo Real)

Abra um segundo terminal na mesma pasta do backend.

Ative o ambiente virtual (se usou).

Rode o script de escuta:

python mqtt_listener.py


Ele deve mostrar: "✅ OUVINTE CONECTADO!"

Passo 3: Iniciar o Frontend (React)

Abra um terceiro terminal na pasta do frontend (controle-ar).

Instale as dependências (se ainda não fez):

npm install


Rode o projeto:

npm run dev


Acesse o site em: http://localhost:5173

Passo 4: Configurar a ESP32

Abra o código .ino na Arduino IDE.

Importante: Na linha char device_id[50] = "...", coloque o ID exato que foi gerado no Django (ex: esp32_1765...). Você pode ver esse ID na URL ao editar um dispositivo no site ou no Django Admin.

Configure o Wi-Fi no código (ou use o WiFiManager se estiver ativo).

Carregue o código na placa.

Abra o Serial Monitor (115200) para confirmar a conexão.

🐛 Solução de Problemas Comuns

1. "Erro ao enviar comando" no Site

Causa: O Frontend não consegue falar com o Django.

Solução: Verifique se o Terminal 1 (runserver) está rodando e se não há erros de CORS no console do navegador (F12).

2. Dispositivo sempre "Offline"

Causa: O Django não está recebendo o feedback da placa.

Solução: Verifique se o Terminal 2 (mqtt_listener.py) está rodando. Verifique se o device_id no código da ESP32 é idêntico ao cadastrado no site.

3. Placa não conecta no Wi-Fi

Solução: Se estiver usando código com credenciais fixas, verifique a senha. Se usar WiFiManager, conecte na rede SmartAC-Config e configure novamente.

4. Interface "feia" ou desconfigurada

Causa: Problema com Tailwind CSS (versão incompatível).

Solução: Pare o frontend, rode npm install -D tailwindcss@3.4.17 postcss autoprefixer e reinicie com npm run dev.