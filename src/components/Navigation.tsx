import React from 'react';
import { Volume2, VolumeX, Play, LogOut, User, ShieldCheck, BookOpen } from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';
import { PWAInstallButton } from './PWAInstallButton';

interface NavigationProps {
  onOpenHowTo: () => void;
  onOpenInstructions: () => void;
  onNavigateHome: () => void;
  onOpenHammers: () => void;
  onOpenRecords: () => void;
  onOpenAchievements: () => void;
  onStartOrResume: () => void;
  isPlaying: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  currentUser: FirebaseUser | null;
  onLogout: () => void;
  isAdmin: boolean;
  onOpenAdmin: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  onOpenHowTo,
  onOpenInstructions,
  onNavigateHome,
  onOpenHammers,
  onOpenRecords,
  onOpenAchievements,
  onStartOrResume,
  isPlaying,
  isMuted,
  onToggleMute,
  currentUser,
  onLogout,
  isAdmin,
  onOpenAdmin,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-amber-950/90 text-amber-50 border-b border-amber-900/60 backdrop-blur-md sticky top-0 z-40 shadow-md">
      {/* Zone 1: Wordmark */}
      <a
        href="/"
        onClick={(e) => {
          e.preventDefault();
          onNavigateHome();
        }}
        className="text-xl sm:text-2xl font-black tracking-tight text-amber-300 font-['Fredoka'] whitespace-nowrap shrink-0 hover:text-amber-200 transition-colors"
      >
        Pégale al Topo
      </a>

      {/* Zone 2: 4-5 Clean Nav Links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-amber-200/90">
        <button
          onClick={onOpenInstructions}
          className="hover:text-amber-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Instrucciones
        </button>
        <button
          onClick={onOpenHammers}
          className="hover:text-amber-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Mazos
        </button>
        <button
          onClick={onOpenRecords}
          className="hover:text-amber-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Récords
        </button>
        <button
          onClick={onOpenAchievements}
          className="hover:text-amber-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Logros
        </button>
        {isAdmin && (
          <button
            onClick={onOpenAdmin}
            className="text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1 font-bold bg-amber-900/80 px-2.5 py-1 rounded-lg border border-amber-600/70"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        )}
      </nav>

      {/* Zone 3: 1 Primary Action + Audio & User Info */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Mobile Instructions Button */}
        <button
          onClick={onOpenInstructions}
          title="Instrucciones del juego"
          className="md:hidden p-2 rounded-lg bg-amber-900/60 text-amber-300 border border-amber-800 cursor-pointer"
        >
          <BookOpen className="w-4 h-4" />
        </button>

        {/* Mobile Admin Button */}
        {isAdmin && (
          <button
            onClick={onOpenAdmin}
            title="Panel de Administración"
            className="md:hidden p-2 rounded-lg bg-amber-900/80 text-amber-400 border border-amber-600 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>
        )}

        {/* PWA Install Prompt */}
        <PWAInstallButton variant="header" />

        {/* Audio Mute */}
        <button
          onClick={onToggleMute}
          title={isMuted ? 'Activar Sonido' : 'Silenciar'}
          aria-label={isMuted ? 'Activar Sonido' : 'Silenciar'}
          className="p-2 rounded-lg bg-amber-900/60 text-amber-300 hover:bg-amber-800 transition-colors cursor-pointer border border-amber-800/80"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* User Profile / Logout if logged in */}
        {currentUser ? (
          <div className="flex items-center gap-2 pl-1">
            <div className="flex items-center gap-1.5 text-xs text-amber-200 bg-amber-900/50 px-2.5 py-1 rounded-lg border border-amber-800/80">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'Usuario'}
                  referrerPolicy="no-referrer"
                  className="w-4 h-4 rounded-full object-cover"
                />
              ) : (
                <User className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span className="hidden sm:inline font-semibold max-w-[90px] truncate">
                {currentUser.displayName || currentUser.email?.split('@')[0]}
              </span>
            </div>

            <button
              onClick={onLogout}
              title="Cerrar sesión"
              className="p-2 rounded-lg bg-amber-900/60 text-amber-300 hover:text-red-400 hover:bg-amber-900 transition-colors cursor-pointer border border-amber-800/80"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : null}

        {/* Primary Action Button */}
        {currentUser && (
          <button
            onClick={onStartOrResume}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold text-amber-950 bg-gradient-to-b from-amber-300 to-amber-400 rounded-lg shadow-sm hover:from-amber-200 hover:to-amber-300 transition-all active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-amber-950" />
            <span>{isPlaying ? 'Reanudar' : '¡Jugar Ahora!'}</span>
          </button>
        )}
      </div>
    </header>
  );
};
