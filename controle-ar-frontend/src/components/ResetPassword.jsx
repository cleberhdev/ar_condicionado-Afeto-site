import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authService } from "../services/api";

const ResetPassword = () => {
  // Pega o uidb64 e o token diretamente da URL (ex: /reset-password/NQ/d5mwyh...)
  const { uidb64, token } = useParams(); 
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");

    if (password !== confirmPassword) {
      return setErro("As senhas não coincidem!");
    }

    setLoading(true);
    try {
      await authService.setNewPassword({
        password,
        confirm_password: confirmPassword,
        uidb64,
        token
      });
      
      setSucesso("Senha alterada com sucesso! Redirecionando para o login...");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setErro("O link é inválido ou já expirou. Peça um novo link de recuperação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full bg-white rounded-lg shadow-xl sm:max-w-md border border-gray-100 p-6 sm:p-8 text-center">
        <h1 className="text-xl font-bold leading-tight tracking-tight text-backgroundColor md:text-2xl mb-2">
          Criar Nova Senha
        </h1>
        <p className="text-sm text-gray-500 mb-6">Digite a sua nova senha abaixo.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {erro && <p className="text-red-500 text-sm font-medium bg-red-50 p-2 rounded">{erro}</p>}
          {sucesso && <p className="text-green-600 text-sm font-medium bg-green-50 p-2 rounded">{sucesso}</p>}

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-[#d5f2ec] border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-3"
            placeholder="Nova Senha"
            required minLength={6}
          />

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="bg-[#d5f2ec] border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-3"
            placeholder="Confirme a Nova Senha"
            required minLength={6}
          />

          <button 
            type="submit" 
            disabled={loading}
            className="w-full text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg text-sm px-5 py-3 mt-4"
          >
            {loading ? "A Guardar..." : "Salvar Nova Senha"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;