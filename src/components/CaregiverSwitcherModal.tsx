import React from 'react';
import { useApp } from '../context/AppContext';
import { Users, Check, X, UserPlus, Heart, Shield, PhoneCall } from 'lucide-react';
import { NavTab } from './Header';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToAdmin?: () => void;
}

export const CaregiverSwitcherModal: React.FC<Props> = ({ 
  isOpen, 
  onClose,
  onNavigateToAdmin
}) => {
  const { caregivers, activeCaregiverId, setActiveCaregiverId, activePatient } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                ¿Quién está cuidando hoy?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Atendiendo a {activePatient.nickname || activePatient.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
          Cualquier persona registrada puede tomar la tensión y anotar la medicación administrada. Selecciona tu nombre para que quede registrado a tu cargo:
        </p>

        {/* List of caregivers */}
        <div className="space-y-2.5 mb-5 max-h-72 overflow-y-auto pr-1">
          {caregivers.map(cg => {
            const isSelected = cg.id === activeCaregiverId;
            return (
              <button
                key={cg.id}
                type="button"
                onClick={() => {
                  setActiveCaregiverId(cg.id);
                  onClose();
                }}
                className={`w-full p-3.5 rounded-2xl text-left border transition-all flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-950 dark:text-teal-100 ring-2 ring-teal-500/20 shadow-xs'
                    : 'bg-slate-50/70 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                    isSelected
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600'
                  }`}>
                    {cg.name.charAt(0)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-sm break-words">{cg.name}</span>
                      {cg.isEmergencyContact && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 shrink-0">
                          Contacto SOS
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">
                      {cg.relation} {cg.notes ? `· ${cg.notes}` : ''}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {isSelected ? (
                    <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full border border-slate-300 dark:border-slate-600" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info & Add caregiver link */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            ¿Falta algún familiar?
          </span>

          {onNavigateToAdmin && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToAdmin();
              }}
              className="font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Gestionar cuidadores (Admin)</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
