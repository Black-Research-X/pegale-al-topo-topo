import React from 'react';
import { X, Trophy, Zap, AlertTriangle, ShieldCheck, Keyboard } from 'lucide-react';
import { MoleGraphic } from './MoleGraphic';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-amber-950 border border-amber-800 rounded-3xl p-6 text-amber-50 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-900/80 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📖</span>
            <h2 className="text-xl sm:text-2xl font-black font-['Fredoka'] text-amber-300">
              Guía de Juego y Reglas
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-amber-900/60 hover:bg-amber-800 text-amber-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tipos de Topos */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            Familia de Topos y Puntuación
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Topo Normal */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-900/40 border border-amber-800/60">
              <div className="w-14 h-14 shrink-0 flex items-center justify-center">
                <MoleGraphic type="NORMAL" state="UP" hitsLeft={1} maxHits={1} />
              </div>
              <div>
                <div className="font-bold text-amber-100 flex items-center gap-2">
                  <span>Topo Clásico</span>
                  <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded">
                    +100 pts
                  </span>
                </div>
                <p className="text-xs text-amber-200/70 mt-0.5">
                  El travieso topo común. Aparece y se esconde a velocidad normal.
                </p>
              </div>
            </div>

            {/* Topo Dorado */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-900/40 border border-amber-700/60">
              <div className="w-14 h-14 shrink-0 flex items-center justify-center">
                <MoleGraphic type="GOLDEN" state="UP" hitsLeft={1} maxHits={1} />
              </div>
              <div>
                <div className="font-bold text-amber-300 flex items-center gap-2">
                  <span>Topo Dorado</span>
                  <span className="text-xs font-mono font-bold text-yellow-300 bg-amber-950/80 px-1.5 py-0.5 rounded">
                    +300 pts
                  </span>
                </div>
                <p className="text-xs text-amber-200/70 mt-0.5">
                  ¡Corona de oro y destellos! Muy codiciado pero más rápido.
                </p>
              </div>
            </div>

            {/* Topo con Casco */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-900/40 border border-amber-800/60">
              <div className="w-14 h-14 shrink-0 flex items-center justify-center">
                <MoleGraphic type="HELMET" state="UP" hitsLeft={2} maxHits={2} />
              </div>
              <div>
                <div className="font-bold text-amber-100 flex items-center gap-2">
                  <span>Topo Obrero</span>
                  <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded">
                    2 Golpes (+200 pts)
                  </span>
                </div>
                <p className="text-xs text-amber-200/70 mt-0.5">
                  El primer golpe quita el casco (+50 pts) y el segundo lo noquea (+150 pts).
                </p>
              </div>
            </div>

            {/* Topo Congelado */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-cyan-950/40 border border-cyan-800/60">
              <div className="w-14 h-14 shrink-0 flex items-center justify-center">
                <MoleGraphic type="FROZEN" state="UP" hitsLeft={1} maxHits={1} />
              </div>
              <div>
                <div className="font-bold text-cyan-200 flex items-center gap-2">
                  <span>Topo Congelado</span>
                  <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded">
                    +150 pts + Hielo
                  </span>
                </div>
                <p className="text-xs text-cyan-200/70 mt-0.5">
                  Ralentiza el tiempo durante 5 segundos para golpear todo sin parar.
                </p>
              </div>
            </div>

            {/* Topo Ninja */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-purple-950/40 border border-purple-800/60">
              <div className="w-14 h-14 shrink-0 flex items-center justify-center">
                <MoleGraphic type="NINJA" state="UP" hitsLeft={1} maxHits={1} />
              </div>
              <div>
                <div className="font-bold text-purple-200 flex items-center gap-2">
                  <span>Topo Ninja</span>
                  <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950/80 px-1.5 py-0.5 rounded">
                    +200 pts
                  </span>
                </div>
                <p className="text-xs text-purple-200/70 mt-0.5">
                  Ultra veloz. Asoma su cabeza en milésimas de segundo. ¡Reflejos ninja!
                </p>
              </div>
            </div>

            {/* Topo Bomba */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-rose-950/40 border border-rose-800/60">
              <div className="w-14 h-14 shrink-0 flex items-center justify-center">
                <MoleGraphic type="BOMB" state="UP" hitsLeft={1} maxHits={1} />
              </div>
              <div>
                <div className="font-bold text-rose-300 flex items-center gap-2">
                  <span>¡Dinamita / Bomba!</span>
                  <span className="text-xs font-mono font-bold text-red-300 bg-black/50 px-1.5 py-0.5 rounded">
                    ¡PELIGRO!
                  </span>
                </div>
                <p className="text-xs text-rose-200/70 mt-0.5">
                  ¡No la golpees! Resta -200 puntos y te quita una vida en Supervivencia.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sistema de Combos & Controles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-amber-900/80">
          <div>
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              Multiplicador de Racha (Combos)
            </h4>
            <p className="text-xs text-amber-200/80 leading-relaxed">
              Cada topo que golpees consecutivamente sin fallar al aire aumentará tu racha. Con rachas de 5, 10 y 15 conseguirás multiplicadores de puntuación <strong>x2, x3 y hasta x5</strong>. ¡Fallar al aire reinicia la racha!
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Keyboard className="w-4 h-4 text-amber-400" />
              Controles Táctiles y Teclado
            </h4>
            <p className="text-xs text-amber-200/80 leading-relaxed">
              Usa el <strong>ratón</strong> o la <strong>pantalla táctil</strong> para golpear. Si juegas en PC, puedes usar las teclas <strong>[1 al 9]</strong> o <strong>[Q,W,E / A,S,D / Z,X,C]</strong> para golpear hoyos a la velocidad de la luz.
            </p>
          </div>
        </div>

        {/* Footer Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold bg-amber-400 text-amber-950 hover:bg-amber-300 transition-colors cursor-pointer text-sm"
          >
            ¡Entendido, a Jugar!
          </button>
        </div>
      </div>
    </div>
  );
};
