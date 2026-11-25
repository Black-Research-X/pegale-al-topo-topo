import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-900/95 border border-amber-500/80 px-3.5 py-2 text-xs font-bold text-amber-100 shadow-xl backdrop-blur-md"
    >
      <WifiOff className="w-4 h-4 text-amber-300 shrink-0" />
      <span>Modo sin conexión — Usando datos en caché</span>
    </div>
  );
};
