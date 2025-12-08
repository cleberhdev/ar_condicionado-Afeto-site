import React, { useState, useEffect } from 'react';
import DeviceTable from '../components/DeviceTable';
import CreateDeviceModal from '../components/CreateDeviceModal';
import { Plus, Loader2 } from 'lucide-react';
// Importa o serviço que conecta com o Django
import { deviceService } from '../services/api';

export default function Devices() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados reais ao abrir a página
  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setIsLoading(true);
    try {
      // Busca a lista do backend
      const data = await deviceService.getAll();
      setDevices(data || []);
    } catch (error) {
      console.error("Erro ao carregar:", error);
      // Se der erro (backend offline), você pode optar por mostrar lista vazia ou mock
      // setDevices([]); 
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // --- FUNÇÃO DE CADASTRO REAL ---
  const handleAddDevice = async (formData) => {
    // 1. Prepara o objeto para enviar ao Django (snake_case)
    const payload = {
      name: formData.name,
      room: formData.room,
      brand: formData.brand,
      wifi_ssid: formData.wifiSsid, // Frontend usa wifiSsid -> Backend usa wifi_ssid
      // device_id: Se o backend não gerar, gere aqui. Se gerar, remova.
      device_id: `esp32_${Date.now()}` 
    };

    try {
      // 2. Envia para a API
      const newDevice = await deviceService.create(payload);
      
      // 3. Se sucesso, atualiza a lista na tela
      setDevices((prev) => [...prev, newDevice]);
      alert("Dispositivo cadastrado com sucesso!");
      
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      alert("Erro ao cadastrar. Verifique se o Backend está rodando.");
    }
    
    closeModal();
  };

  // --- FUNÇÃO DE EXCLUIR REAL ---
  const handleDeleteDevice = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir?")) {
      try {
        await deviceService.delete(id);
        // Remove da lista visualmente
        setDevices((prev) => prev.filter((d) => d.id !== id && d.device_id !== id));
      } catch (error) {
        alert("Erro ao excluir.");
      }
    }
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

      {isLoading ? (
        <div className="flex justify-center p-10">
          <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
      ) : (
        <DeviceTable 
            data={devices} 
            onDelete={handleDeleteDevice} // Passa a função de deletar para a tabela
        />
      )}

      {/* O Modal recebe a função handleAddDevice no onSave */}
      <CreateDeviceModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        onSave={handleAddDevice}
      />
    </div>
  );
}