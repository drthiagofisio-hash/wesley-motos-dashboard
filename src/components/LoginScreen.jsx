import { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

const SENHA_HASH = 'wesley2026';

export function LoginScreen({ onLogin }) {
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setErro(false);

    setTimeout(() => {
      if (senha === SENHA_HASH) {
        localStorage.setItem('wesley_motos_auth', 'true');
        onLogin();
      } else {
        setErro(true);
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 safe-area-inset">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img
            src={`${import.meta.env.BASE_URL}logo-agora.png`}
            alt="Agora Marketing"
            className="w-24 h-24 rounded-3xl object-cover mx-auto mb-4 shadow-lg shadow-black/30 bg-white"
          />
          <h1 className="text-2xl font-bold text-white">Wesley Motos</h1>
          <p className="text-slate-400 text-sm mt-1">Dashboard de Tráfego</p>
          <p className="text-slate-500 text-xs mt-0.5">Agora Marketing</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
          <label className="block text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">
            Senha de acesso
          </label>
          <div className="relative mb-4">
            <input
              type={mostrarSenha ? 'text' : 'password'}
              value={senha}
              onChange={e => { setSenha(e.target.value); setErro(false); }}
              placeholder="Digite a senha"
              autoFocus
              className={`w-full bg-slate-700 border rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                erro ? 'border-red-500 focus:ring-red-500/50' : 'border-slate-600 focus:ring-red-500/50 focus:border-red-500'
              }`}
            />
            <button
              type="button"
              onClick={() => setMostrarSenha(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
            >
              {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {erro && (
            <div className="flex items-center gap-2 text-red-400 text-xs mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <AlertCircle size={14} />
              Senha incorreta. Tente novamente.
            </div>
          )}

          <button
            type="submit"
            disabled={!senha || loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-slate-600 text-xs mt-6">
          © 2025 Agora Marketing · Balsas-MA
        </p>
      </div>
    </div>
  );
}

export function useAuth() {
  const isLoggedIn = localStorage.getItem('wesley_motos_auth') === 'true';
  const logout = () => {
    localStorage.removeItem('wesley_motos_auth');
    window.location.reload();
  };
  return { isLoggedIn, logout };
}
