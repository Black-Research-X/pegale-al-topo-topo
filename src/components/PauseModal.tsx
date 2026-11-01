import React from 'react';
import { Play, RotateCcw, Home, HelpCircle } from 'lucide-react';

interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
  onOpenHowTo: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  onResume,
  onRestart,
  onQuit,
  onOpenHowTo,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-amber-950 border border-amber-800 rounded-3xl p-6 text-amber-50 shadow-2xl text-center">
        <h2 className="text-2xl font-black font-['Fredoka'] text-amber-300 mb-1">
          Partida en Pausa
        </h2>
        <p className="text-xs text-amber-200/70 mb-6">
          Los topos están esperando bajo tierra...
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onResume}
            className="w-full py-3 rounded-xl font-bold bg-gradient-to-b from-amber-400 to-amber-500 text-amber-950 hover:from-amber-300 hover:to-amber-400 shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <Play className="w-4 h-4 fill-amber-950" />
            <span>Reanudar Juego</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 rounded-xl font-bold bg-amber-900/60 hover:bg-amber-800 text-amber-100 border border-amber-800 transition-colors flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reiniciar Partida</span>
          </button>

          <button
            onClick={onOpenHowTo}
            className="w-full py-2.5 rounded-xl font-bold bg-amber-900/40 hover:bg-amber-900/60 text-amber-200 border border-amber-800/60 transition-colors flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Cómo Jugar</span>
          </button>

          <button
            onClick={onQuit}
            className="w-full py-2.5 rounded-xl font-bold bg-stone-900/80 hover:bg-stone-800 text-amber-400/80 border border-stone-800 transition-colors flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <Home className="w-4 h-4" />
            <span>Salir al Menú</span>
          </button>
        </div>
      </div>
    </div>
  );
};
