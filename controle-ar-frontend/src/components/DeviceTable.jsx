import React, { useState, useEffect } from 'react';
import { Search, Gamepad2, Pencil, Trash2, Wifi } from 'lucide-react';
import RemoteControlModal from './RemoteControlModal';
import EditDeviceModal from './EditDeviceModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const ITEMS_PER_PAGE = 4;

const DeviceTable = ({ data: initialData = [], onDelete, onEdit, onStatusUpdate }) => {
  const [data, setData] = useState([]);

  // Estados de busca
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Estados dos Modais
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [editingDevice, setEditingDevice] = useState(null);
  const [deletingDevice, setDeletingDevice] = useState(null);

  useEffect(() => {
    setData(Array.isArray(initialData) ? initialData : []);
  }, [initialData]);

  // Lógica de Filtro
  const filteredData = data.filter((device) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    if (searchType === 'all') {
      return (
        device.name?.toLowerCase().includes(term) ||
        device.room?.toLowerCase().includes(term) ||
        device.brand?.toLowerCase().includes(term)
      );
    }
    return device[searchType]?.toString().toLowerCase().includes(term);
  });

  // Paginação
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">

      {/* Barra de Busca */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500"
          placeholder="Buscar dispositivos..."
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Dispositivo</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Cômodo</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Marca</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Rede Wi-Fi</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Temp.</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentData.length > 0 ? (
                currentData.map((device) => (
                  <tr key={device.id || device.device_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-bold transition-colors
                          ${device.is_online 
                            ? (device.power ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500') 
                            : 'bg-red-50 text-red-300'}`}>
                          {device.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{device.name}</div>
                          <div className="text-xs text-gray-500">ID: {device.device_id || device.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{device.room}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{device.brand}</td>
                    
                    {/* 👇 MELHORIA: Ícone Wi-Fi indica conectividade agora */}
                    <td className="px-6 py-4 text-sm text-gray-600 flex items-center gap-2">
                      <Wifi size={16} className={device.is_online ? "text-green-500" : "text-red-400"} />
                      <span>{device.wifi_ssid || device.wifiSsid || "--"}</span>
                    </td>

                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {device.temperature}°C
                    </td>

                    {/* 👇 MUDANÇA PRINCIPAL: Status mostra Ligado/Desligado */}
                    <td className="px-6 py-4 text-center">
                      {!device.is_online ? (
                        <span className="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">
                          Offline
                        </span>
                      ) : device.power ? (
                        <span className="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200 shadow-sm">
                          Ligado
                        </span>
                      ) : (
                        <span className="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                          Desligado
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => setSelectedDevice(device)} className="text-blue-600 hover:bg-blue-50 p-1 rounded transition" title="Controle">
                          <Gamepad2 size={18} />
                        </button>
                        <button onClick={() => setEditingDevice(device)} className="text-indigo-600 hover:bg-indigo-50 p-1 rounded transition" title="Editar">
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => setDeletingDevice(device)} className="text-red-600 hover:bg-red-50 p-1 rounded transition" title="Excluir">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                    Nenhum dispositivo encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAIS --- */}
      {selectedDevice && (
        <RemoteControlModal
          isOpen={!!selectedDevice}
          onClose={() => setSelectedDevice(null)}
          device={selectedDevice}
          onUpdate={(updates) => onStatusUpdate(selectedDevice.id, updates)}
        />
      )}

      {editingDevice && (
        <EditDeviceModal 
          isOpen={!!editingDevice} 
          device={editingDevice} 
          onClose={() => setEditingDevice(null)} 
          onSave={onEdit} 
        />
      )}

      {deletingDevice && (
        <DeleteConfirmationModal
          isOpen={!!deletingDevice}
          onClose={() => setDeletingDevice(null)}
          onConfirm={() => {
            if (onDelete) onDelete(deletingDevice.id);
            setDeletingDevice(null);
          }}
          deviceName={deletingDevice.name}
        />
      )}
    </div>
  );
};

export default DeviceTable;