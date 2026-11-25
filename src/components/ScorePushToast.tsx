import React, { useEffect } from 'react';
import { BellRing, Trophy, Play, X } from 'lucide-react';
import type { ScoreNotificationPayload } from '../utils/notifications';

interface ScorePushToastProps {
  notification: ScoreNotificationPayload | null;
  onDismiss: () => void;
  onPlayAgain: () => void;
}

export const ScorePushToast: React.FC<ScorePushToastProps> = ({
  notification,
  onDismiss,
  onPlayAgain,
}) => {
  useEffect(() => {
    if (!notification) return;
    const timer = window.setTimeout(() => {
      onDismiss();
    }, 20000);
    return () => window.clearTimeout(timer);
  }, [notification, onDismiss]);

  if (!notification) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-20 right-4 z-50 w-[min(92vw,370px)] rounded-2xl bg-amber-950/95 border-2 border-amber-400/90 text-amber-50 shadow-2xl p-4 backdrop-blur-md"
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl overflow-hidden border border-amber-500/70 shrink-0 bg-amber-900">
          <img
            src="/pwa-192x192.png"
            alt="Pégale al Topo"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-400">
              <BellRing className="w-3.5 h-3.5" />
              Última Partida · 1 min
            </span>
            <button
              onClick={onDismiss}
              aria-label="Cerrar notificación"
              className="p-1 rounded-lg text-amber-300/70 hover:text-amber-100 hover:bg-amber-900/80 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h4 className="font-bold text-sm text-amber-100 mt-0.5 leading-snug">
            {notification.title}
          </h4>

          <p className="text-xs text-amber-200/85 mt-1 leading-relaxed">
            {notification.body}
          </p>

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-900/80 border border-amber-700/80 text-xs font-bold text-amber-300 tabular-nums">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>{notification.score.toLocaleString()} pts</span>
            </div>

            <button
              onClick={() => {
                onDismiss();
                onPlayAgain();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-amber-950" />
              <span>Jugar ahora</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
