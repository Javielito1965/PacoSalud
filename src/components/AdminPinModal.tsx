import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, Unlock, X, ShieldAlert, KeyRound } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  description?: string;
}

export const AdminPinModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  title = "Acceso de Administrador",
  description = "Introduce el PIN de seguridad familiar para desbloquear permisos de edición y borrado."
}) => {
  const { unlockAdmin, config } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const verifyPin = (candidatePin: string) => {
    const success = unlockAdmin(candidatePin);
    if (success) {
      setError(false);
      setPin('');
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-slate-900 dark:text-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base tracking-tight">{title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Seguridad CUIDAFAM PRO</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          {description}
        </p>

        {/* PIN Circles */}
        <div className="flex justify-center gap-4 mb-6">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = index < pin.length;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-150 ${
                  error 
                    ? 'bg-rose-500 ring-2 ring-rose-200 dark:ring-rose-900' 
                    : isFilled 
                      ? 'bg-teal-600 dark:bg-teal-400 scale-110' 
                      : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <div className="flex items-center justify-center gap-2 mb-4 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 py-2 px-3 rounded-lg border border-rose-200 dark:border-rose-900">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>PIN incorrecto. Inténtalo de nuevo.</span>
          </div>
        )}

        {/* Numeric keypad */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-12 flex items-center justify-center text-lg font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 shadow-xs tabular-nums"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPin('')}
            className="h-12 flex items-center justify-center text-xs font-medium rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-12 flex items-center justify-center text-lg font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 shadow-xs tabular-nums"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 flex items-center justify-center text-xs font-medium rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Borrar
          </button>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-center border border-slate-100 dark:border-slate-800">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            PIN inicial configurado de fábrica: <strong className="text-slate-700 dark:text-slate-300 font-mono">1234</strong>
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Puedes cambiarlo en el Panel de Administración.
          </p>
        </div>
      </div>
    </div>
  );
};
