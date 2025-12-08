import React, { useState } from 'react';
import { X, Wifi, Lock, Eye, EyeOff } from 'lucide-react';
import SaveConfirmationModal from './SaveConfirmationModal';

const BRANDS = ["Midea", "Carrier", "Samsung", "LG", "Consul", "Daikin"];

const CreateDeviceModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '', room: '', brand: '', wifiSsid: '', wifiPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isCustomBrand, setIsCustomBrand] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleBrandSelect = (e) => {
    const value = e.target.value;
    if (value === "Outra") { setIsCustomBrand(true); setFormData(prev => ({ ...prev, brand: "" })); }
    else { setIsCustomBrand(false); setFormData(prev => ({ ...prev, brand: value })); }
  };

  const handlePreSubmit = (e) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirmSave = () => {
    if (onSave) onSave(formData);
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
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"><X size={20} /></button>
          </div>

          <form onSubmit={handlePreSubmit} className="p-6 space-y-5">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Dispositivo</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" required placeholder="Ex: Ar da Sala" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cômodo</label>
                  <input type="text" name="room" value={formData.room} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" required placeholder="Ex: Sala" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                  <select value={isCustomBrand ? "Outra" : formData.brand} onChange={handleBrandSelect} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                    <option value="" disabled>Selecione...</option>
                    {BRANDS.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                    <option value="Outra">Outra (Digitar)</option>
                  </select>
                </div>
              </div>
              {isCustomBrand && (
                <div className="animate-fade-in">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Digite a Marca</label>
                  <input type="text" name="brand" value={formData.brand} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500" required autoFocus />
                </div>
              )}
            </div>
            
            <hr className="border-gray-100" />
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Rede Wi-Fi (SSID)</label>
                <input type="text" name="wifiSsid" value={formData.wifiSsid} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" required placeholder="Ex: MinhaCasa_2G" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha da Rede</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} name="wifiPassword" value={formData.wifiPassword} onChange={handleChange} className="w-full pl-4 pr-12 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" required placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center text-gray-400">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4">
              <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-gray-700 hover:bg-gray-100">Cancelar</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg">Cadastrar Dispositivo</button>
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