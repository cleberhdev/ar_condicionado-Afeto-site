import React, { useState } from 'react';
// 1. Importe o serviço e ícones
import { deviceService } from '../services/api'; 
import { Power, Snowflake, Sun, Wind, Droplets, Zap, ThermometerSun, Minus, Plus, Loader2 } from 'lucide-react';
import SaveConfirmationModal from './SaveConfirmationModal';

const MasterControlCard = () => {
  const [power, setPower] = useState(true);
  const [temp, setTemp] = useState(23);
  const [mode, setMode] = useState('cool');

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  
  // 2. Estado de carregamento para feedback visual
  const [isLoading, setIsLoading] = useState(false);

  const MIN_TEMP = 16;
  const MAX_TEMP = 30;

  // ... (cálculos do raio e background mantêm iguais) ...
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const baseOffset = circumference * 0.35;
  const percentage = (temp - MIN_TEMP) / (MAX_TEMP - MIN_TEMP);
  // Ajuste da fórmula visual (igual fizemos no modal individual)
  const strokeDashoffset = circumference - (percentage * (circumference - baseOffset));

  const getCardBackground = () => {
     if (!power) return 'bg-gray-800';
     switch (mode) {
       case 'cool': return 'bg-gradient-to-br from-blue-600 to-indigo-700';
       case 'heat': return 'bg-gradient-to-br from-orange-500 to-red-600';
       case 'fan': return 'bg-gradient-to-br from-emerald-500 to-teal-600';
       case 'dry': return 'bg-gradient-to-br from-slate-500 to-gray-600';
       default: return 'bg-gradient-to-br from-blue-600 to-indigo-700';
     }
   };

  const handleTempChange = (increment) => {
    setTemp(prev => {
      const newValue = prev + increment;
      return Math.min(Math.max(newValue, MIN_TEMP), MAX_TEMP);
    });
  };

  // 3. Função auxiliar para enviar para todos
  const executeBroadcastCommand = async (commandPayload) => {
    setIsLoading(true);
    try {
      // Busca todos os dispositivos primeiro
      const devices = await deviceService.getAll();
      const onlineDevices = devices.filter(d => d.is_online && d.is_registered);

      console.log(`📡 Enviando comando para ${onlineDevices.length} dispositivos...`);

      // Envia comando para cada um (Promise.all para ser paralelo e rápido)
      const promises = onlineDevices.map(device => {
        // Mescla o payload com o ID do dispositivo, se necessário pelo backend
        const fullPayload = { 
            ...commandPayload, 
            device_id: device.device_id,
            brand: device.brand 
        };
        return deviceService.sendCommand(device.id, fullPayload);
      });

      await Promise.all(promises);
      alert(`Comando enviado para ${onlineDevices.length} dispositivos com sucesso!`);

    } catch (error) {
      console.error("Erro no broadcast:", error);
      alert("Erro ao enviar comandos para a rede.");
    } finally {
      setIsLoading(false);
    }
  };

  const requestBroadcast = (type) => {
    let actionData = {};
    
    if (type === 'POWER') {
      const nextState = !power;
      actionData = {
        type: 'POWER',
        title: nextState ? "Ligar Todos?" : "Desligar Todos?",
        message: nextState 
          ? "Isso enviará um comando para LIGAR todos os ares-condicionados."
          : "Isso enviará um comando para DESLIGAR todos os ares-condicionados.",
        execute: () => {
          setPower(nextState);
          // Chama a função real
          executeBroadcastCommand({
            power: nextState,
            temp: temp,
            mode: mode
          });
        }
      };
    } else if (type === 'SYNC') {
      actionData = {
        type: 'SYNC',
        title: "Sincronizar Todos?",
        message: `Aplicar (Temp: ${temp}°C, Modo: ${mode}) em TODOS os dispositivos?`,
        execute: () => {
          // Garante que o power esteja condizente com o painel (provavelmente ligado se está sincronizando configs)
          if (!power) setPower(true); 
          
          executeBroadcastCommand({
            power: true, // Força ligar ao sincronizar configurações
            temp: temp,
            mode: mode
          });
        }
      };
    }

    setPendingAction(actionData);
    setIsConfirmOpen(true);
  };

  const handleConfirmAction = () => {
    if (pendingAction && pendingAction.execute) {
      pendingAction.execute();
    }
    setIsConfirmOpen(false);
    setPendingAction(null);
  };

  return (
    <>
      <div className={`w-full h-[45vh] min-h-[350px] ${getCardBackground()} rounded-3xl shadow-2xl p-6 flex flex-col md:flex-row items-center justify-between text-white relative overflow-hidden transition-all duration-500 ease-in-out hover:shadow-xl`}>
        
        {/* Loading Overlay */}
        {isLoading && (
            <div className="absolute inset-0 bg-black/50 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
                <Loader2 size={48} className="animate-spin mb-2" />
                <span className="font-bold tracking-wide">Enviando Comandos...</span>
            </div>
        )}

        {/* ... (O RESTO DO SEU JSX MANTÉM IGUAL: fundos, esquerda, centro, direita) ... */}
        {/* Apenas verifique se no centro você atualizou a lógica do strokeDashoffset do SVG */}
        <div className="absolute top-[-50px] left-[-50px] w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-50px] right-[-50px] w-60 h-60 bg-white/10 rounded-full blur-3xl"></div>

        {/* --- ESQUERDA --- */}
        <div className="flex-1 h-full flex flex-col justify-between z-10 p-2">
            {/* ...teu codigo... */}
            <div>
            <div className="flex items-center gap-2 mb-1 opacity-80">
              <Zap size={20} />
              <span className="text-sm font-medium tracking-wider uppercase">Controle Mestre</span>
            </div>
            <h2 className="text-3xl font-bold leading-tight">Todos os<br/>Aparelhos</h2>
            <p className="text-white/80 text-sm mt-2 opacity-80">
              Envie comandos simultâneos para toda a rede.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4 md:mt-0">
            {[
              { id: 'cool', label: 'Resfriar', icon: Snowflake },
              { id: 'heat', label: 'Aquecer', icon: Sun },
              { id: 'fan', label: 'Ventilar', icon: Wind },
              { id: 'dry', label: 'Desumid.', icon: Droplets },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 border border-transparent
                  ${mode === m.id 
                    ? 'bg-white text-gray-900 shadow-lg font-bold scale-105' 
                    : 'bg-white/10 text-white hover:bg-white/20 border-white/10'}
                `}
              >
                <m.icon size={18} />
                <span className="text-sm">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* --- CENTRO --- */}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 scale-90 md:scale-100">
           {/* ...teu codigo do SVG, lembre-se de usar o strokeDashoffset CORRIGIDO aqui... */}
           <div className="relative w-64 h-64 flex items-center justify-center">
            <svg className="w-full h-full transform rotate-[150deg]" viewBox="0 0 240 240">
              <circle cx="120" cy="120" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="18" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={baseOffset} />
              <circle
                cx="120" cy="120" r={radius} fill="none" stroke="white" strokeWidth="18" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} // <--- USE A VARIAVEL CORRIGIDA
                className="transition-all duration-700 ease-out drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
              />
            </svg>
            {/* ...resto do centro... */}
             <div className="absolute inset-0 flex flex-col items-center justify-center mb-4">
              <div className="flex items-start">
                <span className="text-7xl font-bold tracking-tighter drop-shadow-md">{temp}</span>
                <span className="text-3xl font-medium mt-2">°C</span>
              </div>
              <span className="text-white/90 text-sm font-medium uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full mt-2 backdrop-blur-md">
                {mode === 'heat' ? 'Aquecendo' : mode === 'cool' ? 'Resfriando' : mode === 'fan' ? 'Ventilando' : 'Secando'}
              </span>
            </div>

            <button onClick={() => handleTempChange(-1)} className="absolute bottom-4 left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition backdrop-blur-md border border-white/10 active:scale-95">
              <Minus size={24} />
            </button>
            <button onClick={() => handleTempChange(1)} className="absolute bottom-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition backdrop-blur-md border border-white/10 active:scale-95">
              <Plus size={24} />
            </button>
           </div>
        </div>

        {/* --- DIREITA --- */}
        <div className="flex-1 h-full flex flex-col justify-center items-end gap-4 z-10 pl-4 border-l border-white/10">
             {/* ...teu codigo... */}
             <button
            onClick={() => requestBroadcast('POWER')}
            className={`group relative flex flex-col items-center justify-center w-full h-full max-h-40 rounded-2xl transition-all duration-300 border-2 
              ${power 
                ? 'bg-white text-gray-900 border-white shadow-[0_0_30px_rgba(255,255,255,0.3)]' 
                : 'bg-transparent text-white border-white/30 hover:bg-white/5'}
            `}
          >
            <Power size={48} className={`mb-2 transition-transform duration-300 ${power ? 'text-gray-900' : 'text-white'}`} strokeWidth={2.5} />
            <span className="font-bold text-lg">{power ? 'LIGADO' : 'DESLIGADO'}</span>
            <span className="text-xs opacity-70 mt-1">Status Geral</span>
          </button>

          <button 
            onClick={() => requestBroadcast('SYNC')}
            className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 backdrop-blur-md border border-white/10"
          >
            <ThermometerSun size={20} />
            Sincronizar Todos
          </button>
        </div>

      </div>

      <SaveConfirmationModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmAction}
        title={pendingAction?.title}
        message={pendingAction?.message}
      />
    </>
  );
};

export default MasterControlCard;