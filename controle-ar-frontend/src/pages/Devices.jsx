// Devices.jsx - VERSÃO CORRIGIDA
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
  const [editingDevice, setEditingDevice] = useState(null); // NOVO: Para permitir atualizar device_id existente

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

  const handleRegisterDevice = (device) => {
    setEditingDevice(device); // PRÉ-PREENCHER COM device REAL
    setIsModalOpen(true);
  };

  const handleAddDevice = async (formData) => {

    // Se estamos editando um dispositivo não cadastrado → atualizar
    if (editingDevice) {
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
        console.error("Erro ao atualizar o dispositivo:", error);
        alert("Erro ao cadastrar.");
      }

      setIsModalOpen(false);
      return;
    }

    // --- Se não é edição, é criação manual ---
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
      console.error("Erro ao cadastrar:", error);

      if (error.response?.data?.device_id) {
        alert("Erro: este device_id já existe no sistema.");
      } else {
        alert("Erro ao cadastrar.");
      }
    }

    setIsModalOpen(false);
  };

  const handleDeleteDevice = async (id) => {
    try {
      await deviceService.delete(id);

      // Remove da tabela imediatamente
      setDevices(prev => prev.filter(device => device.id !== id));

      alert("Dispositivo excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir:", error);
      alert("Erro ao excluir o dispositivo.");
    }
  };

  return (
    <div className="space-y-6">

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Dispositivos</h2>
          <p className="text-gray-500 mt-1">Configure suas placas ESP32 detectadas automaticamente</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={loadDevices}
            className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition flex items-center gap-2"
          >
            <RefreshCw size={18} />
            Atualizar
          </button>

          <button
            onClick={() => {
              setEditingDevice(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Plus size={20} />
            Cadastrar Dispositivo
          </button>
        </div>
      </div>

      {/* DETECTADOS */}
      {unregisteredDevices.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Wifi className="text-yellow-600" size={24} />
            <h3 className="text-lg font-bold text-yellow-800">
              Dispositivos Detectados ({unregisteredDevices.length})
            </h3>
          </div>

          <p className="text-yellow-700 mb-4">
            Foram detectadas placas ESP32 conectadas à rede. Clique em "Cadastrar" para configurá-las.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unregisteredDevices.map(device => (
              <div key={device.device_id} className="bg-white rounded-lg p-4 border border-yellow-300">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-900">{device.name || "ESP32 Desconhecido"}</h4>
                    <p className="text-sm text-gray-600">ID: {device.device_id}</p>
                    <p className="text-sm text-gray-600">Marca: {device.brand || "Não definida"}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-600">Online</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRegisterDevice(device)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    Cadastrar
                  </button>
                </div>
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
        <DeviceTable data={devices} onDelete={handleDeleteDevice}/>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Wifi size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhum dispositivo cadastrado</h3>
          <p className="text-gray-600 mb-6">Conecte uma placa ESP32 à rede ou cadastre manualmente.</p>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700"
          >
            Cadastrar Primeiro Dispositivo
          </button>
        </div>
      )}

      {/* MODAL */}
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
