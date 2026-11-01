import React from 'react';
import { Play, Flame, Heart, Clock, Award, Trophy, BookOpen, UserCheck } from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';
import type { GameMode, Difficulty, HammerId } from '../types/game';
import { HAMMERS } from '../types/game';

interface TitleScreenProps {
  onStartGame: () => void;
  mode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  difficulty: Difficulty;
  onSelectDifficulty: (diff: Difficulty) => void;
  selectedHammer: HammerId;
  onOpenHammers: () => void;
  onOpenHowTo: () => void;
  onOpenRecords: () => void;
  onOpenAchievements: () => void;
  showKeyboardHints: boolean;
  onToggleKeyboardHints: () => void;
  highScore: number;
  currentUser: FirebaseUser | null;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  mode,
  onSelectMode,
  difficulty,
  onSelectDifficulty,
  selectedHammer,
  onOpenHammers,
  onOpenHowTo,
  onOpenRecords,
  onOpenAchievements,
  showKeyboardHints,
  onToggleKeyboardHints,
  highScore,
  currentUser,
}) => {
  const currentHammer = HAMMERS[selectedHammer];

  return (
    <div className="w-full max-w-2xl mx-auto bg-amber-950/85 backdrop-blur-md border border-amber-800/80 rounded-3xl p-6 sm:p-8 text-amber-50 shadow-2xl">
      {/* Hero Badge & Title */}
      <div className="flex flex-col items-center text-center mb-5">
        <div className="relative mb-3">
          <img
            src="/src/assets/images/mole_arcade_badge_1793567789459.jpg"
            alt="Mascota Pégale al Topo"
            referrerPolicy="no-referrer"
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-amber-400 shadow-lg"
          />
          <div className="absolute -bottom-2 -right-2 bg-amber-400 text-amber-950 font-black text-xs px-2 py-0.5 rounded-full shadow-md">
            ARCADE
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black font-['Fredoka'] text-amber-300 tracking-wide drop-shadow-sm">
          ¡Pégale al Topo!
        </h1>

        {/* User Account Bar */}
        {currentUser && (
          <div className="mt-2 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-900/60 border border-emerald-600/60 text-xs text-amber-100 shadow-xs">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Jugador:</span>
            <strong className="text-amber-300 font-semibold">
              {currentUser.displayName || currentUser.email}
            </strong>
          </div>
        )}

        {highScore > 0 && (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-900/40 border border-amber-700/60 text-xs text-amber-200">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Tu Récord:</span>
            <strong className="text-amber-300 font-mono">{highScore.toLocaleString()} pts</strong>
          </div>
        )}
      </div>

      {/* Mode Selector */}
      <div className="mb-5">
        <label className="text-xs font-bold text-amber-300 uppercase tracking-wider block mb-2">
          1. Modo de Juego
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={() => onSelectMode('TIME_ATTACK')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              mode === 'TIME_ATTACK'
                ? 'bg-amber-900/90 border-amber-400 ring-2 ring-amber-400 shadow-md'
                : 'bg-amber-900/30 border-amber-800/60 hover:bg-amber-900/50'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-sm text-amber-100">Contrarreloj</span>
            </div>
            <p className="text-[11px] text-amber-200/70">
              60 segundos para conseguir la máxima puntuación y combos.
            </p>
          </button>

          <button
            onClick={() => onSelectMode('SURVIVAL')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              mode === 'SURVIVAL'
                ? 'bg-amber-900/90 border-amber-400 ring-2 ring-amber-400 shadow-md'
                : 'bg-amber-900/30 border-amber-800/60 hover:bg-amber-900/50'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-4 h-4 text-red-400 fill-red-400" />
              <span className="font-bold text-sm text-amber-100">Supervivencia</span>
            </div>
            <p className="text-[11px] text-amber-200/70">
              3 vidas. No dejes escapar topos y esquiva la dinamita.
            </p>
          </button>

          <button
            onClick={() => onSelectMode('FRENZY')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              mode === 'FRENZY'
                ? 'bg-amber-900/90 border-amber-400 ring-2 ring-amber-400 shadow-md'
                : 'bg-amber-900/30 border-amber-800/60 hover:bg-amber-900/50'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
              <span className="font-bold text-sm text-amber-100">Frenesí Arcade</span>
            </div>
            <p className="text-[11px] text-amber-200/70">
              Velocidad acelerada sin descanso con bonus multiplicadores.
            </p>
          </button>
        </div>
      </div>

      {/* Difficulty & Grid Size */}
      <div className="mb-5">
        <label className="text-xs font-bold text-amber-300 uppercase tracking-wider block mb-2">
          2. Dificultad y Tablero
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onSelectDifficulty('EASY')}
            className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold ${
              difficulty === 'EASY'
                ? 'bg-emerald-800/80 border-emerald-400 text-emerald-100 shadow-xs'
                : 'bg-amber-900/30 border-amber-800/60 text-amber-200/80 hover:bg-amber-900/50'
            }`}
          >
            Fácil (3x3)
          </button>

          <button
            onClick={() => onSelectDifficulty('MEDIUM')}
            className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold ${
              difficulty === 'MEDIUM'
                ? 'bg-amber-700/80 border-amber-300 text-amber-100 shadow-xs'
                : 'bg-amber-900/30 border-amber-800/60 text-amber-200/80 hover:bg-amber-900/50'
            }`}
          >
            Normal (3x3)
          </button>

          <button
            onClick={() => onSelectDifficulty('HARD')}
            className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold ${
              difficulty === 'HARD'
                ? 'bg-rose-800/80 border-rose-400 text-rose-100 shadow-xs'
                : 'bg-amber-900/30 border-amber-800/60 text-amber-200/80 hover:bg-amber-900/50'
            }`}
          >
            Experto (4x4 · 16 hoyos)
          </button>
        </div>
      </div>

      {/* Hammer Equipment & Keyboard Option */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {/* Hammer selector preview */}
        <div
          onClick={onOpenHammers}
          className="p-3 rounded-2xl bg-amber-900/40 border border-amber-800/60 hover:bg-amber-900/60 transition-colors flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-inner"
              style={{ backgroundColor: currentHammer.headColor }}
            >
              🔨
            </div>
            <div>
              <span className="text-[10px] text-amber-300/80 uppercase font-semibold block">
                Mazo Equipado
              </span>
              <span className="text-xs font-bold text-amber-100">
                {currentHammer.name}
              </span>
            </div>
          </div>
          <span className="text-xs text-amber-300 underline font-semibold">
            Cambiar
          </span>
        </div>

        {/* Keyboard hints toggle */}
        <div
          onClick={onToggleKeyboardHints}
          className="p-3 rounded-2xl bg-amber-900/40 border border-amber-800/60 hover:bg-amber-900/60 transition-colors flex items-center justify-between cursor-pointer"
        >
          <div>
            <span className="text-[10px] text-amber-300/80 uppercase font-semibold block">
              Atajos de Teclado
            </span>
            <span className="text-xs font-bold text-amber-100">
              {showKeyboardHints ? 'Activados (1-9 / Q-E)' : 'Desactivados'}
            </span>
          </div>
          <div
            className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${
              showKeyboardHints ? 'bg-amber-400 justify-end' : 'bg-stone-700 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-amber-950 shadow-xs" />
          </div>
        </div>
      </div>

      {/* Start Game Action */}
      <button
        onClick={onStartGame}
        className="w-full py-4 rounded-2xl font-black font-['Fredoka'] text-lg sm:text-xl text-amber-950 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer mb-4"
      >
        <Play className="w-6 h-6 fill-amber-950" />
        <span>¡EMPEZAR PARTIDA!</span>
      </button>

      {/* Auxiliary Nav Buttons */}
      <div className="flex items-center justify-center gap-4 text-xs font-semibold text-amber-200/80 pt-2 border-t border-amber-900/60">
        <button
          onClick={onOpenHowTo}
          className="hover:text-amber-100 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Reglas de Juego</span>
        </button>
        <span className="text-amber-700">·</span>
        <button
          onClick={onOpenRecords}
          className="hover:text-amber-100 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Salón de Récords</span>
        </button>
        <span className="text-amber-700">·</span>
        <button
          onClick={onOpenAchievements}
          className="hover:text-amber-100 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Award className="w-3.5 h-3.5" />
          <span>Logros</span>
        </button>
      </div>
    </div>
  );
};
