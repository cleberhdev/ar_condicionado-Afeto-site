import React, { useState, useEffect } from 'react';
import { Search, Gamepad2, Pencil, Trash2, ChevronLeft, ChevronRight, Wifi, Filter } from 'lucide-react';
import RemoteControlModal from './RemoteControlModal';
import EditDeviceModal from './EditDeviceModal'; 
import DeleteConfirmationModal from './DeleteConfirmationModal';

const ITEMS_PER_PAGE = 7;

// Recebe 'data' (a lista completa) do pai
const DeviceTable = ({ data: initialData }) => {
  const [data, setData] = useState(initialData);
  
  // --- ESTADOS DE BUSCA ---
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all'); // 'all', 'name', 'room', 'id', 'brand'

  // --- ESTADO DE PAGINAÇÃO ---
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedDevice, setSelectedDevice] = useState(null);
  const [editingDevice, setEditingDevice] = useState(null);
  const [deletingDevice, setDeletingDevice] = useState(null);

  // Sincroniza o estado local 'data' sempre que a prop 'initialData' mudar
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // --- LÓGICA DE FILTRO ---
  // Cria uma lista derivada (filteredData) baseada na busca
  const filteredData = data.filter((device) => {
    if (!searchTerm) return true; // Se não tem busca, mostra tudo

    const term = searchTerm.toLowerCase();
    
    // Busca Geral (verifica em vários campos)
    if (searchType === 'all') {
      return (
        device.name.toLowerCase().includes(term) ||
        device.room.toLowerCase().includes(term) ||
        device.id.toLowerCase().includes(term) ||
        device.brand.toLowerCase().includes(term)
      );
    }

    // Busca Específica (acessa a chave dinamicamente: device['name'], device['room'], etc)
    const value = device[searchType]?.toString().toLowerCase() || '';
    return value.includes(term);
  });

  // --- LÓGICA DE PAGINAÇÃO (Agora baseada em filteredData) ---
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  // Resetar para página 1 se a busca mudar drasticamente o número de páginas
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages > 0 ? totalPages : 1);
    }
  }, [filteredData.length, totalPages, currentPage]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Funções de Navegação
  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Funções de CRUD (Mantidas)
  const handleSaveEdit = (updatedDevice) => {
    setData(prevData => prevData.map(item => 
      item.id === updatedDevice.id ? updatedDevice : item
    ));
    alert(`Dispositivo "${updatedDevice.name}" atualizado com sucesso!`);
  };

  const handleConfirmDelete = () => {
    if (deletingDevice) {
      setData(prevData => prevData.filter(item => item.id !== deletingDevice.id));
      setDeletingDevice(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* --- ÁREA DE BUSCA E FILTROS --- */}
      <div className="flex flex-col md:flex-row gap-4">
        
        {/* Select de Tipo de Filtro */}
        <div className="relative min-w-[200px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-gray-400" />
          </div>
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm shadow-sm appearance-none cursor-pointer"
          >
            <option value="all">Todos os Campos</option>
            <option value="name">Nome</option>
            <option value="room">Cômodo</option>
            <option value="brand">Marca</option>
            <option value="id">ID</option>
          </select>
          {/* Seta customizada do select */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
            <ChevronLeft className="h-4 w-4 -rotate-90" />
          </div>
        </div>

        {/* Input de Busca */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm shadow-sm"
            placeholder={
              searchType === 'all' 
                ? "Buscar por nome, cômodo, marca ou ID..." 
                : `Buscar por ${searchType === 'name' ? 'nome' : searchType === 'room' ? 'cômodo' : searchType}...`
            }
          />
        </div>
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
            {/* Agora iteramos sobre 'currentData' que vem do filteredData */}
            <tbody className="bg-white divide-y divide-gray-200">
              {currentData.map((device) => (
                <tr key={device.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {device.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{device.name}</div>
                        <div className="text-xs text-gray-500">ID: {device.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{device.room}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{device.brand}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 flex items-center gap-2">
                    <Wifi size={14} className="text-gray-400" />
                    {device.wifiSsid}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{device.temperature}°C</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${device.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {device.status === 'online' ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => setSelectedDevice(device)} className="text-blue-600 hover:bg-blue-50 p-1 rounded transition" title="Controle Remoto">
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
              ))}
              {/* Mensagem se a busca não retornar nada */}
              {currentData.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="h-8 w-8 text-gray-300 mb-2" />
                      <p>Nenhum dispositivo encontrado para "{searchTerm}".</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* --- RODAPÉ COM PAGINAÇÃO DINÂMICA --- */}
        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{filteredData.length > 0 ? startIndex + 1 : 0}</span> a <span className="font-medium">{Math.min(endIndex, filteredData.length)}</span> de <span className="font-medium">{filteredData.length}</span> resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                
                <button 
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1 || totalPages === 0}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 || totalPages === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <span className="sr-only">Anterior</span>
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    aria-current={currentPage === page ? "page" : undefined}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium
                      ${currentPage === page 
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' 
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                  >
                    {page}
                  </button>
                ))}

                <button 
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages || totalPages === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <span className="sr-only">Próximo</span>
                  <ChevronRight className="h-4 w-4" />
                </button>

              </nav>
            </div>
          </div>
        </div>
      </div>

      {selectedDevice && (
        <RemoteControlModal isOpen={!!selectedDevice} onClose={() => setSelectedDevice(null)} deviceName={selectedDevice.name} />
      )}

      {editingDevice && (
        <EditDeviceModal isOpen={!!editingDevice} device={editingDevice} onClose={() => setEditingDevice(null)} onSave={handleSaveEdit} />
      )}

      {deletingDevice && (
        <DeleteConfirmationModal isOpen={!!deletingDevice} onClose={() => setDeletingDevice(null)} onConfirm={handleConfirmDelete} deviceName={deletingDevice.name} />
      )}
    </div>
  );
};

export default DeviceTable;