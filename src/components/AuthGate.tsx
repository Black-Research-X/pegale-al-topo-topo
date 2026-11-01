import React, { useState } from 'react';
import { LogIn, Shield, Trophy, Flame, AlertCircle } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

interface AuthGateProps {
  onSuccess?: () => void;
}

export const AuthGate: React.FC<AuthGateProps> = () => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        if (err.message.includes('popup-closed-by-user')) {
          setErrorMsg('Se cerró la ventana de inicio de sesión de Google.');
        } else {
          setErrorMsg('No se pudo conectar con Google. Revisa tu conexión e intenta de nuevo.');
        }
      } else {
        setErrorMsg('Error al iniciar sesión con Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-amber-950/90 backdrop-blur-md border-2 border-amber-500/80 rounded-3xl p-6 sm:p-8 text-amber-50 shadow-2xl text-center">
      {/* Mascot Badge */}
      <div className="flex justify-center mb-4">
        <div className="relative">
          <img
            src="/src/assets/images/mole_arcade_badge_1793567789459.jpg"
            alt="Mascota Pégale al Topo"
            referrerPolicy="no-referrer"
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-amber-400 shadow-xl"
          />
          <div className="absolute -bottom-2 -right-2 bg-amber-400 text-amber-950 font-black text-xs px-2.5 py-0.5 rounded-full shadow-md">
            GMAIL LOGIN
          </div>
        </div>
      </div>

      <h1 className="text-2xl sm:text-3xl font-black font-['Fredoka'] text-amber-300">
        ¡Bienvenido a Pégale al Topo!
      </h1>
      <p className="text-xs sm:text-sm text-amber-200/80 mt-1 mb-5">
        Para comenzar la partida y competir en el salón arcade, es necesario iniciar sesión con tu cuenta de <strong>Google / Gmail</strong>.
      </p>

      {/* Benefits Highlights */}
      <div className="grid grid-cols-1 gap-2.5 text-left mb-6 bg-amber-900/40 border border-amber-800/70 p-4 rounded-2xl text-xs text-amber-100">
        <div className="flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Acceso seguro a todos los modos de juego arcade.</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Tus récords, estadísticas y logros guardados en la nube.</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Flame className="w-4 h-4 text-orange-400 shrink-0" />
          <span>Compite en el Salón de la Fama global.</span>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Google Sign In Button */}
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full py-3.5 px-4 rounded-2xl font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 text-sm sm:text-base group"
      >
        {/* Google G Logo SVG */}
        <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>

        <span>{loading ? 'Iniciando sesión...' : 'Iniciar Sesión con Google (Gmail)'}</span>
      </button>

      <p className="text-[11px] text-amber-200/60 mt-4">
        Usamos Firebase Authentication con Google para identificarte de forma segura.
      </p>
    </div>
  );
};
