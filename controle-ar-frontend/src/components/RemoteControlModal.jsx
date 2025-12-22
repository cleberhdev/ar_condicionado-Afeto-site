import React, { useState, useEffect } from 'react';
import { X, Power, Snowflake, Sun, Wind, Droplets, Minus, Plus, Zap } from 'lucide-react';
import { deviceService } from '../services/api';

const RemoteControlModal = ({ isOpen, onClose, device, onUpdate }) => {

  const [power, setPower] = useState(device?.power || false);
  const [temp, setTemp] = useState(device?.temperature || 24);
  const [mode, setMode] = useState(device?.mode || 'cool');

  const MIN_TEMP = 16;
  const MAX_TEMP = 30;

  useEffect(() => {
    if (device) {
      setPower(device.power);
      setTemp(device.temperature);
      setMode(device.mode);
    }
  }, [device]);

  const sendCommand = async (newPower, newTemp, newMode) => {
    if (!device) return;

    const payload = {
      power: newPower,
      temp: newTemp,
      mode: newMode,
      brand: device.brand || "Carrier",
      device_id: device.device_id
    };

    console.log("📡 Enviando comando:", {
      rest_id: device.id,
      esp32_id: device.device_id,
      payload
    });

    try {
      await deviceService.sendCommand(device.id, payload);

      if (onUpdate) {
        onUpdate({
          power: newPower,
          temperature: newTemp,
          mode: newMode
        });
      }

    } catch (error) {
      console.error("Erro ao enviar comando:", error);
      alert(`Erro ao enviar comando: ${error.message}`);
    }
  };

  const handlePower = () => {
    const newState = !power;
    setPower(newState);
    sendCommand(newState, temp, mode);
  };

  const handleTempChange = (increment) => {
    if (!power) return;
    const newTemp = Math.min(Math.max(temp + increment, MIN_TEMP), MAX_TEMP);
    setTemp(newTemp);
    sendCommand(power, newTemp, mode);
  };

  const handleModeChange = (newModeValue) => {
    if (!power) return;
    setMode(newModeValue);
    sendCommand(power, temp, newModeValue);
  };

  const getModalBackground = () => {
    if (!power) return 'bg-gray-900';
    switch (mode) {
      case 'cool': return 'bg-gradient-to-br from-blue-600 to-indigo-700';
      case 'heat': return 'bg-gradient-to-br from-orange-500 to-red-600';
      case 'fan':  return 'bg-gradient-to-br from-emerald-500 to-teal-600';
      case 'dry':  return 'bg-gradient-to-br from-slate-500 to-gray-600';
      default:     return 'bg-gradient-to-br from-blue-600 to-indigo-700';
    }
  };

  if (!isOpen || !device) return null;

  // --- LÓGICA DO DIAL CORRIGIDA ---
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  // Gap de 35% do círculo (parte de baixo aberta)
  const baseOffset = circumference * 0.35; 
  
  // Percentual preenchido baseado na temperatura (0 a 1)
  const percentage = (temp - MIN_TEMP) / (MAX_TEMP - MIN_TEMP);
  
  // O offset final deve variar de:
  // - Vazio: circumference (offset máximo, esconde tudo)
  // - Cheio: baseOffset (offset mínimo, mostra tudo menos o gap)
  // A fórmula abaixo calcula exatamente isso:
  const activeStrokeDashoffset = circumference - (percentage * (circumference - baseOffset));


  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">

      <div className={`w-full max-w-lg ${getModalBackground()} rounded-3xl shadow-2xl overflow-hidden relative transition-all duration-500 ease-in-out flex flex-col`}>

        {/* fundos decorativos */}
        <div className="absolute top-[-50px] left-[-50px] w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-50px] right-[-50px] w-60 h-60 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* header */}
        <div className="flex justify-between items-start p-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1 text-white/80">
              <Zap size={18} />
              <span className="text-xs font-bold tracking-wider uppercase">Controle Remoto</span>
            </div>
            <h2 className="text-2xl font-bold text-white leading-tight">{device.name}</h2>
            <p className="text-white/70 text-xs mt-1">
              {power ? 'Conectado e Operando' : 'Dispositivo Desligado'}
            </p>
          </div>

          <button 
            onClick={onClose} 
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-md"
          >
            <X size={20} />
          </button>
        </div>

        {/* corpo */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">

          {/* dial da temperatura */}
          <div className="relative w-64 h-64 flex items-center justify-center mb-8">
            <svg className="w-full h-full transform rotate-[150deg]" viewBox="0 0 240 240">
              {/* Círculo de Fundo (Track) */}
              <circle cx="120" cy="120" r={radius} fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="18"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={baseOffset}
              />

              {/* Círculo Ativo (Progresso) */}
              {power && (
                <circle
                  cx="120"
                  cy="120"
                  r={radius}
                  fill="none"
                  stroke="white"
                  strokeWidth="18"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  // 👇 AQUI ESTAVA O ERRO: Removemos o "+ baseOffset" redundante
                  strokeDashoffset={activeStrokeDashoffset}
                  className="transition-all duration-700 ease-out drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                />
              )}
            </svg>

            {/* valores internos */}
            <div className="absolute inset-0 flex flex-col items-center justify-center mb-4 text-white">
              {power ? (
                <>
                  <div className="flex items-start animate-scale-in">
                    <span className="text-7xl font-bold tracking-tighter drop-shadow-md">{temp}</span>
                    <span className="text-3xl font-medium mt-2">°C</span>
                  </div>
                  <span className="text-white/90 text-sm font-medium uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full mt-2 backdrop-blur-md">
                    {mode === 'heat' ? 'Aquecendo' :
                     mode === 'cool' ? 'Resfriando' :
                     mode === 'fan'  ? 'Ventilando' : 'Secando'}
                  </span>
                </>
              ) : (
                <span className="text-2xl font-medium text-white/30 uppercase tracking-widest">OFF</span>
              )}
            </div>

            {/* botões temp */}
            <button
              onClick={() => handleTempChange(-1)}
              disabled={!power}
              className={`absolute bottom-4 left-4 p-3 rounded-full transition backdrop-blur-md border active:scale-95
                ${power ? 'bg-white/10 hover:bg-white/20 border-white/10 text-white'
                        : 'bg-white/5 border-white/5 text-white/20 cursor-not-allowed'}`}>
              <Minus size={24} />
            </button>

            <button
              onClick={() => handleTempChange(1)}
              disabled={!power}
              className={`absolute bottom-4 right-4 p-3 rounded-full transition backdrop-blur-md border active:scale-95
                ${power ? 'bg-white/10 hover:bg-white/20 border-white/10 text-white'
                        : 'bg-white/5 border-white/5 text-white/20 cursor-not-allowed'}`}>
              <Plus size={24} />
            </button>
          </div>

          {/* botão power */}
          <button
            onClick={handlePower}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl border-4 transition-all duration-300 hover:scale-110 active:scale-95 mb-8
              ${power ? 'bg-white border-white/20 text-gray-900 shadow-[0_0_30px_rgba(255,255,255,0.4)]'
                      : 'bg-red-500 border-red-400 text-white shadow-lg'}`}>
            <Power size={32} strokeWidth={3} />
          </button>

          {/* modos */}
          <div className="grid grid-cols-4 gap-3 w-full">
            {[
              { id: 'cool', label: 'Frio', icon: Snowflake },
              { id: 'heat', label: 'Quente', icon: Sun },
              { id: 'fan', label: 'Vento', icon: Wind },
              { id: 'dry', label: 'Seco', icon: Droplets },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => handleModeChange(m.id)}
                disabled={!power}
                className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 border 
                  ${mode === m.id && power
                    ? 'bg-white text-gray-900 shadow-lg scale-105 border-white font-bold'
                    : 'bg-white/5 text-white/60 border-white/5 hover:bg-white/10'} 
                  ${!power && 'opacity-30 cursor-not-allowed'}`}
              >
                <m.icon size={20} className="mb-1" />
                <span className="text-[10px] uppercase">{m.label}</span>
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default RemoteControlModal;