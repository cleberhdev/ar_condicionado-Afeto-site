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
      // Usando o ID numérico na URL conforme padrão REST do Django
      const response = await fetch(`${API_BASE_URL}/devices/${id}/control/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
      });
      
      if (!response.ok) {
        // Tenta ler o erro do servidor se houver
        const errorData = await response.text();
        throw new Error(`Erro do Servidor: ${errorData}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Erro no sendCommand:", error);
      throw error;
    }
  }
};