const API_BASE_URL = 'http://localhost:8000/api';

export const deviceService = {
  getAll: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/devices/`);
      if (!response.ok) throw new Error('Falha ao buscar');
      return await response.json();
    } catch (error) {
      console.warn("API Offline, usando modo offline.");
      return null; 
    }
  },

  create: async (deviceData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/devices/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deviceData),
      });
      if (!response.ok) throw new Error('Falha ao criar');
      return await response.json();
    } catch (error) {
      console.warn("API Offline, simulando criação.");
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/devices/${id}/`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      throw error;
    }
  },
  
  update: async (id, data) => {
      try {
        const response = await fetch(`${API_BASE_URL}/devices/${id}/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return await response.json();
      } catch (error) {
          throw error;
      }
  },

  // --- A FUNÇÃO QUE FALTAVA ---
  sendCommand: async (id, command) => {
    try {
      console.log(`📡 Enviando comando para dispositivo ID: ${id}`);
      console.log(`📦 Comando:`, command);
      
      const response = await fetch(`${API_BASE_URL}/devices/${id}/control/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          power: command.power,
          temperature: command.temp,  // Mapeia 'temp' para 'temperature'
          mode: command.mode
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Erro do servidor (${response.status}):`, errorText);
        throw new Error(`Erro do servidor: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Comando enviado com sucesso:`, data);
      return data;
      
    } catch (error) {
      console.error("❌ Erro no sendCommand:", error);
      throw error;
    }
  }
};