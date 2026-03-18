import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/api"; 

const SignInForm = ({ buttonClasses, buttonForGFT }) => {
  const navigate = useNavigate();

  // Estados dos inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Estados de controle de tela e feedback
  const [isForgotPassword, setIsForgotPassword] = useState(false); // Alterna as telas
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(""); // Usado para a mensagem do email de recuperação
  const [loading, setLoading] = useState(false);

  // --- FUNÇÃO 1: FAZER LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      await authService.login(email, password);
      navigate("/devices"); 
    } catch (err) {
      setErro("E-mail ou senha incorretos, ou conta não verificada.");
    } finally {
      setLoading(false);
    }
  };

  // --- FUNÇÃO 2: PEDIR RECUPERAÇÃO DE SENHA ---
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso("");
    
    if (!email) {
      return setErro("Por favor, digite o seu e-mail primeiro.");
    }

    setLoading(true);

    try {
      // Chama a rota que configurámos no Django (PasswordResetRequestView)
      const res = await authService.requestPasswordReset(email);
      setSucesso(res.message || "Um link foi enviado para seu email, para poder mudar de senha.");
    } catch (err) {
      setErro("Não foi possível solicitar a recuperação. Verifique o e-mail.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // RENDERIZAÇÃO 1: TELA DE RECUPERAR SENHA
  // =========================================================
  if (isForgotPassword) {
    return (
      <div className="w-full bg-white rounded-lg shadow-xl md:mt-0 sm:max-w-md xl:p-0 border border-gray-100">
        <div className="p-6 space-y-6 md:space-y-7 sm:p-8 text-center">
          
          <div className="bg-[#d5f2ec] w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-brightColor" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
          </div>

          <h1 className="text-xl font-bold leading-tight tracking-tight text-backgroundColor md:text-2xl">
            Recuperar Senha
            <p className="text-sm font-normal text-gray-500 mt-2">
              Digite o e-mail cadastrado para receber o link de recuperação.
            </p>
          </h1>

          <form className="space-y-5" onSubmit={handlePasswordReset}>
            {erro && <p className="text-red-500 text-sm font-medium bg-red-50 p-2 rounded">{erro}</p>}
            {sucesso && <p className="text-green-600 text-sm font-medium bg-green-50 p-2 rounded">{sucesso}</p>}

            <div className="relative text-left">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path></svg>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#d5f2ec] border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-brightColor focus:border-brightColor block w-full pl-10 p-3"
                placeholder="Seu Email"
                required
              />
            </div>

            <button type="submit" disabled={loading} className={`w-full ${buttonClasses} ${loading ? 'opacity-70' : ''}`}>
              {loading ? "Enviando..." : "Enviar link de recuperação"}
            </button>
          </form>

          <button 
            onClick={() => {
              setIsForgotPassword(false);
              setErro("");
              setSucesso("");
            }} 
            className="text-sm font-medium text-brightColor hover:underline mt-4"
          >
            ← Voltar para o login
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // RENDERIZAÇÃO 2: TELA DE LOGIN NORMAL (Padrão)
  // =========================================================
  return (
    <div className="w-full bg-white rounded-lg shadow-xl md:mt-0 sm:max-w-md xl:p-0 border border-gray-100">
      <div className="p-6 space-y-6 md:space-y-7 sm:p-8">
        <h1 className="text-xl font-bold leading-tight tracking-tight text-backgroundColor md:text-2xl text-center">
          Seja bem-vindo!
          <p className="text-sm font-normal text-gray-500 mt-1">Faça login na sua conta.</p>
        </h1>

        <form className="space-y-5 md:space-y-6" onSubmit={handleLogin}>
          {erro && <p className="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded">{erro}</p>}

          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path></svg>
            </div>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-[#d5f2ec] border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-brightColor focus:border-brightColor block w-full pl-10 p-3" placeholder="Email" required />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path></svg>
            </div>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-[#d5f2ec] border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-brightColor focus:border-brightColor block w-full pl-10 p-3" placeholder="Senha" required />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input id="remember" type="checkbox" className="w-4 h-4 rounded bg-gray-50 cursor-pointer" />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="remember" className="text-gray-500 cursor-pointer">Lembre de mim</label>
              </div>
            </div>
            
            {/* 👇 AO CLICAR AQUI, MUDA PARA O MODO "ESQUECI A SENHA" 👇 */}
            <button 
              type="button" 
              onClick={() => {
                setIsForgotPassword(true);
                setErro("");
              }}
              className="text-sm font-medium text-brightColor hover:underline transition-colors cursor-pointer bg-transparent border-none"
            >
              Esqueceu sua Senha?
            </button>
          </div>

          <button type="submit" disabled={loading} className={`w-full ${buttonClasses} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {/* ... Restante do código das redes sociais continua igual ... */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Ou entre com</span></div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button type="button" className={buttonForGFT}><svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" /></svg></button>
          <button type="button" className={buttonForGFT}><svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg></button>
          <button type="button" className={buttonForGFT}><svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M13.6823 10.6218L20.2391 3H18.6854L12.9921 9.61788L8.44486 3H3.2002L10.0765 13.0074L3.2002 21H4.75404L10.7663 14.0113L15.5685 21H20.8131L13.6819 10.6218H13.6823ZM11.5541 13.0956L10.8574 12.0991L5.31391 4.16971H7.70053L12.1742 10.5689L12.8709 11.5655L18.6861 19.8835H16.2995L11.5541 13.096V13.0956Z" /></svg></button>
        </div>

        <p className="text-sm text-center text-gray-600 mt-4 border-t border-gray-100 pt-4">
         Se você não tem uma conta, cadastre-se.
        </p>
      </div>
    </div>
  );
};

export default SignInForm;