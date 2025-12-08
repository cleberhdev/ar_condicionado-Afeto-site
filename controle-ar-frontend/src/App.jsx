import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota Pai: O Layout */}
        <Route path="/" element={<MainLayout />}>
          {/* Rotas Filhas: Renderizadas dentro do Outlet do Layout */}
          <Route index element={<Dashboard />} />
          <Route path="placas" element={<Devices />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}