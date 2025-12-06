import React, { useState } from 'react';
import { X, Wifi, Lock, Eye, EyeOff } from 'lucide-react';
import SaveConfirmationModal from './SaveConfirmationModal';

const BRANDS = ["Midea", "Carrier", "Samsung", "LG", "Consul", "Daikin"];

// Adicionei a prop onSave aqui
const CreateDeviceModal = ({ isOpen, onClose, onSave }) => {
  
  const [formData, setFormData] = useState({
    name: '',
    room: '',
    brand: '',
    wifiSsid: '',
    wifiPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isCustomBrand, setIsCustomBrand] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

  const handlePreSubmit = (e) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirmSave = () => {
    // --- CORREÇÃO AQUI ---
    // Chama a função do pai para salvar de verdade
    onSave(formData); 
    
    // Limpa e fecha
    setFormData({ name: '', room: '', brand: '', wifiSsid: '', wifiPassword: '' });
    setIsCustomBrand(false);
    setShowConfirm(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm transition-opacity p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up max-h-[90vh] overflow-y-auto">
          
          <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
            <h3 className="text-xl font-bold text-gray-900">Novo Dispositivo</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handlePreSubmit} className="p-6 space-y-5">
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome do Dispositivo</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Ex: Ar da Sala" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="room" className="block text-sm font-medium text-gray-700 mb-1">Cômodo</label>
                  <input type="text" id="room" name="room" value={formData.room} onChange={handleChange} placeholder="Ex: Sala" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" required />
                </div>
                
                <div>
                  <label htmlFor="brandSelect" className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                  <select id="brandSelect" value={isCustomBrand ? "Outra" : formData.brand} onChange={handleBrandSelect} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none appearance-none" required={!isCustomBrand}>
                    <option value="" disabled>Selecione...</option>
                    {BRANDS.map(brand => (<option key={brand} value={brand}>{brand}</option>))}
                    <option value="Outra">Outra (Digitar)</option>
                  </select>
                </div>
              </div>

              {isCustomBrand && (
                <div className="animate-fade-in">
                  <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">Digite a Marca</label>
                  <input type="text" id="brand" name="brand" value={formData.brand} onChange={handleChange} placeholder="Ex: Gree, Fujitsu..." className="w-full px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" required autoFocus />
                </div>
              )}
            </div>

            <hr className="border-gray-100" />

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Wifi size={16} className="text-blue-500" />
                Configuração da Placa ESP32
              </h4>
              <div className="space-y-4">
                <div>
                  <label htmlFor="wifiSsid" className="block text-sm font-medium text-gray-700 mb-1">Nome da Rede Wi-Fi (SSID)</label>
                  <input type="text" id="wifiSsid" name="wifiSsid" value={formData.wifiSsid} onChange={handleChange} placeholder="Ex: MinhaCasa_2G" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" required />
                </div>

                <div>
                  <label htmlFor="wifiPassword" className="block text-sm font-medium text-gray-700 mb-1">Senha da Rede</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock size={18} className="text-gray-400" /></div>
                    <input type={showPassword ? "text" : "password"} id="wifiPassword" name="wifiPassword" value={formData.wifiPassword} onChange={handleChange} placeholder="••••••••" className="w-full pl-11 pr-12 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors" title={showPassword ? "Ocultar senha" : "Mostrar senha"}>
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-8 pt-4">
              <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-colors">Cancelar</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-600/40 transition-all active:scale-95">Cadastrar Dispositivo</button>
            </div>
          </form>
        </div>
      </div>

      <SaveConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSave}
        title="Cadastrar Dispositivo?"
        message={`Confirma o cadastro do dispositivo "${formData.name}"?`}
      />
    </>
  );
};

export default CreateDeviceModal;