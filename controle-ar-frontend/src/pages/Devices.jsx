// src/pages/Devices.jsx
import React, { useState, useEffect } from 'react';
import DeviceTable from '../components/DeviceTable';
import CreateDeviceModal from '../components/CreateDeviceModal';
import { Plus, Loader2, Wifi, RefreshCw, Zap } from 'lucide-react';
import { deviceService } from '../services/api';

export default function Devices() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [devices, setDevices] = useState([]);
  const [unregisteredDevices, setUnregisteredDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingDevice, setEditingDevice] = useState(null); 

  useEffect(() => {
    loadDevices();
    const interval = setInterval(() => {
      checkUnregisteredDevices();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadDevices = async () => {
    setIsLoading(true);
    try {
      const data = await deviceService.getAll();
      const registered = data.filter(d => d.is_registered !== false);
      const unregistered = data.filter(d => d.is_registered === false && d.is_online);
      setDevices(registered || []);
      setUnregisteredDevices(unregistered || []);
    } catch (error) {
      console.error("Erro ao carregar:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkUnregisteredDevices = async () => {
    try {
      const data = await deviceService.getAll();
      const unregistered = data.filter(d => d.is_registered === false && d.is_online);
      setUnregisteredDevices(unregistered);
    } catch (error) {
      console.error("Erro ao verificar dispositivos:", error);
    }
  };

  const handleDeviceUpdate = (id, newValues) => {
    setDevices((prevDevices) =>
      prevDevices.map((device) =>
        device.id === id ? { ...device, ...newValues } : device
      )
    );
  };

  // 👇 NOVA FUNÇÃO: Lida com a edição vinda do EditDeviceModal
  const handleEditDevice = async (formData) => {
    try {
      // Prepara o payload convertendo camelCase (JS) para snake_case (Python/Django)
      const payload = {
        name: formData.name,
        room: formData.room,
        brand: formData.brand,
        wifi_ssid: formData.wifiSsid, // backend espera wifi_ssid
      };

      // Só envia a senha se o usuário digitou algo (para não limpar a senha atual)
      if (formData.wifiPassword) {
        payload.wifi_password = formData.wifiPassword;
      }

      // Chama a API
      const updatedDevice = await deviceService.update(formData.id, payload);

      // Atualiza a lista local com os dados novos vindos do backend
      setDevices(prev => prev.map(d => d.id === formData.id ? updatedDevice : d));
      
      alert("Dispositivo atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao editar dispositivo:", error);
      alert("Erro ao salvar alterações.");
    }
  };

  const handleRegisterDevice = (device) => {
    setEditingDevice(device);
    setIsModalOpen(true);
  };

const handleAddDevice = async (formData) => {
    
    // CASO 1: O usuário está registrando um dispositivo que já foi detectado (estava na caixa amarela)
    if (editingDevice) {
       try {
        // Crie o payload SOMENTE com os campos permitidos para edição
        const payload = {
          name: formData.name,
          room: formData.room,
          brand: formData.brand,
          wifi_ssid: formData.wifiSsid, // backend espera wifi_ssid
          is_registered: true
        };

        // Adiciona a senha apenas se o usuário tiver digitado alguma
        if (formData.wifiPassword) {
            payload.wifi_password = formData.wifiPassword;
        }

        const updatedDevice = await deviceService.update(editingDevice.id, payload);
        
        // Atualiza as listas na tela
        setDevices(prev => [...prev, updatedDevice]);
        setUnregisteredDevices(prev => prev.filter(d => d.id !== editingDevice.id));
        setEditingDevice(null);
        alert("Placa cadastrada com sucesso!");
      } catch (error) {
         console.error("Erro ao registrar dispositivo detectado:", error);
         alert("Erro ao registrar a placa. Verifique o console.");
      }
      setIsModalOpen(false);
      return;
    }

    // CASO 2: Criação manual de um dispositivo totalmente novo (botão azul do topo)
    let selectedDeviceId = formData.device_id;
    if (!selectedDeviceId && unregisteredDevices.length > 0) {
      selectedDeviceId = unregisteredDevices[0].device_id;
    }
    
    const payload = {
      name: formData.name,
      room: formData.room,
      brand: formData.brand,
      wifi_ssid: formData.wifiSsid,
      device_id: selectedDeviceId || `esp32_${Date.now()}`,
      is_registered: true
    };
    
    // Adiciona a senha na criação manual
    if (formData.wifiPassword) {
        payload.wifi_password = formData.wifiPassword;
    }

    try {
      const newDevice = await deviceService.create(payload);
      setDevices(prev => [...prev, newDevice]);
      setUnregisteredDevices(prev => prev.filter(d => d.device_id !== newDevice.device_id));
      alert("Dispositivo criado com sucesso!");
    } catch (error) {
       console.error("Erro ao criar novo dispositivo:", error);
       alert("Erro ao criar dispositivo. Verifique o console.");
    }
    setIsModalOpen(false);
  };

  const handleDeleteDevice = async (id) => {
    try {
      // Chama a API do Django para excluir o dispositivo do banco de dados
      await deviceService.delete(id);
      
      // Atualiza o estado da tela, filtrando e removendo o dispositivo que acabou de ser excluído
      setDevices(prev => prev.filter(device => device.id !== id));
      
      alert("Dispositivo excluído com sucesso!");
    } catch (error) {
      // Caso o backend retorne um erro (ex: falha de rede ou dispositivo não encontrado)
      console.error("Erro ao excluir dispositivo:", error);
      alert("Erro ao excluir dispositivo. Verifique o console ou tente novamente.");
    }
  };

  return (
    <div className="space-y-6">
      {/* ... Cabeçalho ... */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Dispositivos</h2>
          <p className="text-gray-500 mt-1">Configure suas placas ESP32 detectadas automaticamente</p>
        </div>
        <div className="flex gap-3">
          <button onClick={loadDevices} className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition flex items-center gap-2">
            <RefreshCw size={18} /> Atualizar
          </button>
          <button onClick={() => { setEditingDevice(null); setIsModalOpen(true); }} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition flex items-center gap-2">
            <Plus size={20} /> Cadastrar Dispositivo
          </button>
        </div>
      </div>

 {/* ... Cards Detectados ... */}
      {unregisteredDevices.length > 0 && (
         <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-6">
            <h3 className="text-yellow-800 font-bold mb-3 flex items-center gap-2">
              <Zap size={20} /> Novos Dispositivos Detectados ({unregisteredDevices.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unregisteredDevices.map(device => (
                <div key={device.device_id} className="bg-white border border-yellow-300 p-4 rounded-lg shadow-sm flex flex-col justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{device.name || 'ESP32 Desconhecido'}</p>
                    <p className="text-sm text-gray-500 font-mono">ID: {device.device_id}</p>
                    <p className="text-sm text-gray-500">Marca detectada: {device.brand}</p>
                  </div>
                  <button 
                    onClick={() => handleRegisterDevice(device)}
                    className="mt-3 w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold py-2 px-4 rounded-lg transition"
                  >
                    Registrar Agora
                  </button>
                </div>
              ))}
            </div>
         </div>
      )}

      {/* LISTA */}
      {isLoading ? (
        <div className="flex justify-center p-10">
          <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
      ) : devices.length > 0 ? (
        <DeviceTable 
          data={devices} 
          onDelete={handleDeleteDevice}
          onStatusUpdate={handleDeviceUpdate} 
          onEdit={handleEditDevice}  /* 👈 AQUI ESTAVA FALTANDO! */
        />
      ) : (
        /* ... Empty state ... */
        <div className="text-center py-12 bg-gray-50 rounded-xl">
           {/* ... */}
        </div>
      )}

      {/* MODAL DE CRIAÇÃO / CADASTRO */}
      <CreateDeviceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddDevice}
        availableDevices={unregisteredDevices}
        defaultValues={editingDevice}
      />
    </div>
  );
}