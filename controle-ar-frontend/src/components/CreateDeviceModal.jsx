import React, { useState, useEffect, useRef } from 'react';
import { X, Wifi, Lock, Eye, EyeOff, Zap } from 'lucide-react';
import SaveConfirmationModal from './SaveConfirmationModal';

const BRANDS = ["Midea", "Carrier", "Fujitsu", "Samsung", "LG", "Consul", "Daikin"];

const CreateDeviceModal = ({ isOpen, onClose, onSave, availableDevices = [] }) => {
  // Estados do formulário
  const [formData, setFormData] = useState({
    name: '', 
    room: '', 
    brand: '', 
    wifiSsid: '', 
    wifiPassword: '',
    device_id: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isCustomBrand, setIsCustomBrand] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Estados para dispositivos detectados
  const [useDetectedDevice, setUseDetectedDevice] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [detectedDevice, setDetectedDevice] = useState(null);
  
  // Referência para controlar se já inicializou
  const hasInitialized = useRef(false);

  // 🔥 **CORREÇÃO: Só inicializar UMA VEZ quando o modal abrir**
  useEffect(() => {
    if (isOpen && !hasInitialized.current) {
      console.log("🔧 Inicializando modal...");
      
      if (availableDevices.length > 0) {
        // Usar dispositivo detectado por padrão se houver
        setUseDetectedDevice(true);
        const firstDevice = availableDevices[0];
        setSelectedDeviceId(firstDevice.device_id);
        setDetectedDevice(firstDevice);
        
        setFormData({
          name: firstDevice.name || `ESP32-${firstDevice.device_id.slice(-6)}`,
          room: '',
          brand: firstDevice.brand || 'Carrier',
          wifiSsid: '',
          wifiPassword: '',
          device_id: firstDevice.device_id
        });
      } else {
        // Modo manual
        setUseDetectedDevice(false);
        const newDeviceId = `esp32_${Date.now()}`;
        setFormData({
          name: '',
          room: '',
          brand: '',
          wifiSsid: '',
          wifiPassword: '',
          device_id: newDeviceId
        });
      }
      
      hasInitialized.current = true;
    }
    
    // 🔥 **CORREÇÃO: Resetar quando o modal fechar**
    if (!isOpen && hasInitialized.current) {
      console.log("🧹 Limpando estado do modal...");
      hasInitialized.current = false;
      setUseDetectedDevice(false);
      setSelectedDeviceId('');
      setDetectedDevice(null);
      setShowPassword(false);
      setIsCustomBrand(false);
      setShowConfirm(false);
      // NÃO resetar formData aqui - será resetado apenas após salvar
    }
  }, [isOpen, availableDevices]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value 
    }));
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

  const handleDeviceSelect = (e) => {
    const deviceId = e.target.value;
    setSelectedDeviceId(deviceId);
    
    const selectedDevice = availableDevices.find(d => d.device_id === deviceId);
    if (selectedDevice) {
      setDetectedDevice(selectedDevice);
      
      // Atualiza formulário MAS PRESERVA OUTROS CAMPOS
      setFormData(prev => ({
        ...prev,
        name: selectedDevice.name || `ESP32-${selectedDevice.device_id.slice(-6)}`,
        brand: selectedDevice.brand || prev.brand,
        device_id: selectedDevice.device_id
      }));
    }
  };

  const handlePreSubmit = (e) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.name.trim()) {
      alert("Por favor, insira um nome para o dispositivo");
      return;
    }
    
    if (!formData.room.trim()) {
      alert("Por favor, especifique o cômodo");
      return;
    }
    
    if (!formData.brand.trim()) {
      alert("Por favor, selecione uma marca");
      return;
    }
    
    // Se for modo manual, precisa do Wi-Fi
    if (!useDetectedDevice && !formData.wifiSsid.trim()) {
      alert("Por favor, insira o nome da rede Wi-Fi");
      return;
    }
    
    setShowConfirm(true);
  };

  const handleConfirmSave = () => {
    // Prepara dados para enviar ao backend
    const deviceData = {
      name: formData.name,
      room: formData.room,
      brand: formData.brand,
      wifi_ssid: formData.wifiSsid,
      wifi_password: formData.wifiPassword,
      device_id: formData.device_id,
      is_online: false,
      power: false,
      temperature: 24,
      mode: "cool",
      is_registered: true
    };

    // Chama a função de salvar do componente pai
    if (onSave) {
      onSave(deviceData);
    }
    
    // 🔥 **CORREÇÃO: Resetar APENAS os campos do formulário após salvar**
    setFormData({
      name: '', 
      room: '', 
      brand: '', 
      wifiSsid: '', 
      wifiPassword: '',
      device_id: ''
    });
    
    // Resetar outros estados
    setUseDetectedDevice(false);
    setSelectedDeviceId('');
    setDetectedDevice(null);
    setIsCustomBrand(false);
    setShowPassword(false);
    
    // Fechar modais
    setShowConfirm(false);
    onClose();
  };

  // 🔥 **CORREÇÃO: Handle para cancelar/fechar SEM resetar**
  const handleCancel = () => {
    // Não resetamos os dados aqui - mantém o que o usuário digitou
    // Apenas fecha o modal
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm transition-opacity p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
            <h3 className="text-xl font-bold text-gray-900">Novo Dispositivo</h3>
            <button 
              onClick={handleCancel} 
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handlePreSubmit} className="p-6 space-y-5">
            {/* Seção de dispositivos detectados */}
            {availableDevices.length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={18} className="text-blue-600" />
                  <label className="font-medium text-blue-800">Dispositivo Detectado</label>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="useDetected"
                      checked={useDetectedDevice}
                      onChange={(e) => setUseDetectedDevice(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="useDetected" className="text-sm text-gray-700">
                      Usar dispositivo detectado automaticamente
                    </label>
                  </div>
                  
                  {useDetectedDevice && (
                    <div className="space-y-2">
                      <select
                        value={selectedDeviceId}
                        onChange={handleDeviceSelect}
                        className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
                      >
                        {availableDevices.map(device => (
                          <option key={device.device_id} value={device.device_id}>
                            {device.name || "ESP32 Desconhecido"} - {device.device_id}
                          </option>
                        ))}
                      </select>
                      
                      {detectedDevice && (
                        <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
                          <div className="font-medium">Informações do dispositivo:</div>
                          <div>ID: {detectedDevice.device_id}</div>
                          <div>Marca detectada: {detectedDevice.brand || "Não identificada"}</div>
                          <div>Status: {detectedDevice.is_online ? "✅ Online" : "❌ Offline"}</div>
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-600 mt-2">
                        ✅ O dispositivo já está conectado à rede. Você pode controlá-lo imediatamente após o cadastro.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modo manual - Aviso */}
            {(!useDetectedDevice || availableDevices.length === 0) && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800 text-sm">
                  <span className="font-medium">⚠️ Modo de cadastro manual</span>
                </div>
                <p className="text-xs text-yellow-700 mt-1">
                  Você precisará configurar o código da ESP32 com o Device ID: 
                  <code className="bg-yellow-100 px-2 py-1 rounded ml-1 font-mono">
                    {formData.device_id || `esp32_${Date.now()}`}
                  </code>
                </p>
              </div>
            )}

            {/* Campos do formulário */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Dispositivo
                </label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" 
                  required 
                  placeholder="Ex: Ar da Sala" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cômodo
                  </label>
                  <input 
                    type="text" 
                    name="room" 
                    value={formData.room} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" 
                    required 
                    placeholder="Ex: Sala" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marca do Ar-Condicionado
                  </label>
                  <select 
                    value={isCustomBrand ? "Outra" : formData.brand} 
                    onChange={handleBrandSelect} 
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  >
                    <option value="" disabled>Selecione...</option>
                    {BRANDS.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                    <option value="Outra">Outra (Digitar)</option>
                  </select>
                </div>
              </div>
              
              {isCustomBrand && (
                <div className="animate-fade-in">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Digite a Marca
                  </label>
                  <input 
                    type="text" 
                    name="brand" 
                    value={formData.brand} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500" 
                    required 
                    autoFocus 
                    placeholder="Ex: Springer, Gree, Elgin..."
                  />
                </div>
              )}
            </div>
            
            {/* Seção de Wi-Fi (apenas para modo manual) */}
            {(!useDetectedDevice || availableDevices.length === 0) && (
              <>
                <hr className="border-gray-100" />
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome da Rede Wi-Fi (SSID)
                    </label>
                    <input 
                      type="text" 
                      name="wifiSsid" 
                      value={formData.wifiSsid} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" 
                      required={!useDetectedDevice}
                      placeholder="Ex: MinhaCasa_2G" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Senha da Rede Wi-Fi
                    </label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        name="wifiPassword" 
                        value={formData.wifiPassword} 
                        onChange={handleChange} 
                        className="w-full pl-4 pr-12 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" 
                        required={!useDetectedDevice}
                        placeholder="••••••••" 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)} 
                        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {/* Informações técnicas (apenas para modo manual) */}
            {(!useDetectedDevice || availableDevices.length === 0) && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 text-gray-700 text-sm">
                  <Wifi size={14} />
                  <span className="font-medium">Informações técnicas:</span>
                </div>
                <div className="text-xs text-gray-600 mt-1 space-y-1">
                  <div>Device ID: <code className="bg-gray-100 px-1 rounded font-mono">{formData.device_id}</code></div>
                  <div>Este ID deve ser configurado no código da ESP32 para o dispositivo funcionar.</div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
              <button 
                type="button" 
                onClick={handleCancel} 
                className="px-5 py-2.5 rounded-xl text-gray-700 hover:bg-gray-100 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30 transition-all"
              >
                {useDetectedDevice ? 'Cadastrar Dispositivo' : 'Cadastrar e Configurar'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <SaveConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSave}
        title="Cadastrar Dispositivo?"
        message={
          useDetectedDevice 
            ? `Confirma o cadastro do dispositivo "${formData.name}"? O dispositivo já está conectado e pronto para uso.`
            : `Confirma o cadastro do dispositivo "${formData.name}"? Você precisará configurar o código da ESP32 com o ID: ${formData.device_id}`
        }
      />
    </>
  );
};

export default CreateDeviceModal;