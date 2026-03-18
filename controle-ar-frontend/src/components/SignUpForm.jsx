import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/api";

const SignUpForm = ({ buttonClasses, buttonForGFT }) => {
  const navigate = useNavigate();

  // Estados do Formulário de Cadastro
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Estados da Verificação OTP
  const [isRegistered, setIsRegistered] = useState(false); // Controla qual tela mostrar
  const [otp, setOtp] = useState("");

  // Estados de Feedback
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [loading, setLoading] = useState(false);

  // --- FUNÇÃO 1: CRIAR A CONTA ---
  const handleRegister = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (password !== confirmPassword) {
      return setErro("As senhas não coincidem!");
    }

    setLoading(true);

    try {
      const res = await authService.register({
        full_name: fullName,
        email: email,
        password: password,
        password2: confirmPassword
      });

      // Sucesso! Mostra a mensagem e muda para a tela de OTP
      setSucesso(res.message || "Conta criada! Verifique o seu e-mail.");
      setIsRegistered(true); 

    } catch (err) {
      if (err.response?.data) {
        setErro("Erro ao cadastrar. Verifique se o e-mail já está em uso.");
      } else {
        setErro("Erro de conexão com o servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- FUNÇÃO 2: VERIFICAR O CÓDIGO (OTP) ---
  const handleVerify = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setLoading(true);

    try {
      await authService.verifyEmail(otp);
      
      // Se a verificação der certo:
      setSucesso("E-mail verificado com sucesso! Redirecionando para o login...");
      
      // Aguarda 2 segundos para o usuário ler a mensagem e manda para o Login
      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (err) {
      setErro("Código inválido ou expirado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };


  // =========================================================
  // RENDERIZAÇÃO 1: TELA DE VERIFICAÇÃO OTP (Se já cadastrou)
  // =========================================================
  if (isRegistered) {
    return (
      <div className="w-full bg-white rounded-lg shadow-xl sm:max-w-md border border-gray-100 p-6 sm:p-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            {/* Ícone de E-mail bonito */}
            <div className="bg-[#d5f2ec] p-3 rounded-full">
              <svg className="w-8 h-8 text-brightColor" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-backgroundColor">Verifique seu E-mail</h1>
          <p className="text-sm text-gray-500">
            Enviamos um código de 6 dígitos para <br/><span className="font-semibold text-gray-700">{email}</span>
          </p>

          <form onSubmit={handleVerify} className="space-y-6 mt-6">
            {erro && <p className="text-red-500 text-sm font-medium">{erro}</p>}
            {sucesso && <p className="text-green-600 text-sm font-medium">{sucesso}</p>}

            <input
              type="text"
              maxLength="6"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Aceita apenas números
              className="bg-[#d5f2ec] border border-gray-300 text-gray-900 text-2xl text-center tracking-[0.5em] font-bold rounded-lg focus:ring-brightColor focus:border-brightColor block w-full p-3 transition-all duration-200"
              placeholder="••••••"
              required
            />

            <button 
              type="submit" 
              disabled={loading || otp.length < 6} 
              className={`w-full ${buttonClasses} ${loading || otp.length < 6 ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? "Verificando..." : "Confirmar Código"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================
  // RENDERIZAÇÃO 2: TELA DE CADASTRO NORMAL (Padrão)
  // =========================================================
  return (
    <div className="w-full bg-white rounded-lg shadow-xl sm:max-w-md border border-gray-100 max-h-[98vh] overflow-y-auto scrollbar-thin">
      <div className="p-5 space-y-4 sm:p-6">
        <h1 className="text-xl font-bold leading-tight tracking-tight text-backgroundColor text-center">
          Criar Conta
          <p className="text-sm font-normal text-gray-500 mt-1">
            Cadastre-se para começar
          </p>
        </h1>

        <form className="space-y-4" onSubmit={handleRegister}>
          {erro && <p className="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded">{erro}</p>}

          <div className="grid grid-cols-1 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
              </div>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-[#d5f2ec] border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-brightColor focus:border-brightColor block w-full pl-10 p-2.5" placeholder="Nome Completo" required />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path></svg>
              </div>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-[#d5f2ec] border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-brightColor focus:border-brightColor block w-full pl-10 p-2.5" placeholder="Email" required />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path></svg>
              </div>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-[#d5f2ec] border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-brightColor focus:border-brightColor block w-full pl-10 p-2.5" placeholder="Senha" required minLength={6} />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path></svg>
              </div>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="bg-[#d5f2ec] border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-brightColor focus:border-brightColor block w-full pl-10 p-2.5" placeholder="Confirmação de Senha" required minLength={6} />
            </div>
          </div>

          <button type="submit" disabled={loading} className={`w-full ${buttonClasses} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
            {loading ? "Criando conta..." : "Criar Conta"}
          </button>
        </form>
        
        <p className="text-sm text-center text-gray-600 pt-2 border-t border-gray-100 mt-4">
          Já tem uma conta? <a href="/login" className="font-medium text-brightColor hover:underline">Iniciar sessão</a>
        </p>
      </div>
    </div>
  );
};

export default SignUpForm;