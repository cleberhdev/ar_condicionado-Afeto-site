import React, { useState, useEffect } from 'react';
import MasterControlCard from '../components/MasterControlCard';
import DeviceTable from '../components/DeviceTable';
// Importamos o serviço da API e o Mock (como plano B)
import { deviceService } from '../services/api';
import { devices as mockDevices } from '../data/mockData';

export default function Dashboard() {
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 1. Tenta buscar do Backend (Django)
      const data = await deviceService.getAll();
      
      if (data) {
        setDevices(data);
      } else {
        throw new Error("API retornou vazio");
      }
    } catch (error) {
      console.warn("Dashboard usando dados fictícios (Backend Offline)");
      
      // 2. Se falhar, usa o Mock MAS ADAPTA para o formato novo
      // Isso resolve a inconsistência visual na tabela!
      const adaptedMock = mockDevices.map(d => ({
        ...d,
        // Traduz 'status: online' para 'is_online: true'
        is_online: d.status === 'online', 
        // Garante que nomes de campos batam com o que a tabela espera
        wifi_ssid: d.wifiSsid 
      }));
      
      setDevices(adaptedMock);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      <section>
        <MasterControlCard />
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Visão Geral dos Dispositivos</h2>
            <p className="text-gray-500 text-sm">Status em tempo real de todas as placas conectadas.</p>
          </div>
          <div className="flex gap-2">
            {/* Agora usamos is_online, que existe tanto nos dados reais quanto no mock adaptado */}
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">
              {devices.filter(d => d.is_online).length} Online
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold border border-gray-200">
              {devices.length} Total
            </span>
          </div>
        </div>

        <DeviceTable data={devices} />
      </section>

    </div>
  );
}