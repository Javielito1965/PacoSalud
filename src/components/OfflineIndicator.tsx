import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-3 right-3 sm:left-4 sm:right-auto sm:max-w-sm z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg animate-in slide-in-from-bottom-2">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span className="leading-snug">Modo sin conexión · Los datos familiares guardados en local siguen disponibles.</span>
    </div>
  );
};
