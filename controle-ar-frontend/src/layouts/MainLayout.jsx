import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Server, 
  LogOut, 
  Menu, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const MainLayout = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  
  // Estado para controlar o modo global (afeta o background)
  const [globalMode, setGlobalMode] = useState('off');

  // Função para estilizar os links
  const getLinkClass = (path) => {
    const isActive = location.pathname === path;
    
    return `
      flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all duration-200
      ${isActive 
        ? "bg-blue-600 text-white shadow-md font-semibold" 
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
      }
      ${!isOpen ? "justify-center" : ""} 
    `;
  };

  // --- LÓGICA DE CORES ATUALIZADA ---
  const getBackgroundClass = () => {
    switch (globalMode) {
      case 'cool': // Frio: Azul
        return 'bg-gradient-to-br from-blue-50 via-blue-50 to-cyan-100';
      
      case 'heat': // Quente: Laranja/Vermelho
        return 'bg-gradient-to-br from-orange-50 via-orange-50 to-red-100';
      
      case 'fan': // Ventilar: Verde (Natureza/Fresco)
        return 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-100';
      
      case 'dry': // Desumidificar: Cinza (Neutro/Seco)
        return 'bg-gradient-to-br from-gray-100 via-slate-100 to-zinc-200';
      
      default: // Off: Padrão
        return 'bg-slate-50';
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      
      {/* --- SIDEBAR --- */}
      <aside 
        className={`
          bg-slate-900 text-white flex flex-col transition-all duration-300 border-r border-slate-800 z-20
          ${isOpen ? "w-72 p-4" : "w-20 p-2"} 
        `}
      >
        
        {/* CABEÇALHO DA SIDEBAR */}
        <div className={`flex items-center h-16 mb-6 ${isOpen ? "justify-between px-2" : "justify-center"}`}>
          
          {isOpen && (
            <div className="flex items-center gap-3 overflow-hidden animate-fade-in">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-sm">
                S
              </div>
              <div>
                <h1 className="text-lg font-bold leading-none">Smart AC</h1>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">IoT</p>
              </div>
            </div>
          )}

          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isOpen ? "Recolher" : "Expandir"}
          >
            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        {/* NAVEGAÇÃO PRINCIPAL */}
        <nav className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden">
          <Link to="/" className={getLinkClass('/')} title={!isOpen ? "Dashboard" : ""}>
            <LayoutDashboard size={22} className="min-w-[22px]" />
            {isOpen && <span className="whitespace-nowrap animate-fade-in">Dashboard</span>}
          </Link>

          <Link to="/placas" className={getLinkClass('/placas')} title={!isOpen ? "Placas ESP32" : ""}>
            <Server size={22} className="min-w-[22px]" />
            {isOpen && <span className="whitespace-nowrap animate-fade-in">Placas ESP32</span>}
          </Link>
        </nav>

        {/* RODAPÉ */}
        <div className="mt-auto border-t border-slate-800 pt-4">
          <button 
            className={`
              flex items-center gap-3 px-3 py-3 w-full rounded-lg text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors
              ${!isOpen ? "justify-center" : ""}
            `}
            title={!isOpen ? "Sair do Sistema" : ""}
          >
            <LogOut size={22} className="min-w-[22px]" />
            {isOpen && <span className="whitespace-nowrap animate-fade-in">Sair</span>}
          </button>
        </div>
      </aside>

      {/* --- ÁREA DE CONTEÚDO --- */}
      {/* O Background muda aqui baseado no getBackgroundClass() */}
      <main className={`flex-1 overflow-auto relative transition-colors duration-700 ease-in-out ${getBackgroundClass()}`}>
        
        {/* Cabeçalho Mobile */}
        <header className="bg-white/80 backdrop-blur-md p-4 shadow-sm flex items-center justify-between md:hidden sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-white">S</span>
            </div>
            <span className="font-bold text-slate-700">Smart AC</span>
          </div>
          <button onClick={() => setIsOpen(!isOpen)} className="p-2 bg-slate-100 rounded-md">
            <Menu className="text-slate-600" size={24} />
          </button>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Outlet context={{ setGlobalMode }} />
        </div>
      </main>

    </div>
  );
};

export default MainLayout;