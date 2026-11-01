import React from 'react';
import { X, Check, Lock, Sparkles, Volume2 } from 'lucide-react';
import { HAMMERS, type HammerId } from '../types/game';
import { sound } from '../utils/audio';

interface HammersModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedHammer: HammerId;
  onSelectHammer: (id: HammerId) => void;
  highScore: number;
}

export const HammersModal: React.FC<HammersModalProps> = ({
  isOpen,
  onClose,
  selectedHammer,
  onSelectHammer,
  highScore,
}) => {
  if (!isOpen) return null;

  const hammerList = Object.values(HAMMERS);

  const handleTestSound = (hammerId: HammerId, e: React.MouseEvent) => {
    e.stopPropagation();
    if (hammerId === 'TOY') {
      sound.playSqueak();
    } else if (hammerId === 'GOLDEN') {
      sound.playGoldenHit();
    } else if (hammerId === 'CYBER') {
      sound.playFreeze();
    } else {
      sound.playWhack(2);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-amber-950 border border-amber-800 rounded-3xl p-6 text-amber-50 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-900/80 mb-5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔨</span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-['Fredoka'] text-amber-300">
                Armería de Mazos
              </h2>
              <p className="text-xs text-amber-200/70">
                Personaliza tu estilo de golpeo y sonido de impacto
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-amber-900/60 hover:bg-amber-800 text-amber-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Hammers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {hammerList.map((h) => {
            const isUnlocked = h.unlockedByDefault || highScore >= (h.requiredScore || 0);
            const isSelected = selectedHammer === h.id;

            return (
              <div
                key={h.id}
                onClick={() => {
                  if (isUnlocked) {
                    onSelectHammer(h.id);
                    if (h.id === 'TOY') sound.playSqueak();
                    else if (h.id === 'GOLDEN') sound.playGoldenHit();
                    else sound.playWhack();
                  }
                }}
                className={`relative p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-900/80 border-amber-400 ring-2 ring-amber-400 shadow-lg'
                    : isUnlocked
                    ? 'bg-amber-900/30 border-amber-800/60 hover:bg-amber-900/50'
                    : 'bg-stone-900/40 border-stone-800/80 opacity-60 cursor-not-allowed'
                }`}
              >
                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute top-3 right-3 flex items-center justify-center w-5 h-5 rounded-full bg-amber-400 text-amber-950 font-bold text-xs">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}

                {/* Locked indicator */}
                {!isUnlocked && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/90 px-2 py-0.5 rounded-md border border-amber-700/60">
                    <Lock className="w-3 h-3" />
                    <span>{h.requiredScore} pts</span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-2">
                  {/* Color Sample Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner border border-white/20"
                    style={{ backgroundColor: h.headColor }}
                  >
                    <span className="text-lg">🔨</span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-amber-100">{h.name}</h3>
                    <button
                      onClick={(e) => handleTestSound(h.id, e)}
                      className="inline-flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-100 underline decoration-dotted mt-0.5 cursor-pointer"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Probar sonido</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs text-amber-200/70 leading-relaxed">
                  {h.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Current Best Score reminder */}
        <div className="p-3 rounded-xl bg-amber-900/40 border border-amber-800/60 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Tu Mejor Puntuación Registrada:</span>
          </div>
          <span className="font-mono font-bold text-amber-300 text-sm">
            {highScore.toLocaleString()} pts
          </span>
        </div>

        {/* Close Button */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl font-bold bg-amber-400 text-amber-950 hover:bg-amber-300 transition-colors cursor-pointer text-sm"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
