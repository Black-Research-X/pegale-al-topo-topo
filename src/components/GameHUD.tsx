import React from 'react';
import { Pause, Heart, Zap, Sparkles, Snowflake } from 'lucide-react';
import type { GameMode } from '../types/game';

interface GameHUDProps {
  score: number;
  timeLeft: number;
  lives: number;
  maxLives: number;
  combo: number;
  multiplier: number;
  accuracy: number;
  mode: GameMode;
  isFrozen: boolean;
  freezeSecondsLeft: number;
  onPause: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  timeLeft,
  lives,
  maxLives,
  combo,
  multiplier,
  accuracy,
  mode,
  isFrozen,
  freezeSecondsLeft,
  onPause,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto mb-4 bg-amber-950/80 backdrop-blur-md border border-amber-900/80 rounded-2xl p-3 sm:p-4 text-amber-50 shadow-xl select-none">
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        {/* Score Zone */}
        <div className="flex flex-col">
          <span className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-amber-300/80">
            Puntuación
          </span>
          <span className="text-2xl sm:text-3xl font-black font-['Fredoka'] text-amber-300 font-mono tabular-nums leading-none">
            {score.toLocaleString()}
          </span>
        </div>

        {/* Middle Mode Stat: Time or Lives */}
        {mode === 'TIME_ATTACK' || mode === 'FRENZY' ? (
          <div className="flex flex-col items-center">
            <span className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-amber-200/80">
              Tiempo
            </span>
            <div
              className={`text-2xl sm:text-3xl font-black font-mono tabular-nums leading-none ${
                timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-amber-100'
              }`}
            >
              {timeLeft}s
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-amber-200/80">
              Vidas
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              {Array.from({ length: maxLives }).map((_, i) => (
                <Heart
                  key={i}
                  className={`w-6 h-6 transition-all ${
                    i < lives
                      ? 'fill-red-500 text-red-500 scale-100'
                      : 'fill-stone-700 text-stone-600 scale-90'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Combo & Multiplier */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1">
              <Zap className={`w-4 h-4 ${combo > 3 ? 'text-amber-400 fill-amber-400 animate-bounce' : 'text-stone-400'}`} />
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-amber-200/80">
                Racha
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-black font-mono tabular-nums text-amber-200">
                {combo}
              </span>
              {multiplier > 1 && (
                <span className="text-xs font-black px-1.5 py-0.5 rounded bg-amber-500 text-amber-950 shadow-xs">
                  x{multiplier}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Accuracy */}
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-amber-200/80">
            Precisión
          </span>
          <span className="text-lg sm:text-xl font-bold font-mono tabular-nums text-amber-300">
            {accuracy}%
          </span>
        </div>

        {/* Freeze Notice or Pause Button */}
        <div className="flex items-center gap-2">
          {isFrozen && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-900/80 border border-cyan-400/50 text-cyan-200 text-xs font-bold animate-pulse">
              <Snowflake className="w-3.5 h-3.5 animate-spin" />
              <span>¡Lento {freezeSecondsLeft}s!</span>
            </div>
          )}

          <button
            onClick={onPause}
            className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-amber-900/70 hover:bg-amber-800 text-amber-100 text-xs font-bold border border-amber-800 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Pause className="w-4 h-4" />
            <span className="hidden sm:inline">Pausar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
