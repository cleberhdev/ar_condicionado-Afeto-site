import React from 'react';
import { X, CheckCircle, Save } from 'lucide-react';

const SaveConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
      
      {/* Container do Modal */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in transform transition-all">
        
        {/* Cabeçalho Simples */}
        <div className="flex justify-end p-4">
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo Central */}
        <div className="px-6 pb-8 text-center">
          {/* Ícone de Confirmação */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
            <CheckCircle className="h-8 w-8 text-blue-600" />
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {title || "Confirmar Ação?"}
          </h3>
          
          <p className="text-sm text-gray-500 mb-8">
            {message || "Tem certeza que deseja salvar essas informações?"}
          </p>

          {/* Botões de Ação */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors w-full"
            >
              Voltar
            </button>
            <button
              onClick={onConfirm}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-600/40 transition-all active:scale-95 w-full flex items-center justify-center gap-2"
            >
              <Save size={18} />
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaveConfirmationModal;