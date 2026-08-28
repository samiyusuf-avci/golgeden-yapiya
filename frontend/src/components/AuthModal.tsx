import React, { useState } from 'react';
import { Building2, Lock, Mail, User as UserIcon, ArrowRight, AlertCircle, Loader2, Eye } from 'lucide-react';
import { ApiService, translateErrorMessage } from '../api';

interface AuthModalProps {
  onSuccess: (user: any) => void;
  onGuestLogin?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess, onGuestLogin }) => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const res = await ApiService.login(email, password);
        onSuccess(res.user);
      } else {
        if (!name.trim()) {
          setError('Lütfen adınızı ve soyadınızı giriniz.');
          setLoading(false);
          return;
        }
        const res = await ApiService.register(email, password, name, 'contractor');
        onSuccess(res.user);
      }
    } catch (err: any) {
      setError(translateErrorMessage(err.message || 'Bir hata oluştu, lütfen bilgilerinizi kontrol ediniz.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl shadow-emerald-900/20 overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 bg-gradient-to-b from-slate-800/60 to-transparent text-center relative border-b border-slate-800/60">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 p-0.5 shadow-lg shadow-amber-500/30 mb-4 transform hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-400">
              <Building2 className="w-7 h-7" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Gölgeden Yapıya</h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Şeffaf Şantiye & Dijital İnşaat Yönetim Platformu
          </p>

          <div className="mt-6 flex bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/80">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                isLogin
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                !isLogin
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Yeni Hesap Oluştur
            </button>
          </div>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {error && (
            <div className="flex items-start gap-3 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Ad Soyad
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ahmet Yılmaz"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              E-Posta Adresi
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@golgeden.com"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Şifre
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-98 disabled:opacity-50 mt-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                İşlem Yapılıyor...
              </>
            ) : (
              <>
                {isLogin ? 'Giriş Yap' : 'Kayıt Ol ve Başla'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Guest Mode Option */}
          {onGuestLogin && (
            <div className="pt-3 border-t border-slate-800/80 mt-4">
              <button
                type="button"
                onClick={onGuestLogin}
                className="w-full py-2.5 px-4 bg-slate-800/70 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 text-xs font-bold rounded-xl border border-cyan-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <Eye className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Misafir Olarak Devam Et (Salt Okunur İnceleme)</span>
              </button>
            </div>
          )}
        </form>

        <div className="px-8 py-3 bg-slate-950/60 border-t border-slate-800/60 text-center">
          <p className="text-[11px] text-slate-500">
            🔒 Tüm verileriniz 256-bit JWT ile uçtan uca korunur.
          </p>
        </div>
      </div>
    </div>
  );
};
