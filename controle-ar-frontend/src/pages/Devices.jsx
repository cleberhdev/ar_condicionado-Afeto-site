// src/pages/Devices.jsx
import React, { useState, useEffect } from 'react';
import DeviceTable from '../components/DeviceTable';
import CreateDeviceModal from '../components/CreateDeviceModal';
import { Plus, Loader2, Wifi, RefreshCw } from 'lucide-react';
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
    // ... (MANTENHA A LÓGICA EXISTENTE AQUI IGUAL)
    // Se for edição de não registrado (cadastro)
    if (editingDevice) {
       // ... código existente ...
       // (Nota: esta lógica é diferente da edição de dispositivo já registrado)
       // ...
       try {
        const payload = {
          ...editingDevice,
          name: formData.name,
          room: formData.room,
          brand: formData.brand,
          wifi_ssid: formData.wifiSsid,
          is_registered: true
        };
        const updatedDevice = await deviceService.update(editingDevice.id, payload);
        setDevices(prev => [...prev, updatedDevice]);
        setUnregisteredDevices(prev => prev.filter(d => d.id !== editingDevice.id));
        setEditingDevice(null);
        alert("Placa cadastrada com sucesso!");
      } catch (error) {
         // ...
      }
      setIsModalOpen(false);
      return;
    }

    // Se for criação nova
    // ... código existente ...
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
    try {
      const newDevice = await deviceService.create(payload);
      setDevices(prev => [...prev, newDevice]);
      setUnregisteredDevices(prev => prev.filter(d => d.device_id !== newDevice.device_id));
      alert("Dispositivo criado com sucesso!");
    } catch (error) {
       // ...
    }
    setIsModalOpen(false);
  };

  const handleDeleteDevice = async (id) => {
    // ... código existente ...
    try {
      await deviceService.delete(id);
      setDevices(prev => prev.filter(device => device.id !== id));
      alert("Dispositivo excluído com sucesso!");
    } catch (error) {
        // ...
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
         /* ... código existente ... */
         <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-6">
            {/* ... */}
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