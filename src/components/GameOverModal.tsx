import React, { useState } from 'react';
import { Trophy, RotateCcw, Home, Star, Target, Zap, Save, CheckCircle } from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';
import type { GameMode, Difficulty, GameStats } from '../types/game';

interface GameOverModalProps {
  isOpen: boolean;
  score: number;
  isNewRecord: boolean;
  mode: GameMode;
  difficulty: Difficulty;
  stats: GameStats;
  currentUser: FirebaseUser | null;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
  onSaveRecord: (playerName: string) => Promise<void> | void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  score,
  isNewRecord,
  stats,
  currentUser,
  onPlayAgain,
  onBackToMenu,
  onSaveRecord,
}) => {
  const [playerName, setPlayerName] = useState(() => {
    return currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Campeón';
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const accuracy = stats.totalSwings > 0
    ? Math.round((stats.hits / stats.totalSwings) * 100)
    : 0;

  // Star rating
  const stars = score >= 4000 ? 3 : score >= 2000 ? 2 : 1;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saved && playerName.trim()) {
      setSaving(true);
      try {
        await onSaveRecord(playerName.trim());
        setSaved(true);
      } catch (err) {
        console.error('Error saving score:', err);
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-amber-950 border-2 border-amber-500/80 rounded-3xl p-6 text-amber-50 shadow-2xl overflow-y-auto max-h-[95vh] text-center">
        {/* Star Rating Header */}
        <div className="flex justify-center items-center gap-2 mb-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Star
              key={i}
              className={`w-7 h-7 sm:w-8 sm:h-8 transition-all ${
                i < stars
                  ? 'fill-amber-400 text-amber-400 scale-110 drop-shadow-md'
                  : 'fill-amber-950 text-amber-800'
              }`}
            />
          ))}
        </div>

        <h2 className="text-2xl sm:text-3xl font-black font-['Fredoka'] text-amber-300">
          {isNewRecord ? '¡NUEVO RÉCORD!' : '¡Fin de la Partida!'}
        </h2>
        <p className="text-xs text-amber-200/70 mt-1">
          {score > 3500
            ? '¡Excelente puntería y velocidad increíble!'
            : score > 1500
            ? '¡Buen trabajo en el jardín!'
            : '¡Buen intento, los topos son veloces!'}
        </p>

        {/* Score Banner */}
        <div className="my-4 p-4 rounded-2xl bg-amber-900/60 border border-amber-700/80 shadow-inner">
          <span className="text-xs uppercase tracking-wider font-bold text-amber-300/80 block">
            Puntuación Final
          </span>
          <span className="text-4xl sm:text-5xl font-black font-['Fredoka'] text-amber-300 font-mono tabular-nums leading-tight">
            {score.toLocaleString()}
          </span>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-900/40 border border-amber-800/60 flex flex-col items-center">
            <Target className="w-4 h-4 text-amber-400 mb-1" />
            <span className="text-[10px] text-amber-200/70 uppercase">Precisión</span>
            <span className="text-base font-bold font-mono text-amber-200 tabular-nums">
              {accuracy}%
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-900/40 border border-amber-800/60 flex flex-col items-center">
            <Zap className="w-4 h-4 text-amber-400 mb-1" />
            <span className="text-[10px] text-amber-200/70 uppercase">Racha Máx</span>
            <span className="text-base font-bold font-mono text-amber-300 tabular-nums">
              x{stats.maxCombo}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-900/40 border border-amber-800/60 flex flex-col items-center">
            <Trophy className="w-4 h-4 text-amber-400 mb-1" />
            <span className="text-[10px] text-amber-200/70 uppercase">Noqueados</span>
            <span className="text-base font-bold font-mono text-amber-200 tabular-nums">
              {stats.molesHitTotal}
            </span>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="p-3 rounded-xl bg-amber-900/30 border border-amber-800/50 text-left text-xs mb-4">
          <span className="text-[11px] font-bold text-amber-300/90 block mb-2 uppercase tracking-wider">
            Detalle de Capturas:
          </span>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-amber-200/80">
            <div>Clásicos: <strong className="text-amber-100">{stats.normalHits}</strong></div>
            <div>Dorados: <strong className="text-amber-300">{stats.goldenHits}</strong></div>
            <div>Ninjas: <strong className="text-purple-300">{stats.ninjaHits}</strong></div>
            <div>Obreros: <strong className="text-amber-200">{stats.helmetHits}</strong></div>
            <div>Congelados: <strong className="text-cyan-300">{stats.frozenHits}</strong></div>
            <div>Dinamita esquivada: <strong className="text-emerald-400">{stats.bombsAvoided}</strong></div>
          </div>
        </div>

        {/* Save to Firestore / Leaderboard */}
        <form onSubmit={handleSave} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={16}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              disabled={saved || saving}
              placeholder="Tu nombre..."
              className="flex-1 px-3 py-2 rounded-xl bg-amber-950 border border-amber-700 text-amber-100 text-sm focus:outline-none focus:border-amber-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={saved || saving || !playerName.trim()}
              className="px-4 py-2 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-amber-950 text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {saved ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-800" />
                  <span>¡Guardado!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Guardando...' : 'Guardar en la nube'}</span>
                </>
              )}
            </button>
          </div>
          {currentUser && (
            <p className="text-[11px] text-amber-300/70 text-left mt-1.5">
              Vinculado a: <strong>{currentUser.email}</strong>
            </p>
          )}
        </form>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-b from-amber-400 to-amber-500 text-amber-950 hover:from-amber-300 hover:to-amber-400 shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Jugar de Nuevo</span>
          </button>
          <button
            onClick={onBackToMenu}
            className="px-4 py-3 rounded-xl font-bold bg-amber-900/70 hover:bg-amber-800 text-amber-200 border border-amber-800 transition-colors flex items-center justify-center cursor-pointer text-sm"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
