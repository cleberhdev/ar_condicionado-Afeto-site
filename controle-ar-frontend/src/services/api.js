// src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
});

export const deviceService = {
  getAll: async () => {
    const res = await api.get("devices/");
    return res.data;
  },

  create: async (data) => {
    try {
      const res = await api.post("devices/", data);
      return res.data;
    } catch (err) {
      console.error("Erro ao criar:", err.response?.data);
      throw new Error("Erro ao criar dispositivo");
    }
  },

  update: async (id, data) => {
    try {
      const res = await api.patch(`devices/${id}/`, data);
      return res.data;
    } catch (err) {
      console.error("Erro ao atualizar:", err.response?.data);
      throw new Error("Erro ao atualizar");
    }
  },

  delete: async (id) => {
    try {
      const res = await api.delete(`devices/${id}/`);
      return res.data;
    } catch (err) {
      console.error("Erro ao excluir:", err.response?.data);
      throw new Error("Erro ao excluir");
    }
  },

  // 👇 ADICIONE ESTA FUNÇÃO 👇
  sendCommand: async (id, payload) => {
    try {
      // O endpoint no backend é /api/devices/{id}/control/
      const res = await api.post(`devices/${id}/control/`, payload);
      return res.data;
    } catch (err) {
      console.error("Erro ao enviar comando:", err.response?.data);
      throw new Error("Erro ao enviar comando");
    }
  }
};