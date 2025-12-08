import React, { useState, useEffect } from 'react';
import { X, Wifi, Lock, Eye, EyeOff, Save } from 'lucide-react';
import SaveConfirmationModal from './SaveConfirmationModal';

const BRANDS = ["Midea", "Carrier", "Samsung", "LG", "Consul", "Daikin"];

const EditDeviceModal = ({ isOpen, onClose, device, onSave }) => {
  const [formData, setFormData] = useState({
    id: '', // Importante manter o ID para a atualização
    name: '',
    room: '',
    brand: '',
    wifiSsid: '', // O backend pode enviar wifi_ssid, vamos tratar isso
    wifiPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isCustomBrand, setIsCustomBrand] = useState(false);
  
  // Novo estado de confirmação
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (device) {
      const isStandard = BRANDS.includes(device.brand);
      setFormData({
        id: device.id, // Garante que o ID numérico esteja presente
        name: device.name || '',
        room: device.room || '',
        brand: device.brand || '',
        // Tenta pegar wifiSsid (frontend antigo) ou wifi_ssid (backend)
        wifiSsid: device.wifiSsid || device.wifi_ssid || '',
        wifiPassword: '' // Senha vem vazia por segurança
      });
      setIsCustomBrand(!isStandard && !!device.brand);
    }
  }, [device]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBrandSelect = (e) => {
    const value = e.target.value;
    if (value === "Outra") {
      setIsCustomBrand(true);
      setFormData(prev => ({ ...prev, brand: "" }));
    } else {
      setIsCustomBrand(false);
      setFormData(prev => ({ ...prev, brand: value }));
    }
  };

  // 1. Ao clicar em Salvar, apenas abre a confirmação
  const handlePreSubmit = (e) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  // 2. Se confirmar, executa o salvamento real
  const handleConfirmSave = () => {
    // Chama a função onEdit (passada como onSave) do pai
    if (onSave) {
        onSave(formData);
    }
    setShowConfirm(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
        
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
          
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Editar Dispositivo</h3>
              <p className="text-sm text-gray-400">Atualize as informações do seu ar-condicionado</p>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto">
            {/* O submit chama handlePreSubmit */}
            <form id="editForm" onSubmit={handlePreSubmit} className="space-y-5">

              <div className="group">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">
                  Nome do Dispositivo
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-300"
                    placeholder="Ex: Ar da Sala"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">
                    Cômodo
                  </label>
                  <input
                    type="text"
                    name="room"
                    value={formData.room}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                    placeholder="Ex: Quarto"
                  />
                </div>

                <div className="group">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">
                    Marca
                  </label>
                  <select
                    value={isCustomBrand ? "Outra" : formData.brand}
                    onChange={handleBrandSelect}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none bg-white"
                  >
                    {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                    <option value="Outra">Outra (Digitar)</option>
                  </select>
                </div>
              </div>

              {isCustomBrand && (
                <div className="animate-fade-in-up">
                  <label className="block text-xs font-bold text-blue-600 uppercase tracking-wide mb-1.5 ml-1">
                    Digite a Marca Personalizada
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl border-2 border-blue-100 bg-blue-50/50 text-gray-900 font-medium focus:border-blue-500 focus:bg-white outline-none transition-all"
                    placeholder="Ex: Gree, Fujitsu..."
                  />
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-4 mt-2">
                <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Wifi size={16} className="text-blue-500" />
                  Configuração de Rede
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 ml-1">Nome da Rede (SSID)</label>
                    <input
                      type="text"
                      name="wifiSsid"
                      value={formData.wifiSsid}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1 ml-1">Senha do Wi-Fi</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock size={14} className="text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="wifiPassword"
                        value={formData.wifiPassword}
                        onChange={handleChange}
                        placeholder="Nova senha (opcional)"
                        className="w-full pl-9 pr-10 px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </form>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-200 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            {/* O onClick dispara o submit do form via ID, ou podemos chamar a função direta */}
            <button
              onClick={handlePreSubmit}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:shadow-blue-600/30 transition-all active:scale-95 flex items-center gap-2"
            >
              <Save size={18} />
              Salvar Alterações
            </button>
          </div>

        </div>
      </div>

      {/* --- MODAL DE CONFIRMAÇÃO --- */}
      <SaveConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSave}
        title="Salvar Alterações?"
        message={`Deseja confirmar a edição do dispositivo "${formData.name}"?`}
      />
    </>
  );
};

export default EditDeviceModal;