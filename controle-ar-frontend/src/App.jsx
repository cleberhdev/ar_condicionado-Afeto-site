import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import Login from './pages/Login';
import ResetPassword from './components/ResetPassword';

// Verifica se o usuário tem o token. Se não tiver, manda para o Login!
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("access_token");
  return token ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Redireciona a raiz "/" direto para o login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* 2. Rota Pública de Autenticação */}
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password/:uidb64/:token" element={<ResetPassword />} />

        {/* 3. Rotas Protegidas (Envolvidas pelo PrivateRoute) */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          {/* Rotas Filhas renderizadas dentro do Outlet do MainLayout */}
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Mudamos de 'placas' para 'devices' para bater com o redirecionamento do Login */}
          <Route path="devices" element={<Devices />} />
        </Route>

        {/* 4. Rota "Pega-tudo" (Caso o usuário digite uma URL que não existe, volta para o Login) */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}