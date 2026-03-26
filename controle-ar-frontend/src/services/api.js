import axios from "axios";

// Cria a instância base do Axios
const api = axios.create({
  // Tenta ler a URL do Vercel, se não achar, usa o localhost para testes
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/",
});

// 👇 O INTERCETOR MÁGICO 👇
// Antes de qualquer requisição sair do React, ele roda este código:
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    // Lista de rotas públicas que não devem enviar o token
    const publicRoutes = [
      "auth/login/",
      "auth/register/",
      "auth/password-reset/",
    ];
    const isPublicRoute = publicRoutes.some((route) =>
      config.url?.includes(route),
    );

    // Se existir um token guardado E a rota não for pública, adiciona ele no cabeçalho
    if (token && !isPublicRoute) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// --- SERVIÇO DE AUTENTICAÇÃO ---
export const authService = {
  login: async (email, password) => {
    const res = await api.post("auth/login/", { email, password });

    // Se o backend devolver os tokens, guardamos eles no navegador!
    if (res.data.access_token) {
      localStorage.setItem("access_token", res.data.access_token);
      localStorage.setItem("refresh_token", res.data.refresh_token);
    }
    return res.data;
  },

  register: async (userData) => {
    const res = await api.post("auth/register/", userData);
    return res.data;
  },

  // 👇 NOVA FUNÇÃO PARA VERIFICAR O CÓDIGO (OTP) 👇
  verifyEmail: async (otp) => {
    // Envia o código para o backend
    const res = await api.post("auth/verify-email/", { otp });
    return res.data;
  },

  logout: async () => {
    try {
      // Opcional: Avisa o backend para invalidar (blacklist) o refresh_token
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        await api.post("auth/logout/", { refresh_token: refreshToken });
      }
    } catch (error) {
      console.error("Erro ao fazer logout no servidor:", error);
    } finally {
      // De qualquer forma, apaga os tokens do navegador para deslogar o usuário localmente
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
  },
  requestPasswordReset: async (email) => {
    const res = await api.post("auth/password-reset/", { email });
    return res.data;
  },
  setNewPassword: async (data) => {
    // data deve conter: { password, confirm_password, uidb64, token }
    const res = await api.patch("auth/set-new-password/", data);
    return res.data;
  },
};

// --- SERVIÇO DE DISPOSITIVOS ---
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

  sendCommand: async (id, payload) => {
    try {
      const res = await api.post(`devices/${id}/control/`, payload);
      return res.data;
    } catch (err) {
      console.error("Erro ao enviar comando:", err.response?.data);
      throw new Error("Erro ao enviar comando");
    }
  },

  getUnregistered: async () => {
    const res = await api.get("devices/unregistered/");
    return res.data;
  },
};

export default api;