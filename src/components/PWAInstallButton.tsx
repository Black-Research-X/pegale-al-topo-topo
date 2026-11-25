import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    if (variant === 'banner') {
      return (
        <button
          onClick={install}
          className="w-full py-2.5 px-4 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-emerald-50 border border-emerald-500/60 transition-all flex items-center justify-center gap-2 text-xs font-bold cursor-pointer shadow-sm whitespace-nowrap shrink-0"
        >
          <Download className="w-4 h-4 text-emerald-300" />
          <span>Instalar App en tu Dispositivo</span>
        </button>
      );
    }

    return (
      <button
        onClick={install}
        title="Instalar App"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Instalar App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        {variant === 'banner' ? (
          <button
            onClick={() => setShowIOSGuide(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-emerald-50 border border-emerald-500/60 transition-all flex items-center justify-center gap-2 text-xs font-bold cursor-pointer shadow-sm whitespace-nowrap shrink-0"
          >
            <Smartphone className="w-4 h-4 text-emerald-300" />
            <span>Instalar en iPhone / iPad</span>
          </button>
        ) : (
          <button
            onClick={() => setShowIOSGuide(true)}
            title="Instalar en iOS"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-900/70 hover:bg-amber-800 text-amber-200 border border-amber-700 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Instalar iOS</span>
          </button>
        )}

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-3xl bg-amber-950 border-2 border-amber-500/80 p-6 text-amber-50 shadow-2xl">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-amber-900">
                <h3 className="text-lg font-black font-['Fredoka'] text-amber-300">
                  Instalar en iPhone / iPad
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1.5 rounded-xl bg-amber-900/60 hover:bg-amber-800 text-amber-300 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="space-y-3 text-xs sm:text-sm text-amber-100 leading-relaxed text-left">
                <li className="flex items-start gap-2.5">
                  <Share className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    1. Toca el botón <strong>Compartir</strong> en la barra inferior de Safari.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <PlusSquare className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    2. Desliza hacia abajo y selecciona <strong>Agregar a inicio</strong>.
                  </span>
                </li>
              </ol>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-amber-400 hover:bg-amber-300 py-2.5 text-sm font-bold text-amber-950 transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
