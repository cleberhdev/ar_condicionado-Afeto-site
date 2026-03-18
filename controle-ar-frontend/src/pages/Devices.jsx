// src/pages/Devices.jsx
import React, { useState, useEffect } from 'react';
import DeviceTable from '../components/DeviceTable';
import CreateDeviceModal from '../components/CreateDeviceModal';
import EditDeviceModal from '../components/EditDeviceModal';
import { Plus, Loader2, RefreshCw, Zap } from 'lucide-react';
import { deviceService } from '../services/api';

export default function Devices() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // 👈 Estado adicionado!
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
      // 1. Busca as placas do usuário logado
      const userDevices = await deviceService.getAll();
      setDevices(userDevices || []);

      // 2. Busca as placas detectadas na rede sem dono
      const orphans = await deviceService.getUnregistered();
      setUnregisteredDevices(orphans || []);
    } catch (error) {
      console.error("Erro ao carregar:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkUnregisteredDevices = async () => {
    try {
      // O intervalo de 10s só precisa buscar as placas órfãs
      const orphans = await deviceService.getUnregistered();
      setUnregisteredDevices(orphans || []);
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

  // 👈 Abre o modal de EDIÇÃO
  const prepareEdit = (device) => {
    setEditingDevice(device);
    setIsEditModalOpen(true);
  };

  // 👈 Salva as alterações da EDIÇÃO
  const handleEditDevice = async (formData) => {
    try {
      const payload = {
        name: formData.name,
        room: formData.room,
        brand: formData.brand, 
        wifi_ssid: formData.wifiSsid,
      };

      if (formData.wifiPassword) {
        payload.wifi_password = formData.wifiPassword;
      }

      console.log("Enviando dados atualizados para o backend:", payload);

      const updatedDevice = await deviceService.update(formData.id, payload);
      setDevices(prev => prev.map(d => d.id === formData.id ? updatedDevice : d));
      
      alert("Dispositivo atualizado com sucesso!");
      setIsEditModalOpen(false); 
      setEditingDevice(null); // Limpa a memória após salvar
    } catch (error) {
      console.error("Erro ao editar:", error);
      alert("Erro ao salvar alterações. Verifique o console.");
    }
  };

  // 👈 Abre o modal de REGISTRO (placa amarela)
  const handleRegisterDevice = (device) => {
    setEditingDevice(device);
    setIsModalOpen(true);
  };

  // 👈 Salva o NOVO REGISTRO ou CRIAÇÃO MANUAL
  const handleAddDevice = async (formData) => {
    // CASO 1: Registrando dispositivo detectado
    if (editingDevice) {
       try {
        const payload = {
          name: formData.name,
          room: formData.room,
          brand: formData.brand,
          wifi_ssid: formData.wifiSsid, 
          is_registered: true
        };

        if (formData.wifiPassword) {
            payload.wifi_password = formData.wifiPassword;
        }

        const updatedDevice = await deviceService.update(editingDevice.id, payload);
        
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

    // CASO 2: Criação manual
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
      await deviceService.delete(id);
      setDevices(prev => prev.filter(device => device.id !== id));
      alert("Dispositivo excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir dispositivo:", error);
      alert("Erro ao excluir dispositivo. Verifique o console ou tente novamente.");
    }
  };

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
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

      {/* CARDS AMARELOS - DISPOSITIVOS DETECTADOS */}
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

      {/* TABELA DE DISPOSITIVOS REGISTRADOS */}
      {isLoading ? (
        <div className="flex justify-center p-10">
          <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
      ) : devices.length > 0 ? (
        <DeviceTable 
          data={devices} 
          onDelete={handleDeleteDevice}
          onStatusUpdate={handleDeviceUpdate} 
          onEdit={prepareEdit}
        />
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-gray-500 font-medium">Você ainda não possui dispositivos cadastrados.</p>
        </div>
      )}

      {/* MODAL DE EDIÇÃO (Para os que já são seus) */}
      <EditDeviceModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingDevice(null); }}
        device={editingDevice}
        onSave={handleEditDevice}
      />

      {/* MODAL DE REGISTRO/CRIAÇÃO (Para placas novas) */}
      <CreateDeviceModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingDevice(null); }}
        onSave={handleAddDevice}
        availableDevices={unregisteredDevices}
        defaultValues={editingDevice}
      />
    </div>
  );
}