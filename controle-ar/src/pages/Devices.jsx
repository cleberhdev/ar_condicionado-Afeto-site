import React, { useState } from 'react';
import DeviceTable from '../components/DeviceTable';
import CreateDeviceModal from '../components/CreateDeviceModal';
import { devices as initialDevices } from '../data/mockData';
import { Plus } from 'lucide-react';

export default function Devices() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [devices, setDevices] = useState(initialDevices);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // --- NOVA FUNÇÃO PARA ADICIONAR ---
  const handleAddDevice = (newDeviceData) => {
    const newDevice = {
      ...newDeviceData,
      id: `esp32_${Date.now()}`, // Gera um ID único simples
      status: 'offline', // Começa offline
      temperature: 24, // Temp padrão
      mode: 'off',
      power: false
    };

    // Atualiza o estado da lista adicionando o novo no final
    setDevices(prevList => [...prevList, newDevice]);
  };

  return (
    <div className="space-y-6 relative z-10">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Dispositivos</h2>
          <p className="text-gray-500 mt-1">Adicione e configure suas placas ESP32.</p>
        </div>

        <button 
          onClick={openModal}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-600/40 transition-all flex items-center gap-2 active:scale-95"
        >
          <Plus size={20} strokeWidth={2.5} />
          <span>Novo Dispositivo</span>
        </button>
      </div>

      {/* Passamos a lista 'devices' que é gerenciada pelo estado deste componente */}
      <DeviceTable data={devices} />

      {/* Passamos a função handleAddDevice para o onSave */}
      <CreateDeviceModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        onSave={handleAddDevice}
      />
    </div>
  );
}