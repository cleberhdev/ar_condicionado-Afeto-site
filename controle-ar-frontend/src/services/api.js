const API_BASE_URL = 'http://localhost:8000/api';

export const deviceService = {
  getAll: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/devices/`);
      if (!response.ok) throw new Error('Falha ao buscar');
      return await response.json();
    } catch (error) {
      console.warn("API Offline, usando modo offline.");
      return null; // Retorna null para indicar erro
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
  }
};