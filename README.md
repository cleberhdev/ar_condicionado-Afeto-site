````markdown
# ❄️ Controle de Ar-Condicionado IoT (React + Django + ESP32)

Sistema completo para automação de ar-condicionados utilizando **ESP32**, **React**, **Django** e **MQTT**.  
Permite controlar dispositivos de marcas como **Samsung, LG, Fujitsu, Springer Midea e Carrier** via interface web.

---

## 🚀 Arquitetura do Sistema

O fluxo do sistema funciona da seguinte forma:

1. **Frontend (React):**  
   O usuário interage com a interface para ligar/desligar, ajustar temperatura e modos.

2. **API (Django):**  
   O frontend envia uma requisição HTTP para o backend.

3. **MQTT Broker:**  
   O backend publica uma mensagem JSON em um tópico MQTT específico do dispositivo.

4. **ESP32:**  
   Conectada ao Wi-Fi, inscrita no tópico, recebe o comando e emite o sinal IR correspondente.

5. **Feedback:**  
   A ESP32 envia seu novo estado para um tópico de resposta.  
   O backend lê e atualiza a interface em tempo real.

---

## 📂 Estrutura do Projeto

### 1. **Backend – `controle-ar-backend/`**
**Tecnologias:** Python, Django, Django REST Framework, Paho-MQTT  
**Função:** Gerenciar dispositivos, usuários e comunicação via MQTT.

**Principais arquivos:**
- `core/models.py` – Modelo Device (nome, id, marca, status).  
- `core/views.py` – Recebe comandos do frontend e envia via MQTT.  
- `core/mqtt_helper.py` – Função utilitária para publicar no broker.  
- `mqtt_listener.py` – Escuta atualizações da ESP32 em tempo real.

---

### 2. **Frontend – `controle-ar-frontend/` ou `src/`**
**Tecnologias:** React, Vite, Tailwind CSS, Lucide Icons  
**Função:** Interface amigável para o controle dos dispositivos.

**Principais arquivos:**
- `src/services/api.js` – Comunicação com o backend Django.  
- `src/pages/Devices.jsx` – Cadastro e listagem de dispositivos.  
- `src/components/RemoteControlModal.jsx` – Controle visual estilo aplicativo.

---

### 3. **Hardware – ESP32**
**Tecnologias:** Arduino IDE / PlatformIO, C++  
**Bibliotecas:** WiFiManager, PubSubClient, ArduinoJson, IRremoteESP8266  

**Função:** Receber comandos via MQTT e emitir sinais IR.

---

## 🛠️ Como Rodar o Projeto (Passo a Passo)

É necessário rodar **3 terminais simultaneamente** (Backend, Listener e Frontend) + a ESP32.

### ✔️ Pré-requisitos

- Python instalado  
- Node.js instalado  
- Broker MQTT (ex.: público: *broker.hivemq.com*)

---

## 📌 Passo 1: Iniciar o Backend (Django)

```bash
cd controle-ar-backend
````

### Criar ambiente virtual (opcional)

```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
```

### Instalar dependências

```bash
pip install django djangorestframework django-cors-headers paho-mqtt
```

### Preparar banco de dados

```bash
python manage.py makemigrations
python manage.py migrate
```

### Criar superusuário

```bash
python manage.py createsuperuser
```

### Rodar o backend

```bash
python manage.py runserver
```

Backend disponível em: **[http://localhost:8000](http://localhost:8000)**

---

## 📌 Passo 2: Rodar o Listener MQTT (Status em tempo real)

Em outro terminal:

```bash
cd controle-ar-backend
```

Ativar ambiente virtual (se usou) e rodar:

```bash
python mqtt_listener.py
```

Deve aparecer:
**"✅ OUVINTE CONECTADO!"**

---

## 📌 Passo 3: Iniciar o Frontend (React)

```bash
cd controle-ar-frontend
npm install
npm run dev
```

Frontend disponível em: **[http://localhost:5173](http://localhost:5173)**

---

## 📌 Passo 4: Configurar a ESP32

1. Abra o código `.ino` no Arduino IDE.
2. No trecho:

```cpp
char device_id[50] = "esp32_XXXX";
```

Substitua pelo **device_id** criado no Django (visível no admin ou editando o dispositivo).
3. Configure o Wi-Fi (ou use WiFiManager).
4. Carregue o código na placa.
5. Abra o Serial Monitor (115200) para confirmar a conexão.

---

## 🐛 Solução de Problemas Comuns

### 1. **"Erro ao enviar comando" no site**

* Backend offline ou erro de CORS.
  **Solução:** Verifique se o `runserver` está ativo e olhe o console do navegador.

### 2. **Dispositivo sempre "Offline"**

* Django não recebe feedback via MQTT.
  **Soluções:**
* Verifique se o listener está rodando.
* Confirme se o `device_id` da ESP32 é **idêntico** ao cadastrado.

### 3. **ESP32 não conecta ao Wi-Fi**

* Credenciais incorretas ou WiFiManager desconfigurado.
  **Solução:** Conectar na rede `SmartAC-Config` e reconfigurar.

### 4. **Frontend bagunçado**

* Problema com TailwindCSS.
  **Solução:**

```bash
npm install -D tailwindcss@3.4.17 postcss autoprefixer
npm run dev
```

---
