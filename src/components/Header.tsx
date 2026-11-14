import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Heart, 
  Pill, 
  Calendar, 
  ShieldCheck, 
  ShieldOff, 
  PhoneCall, 
  Sun, 
  Moon, 
  User, 
  Users,
  ChevronDown,
  LayoutDashboard,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { AdminPinModal } from './AdminPinModal';
import { GlobalSearchBar } from './GlobalSearchBar';

export type NavTab = 'dashboard' | 'tension' | 'medicacion' | 'citas' | 'admin';

interface HeaderProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenReport: () => void;
  onOpenDeployGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentTab, 
  onSelectTab, 
  onOpenReport, 
  onOpenDeployGuide 
}) => {
  const { 
    patients, 
    activePatient, 
    setActivePatientId, 
    caregivers,
    activeCaregiver,
    setActiveCaregiverId,
    config, 
    updateConfig, 
    lockAdmin 
  } = useApp();

  const [showPatientMenu, setShowPatientMenu] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  const toggleTheme = () => {
    updateConfig({ theme: config.theme === 'dark' ? 'light' : 'dark' });
  };

  const handleAdminLockToggle = () => {
    if (config.isAdminUnlocked) {
      lockAdmin();
    } else {
      setShowPinModal(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-2xs">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-1.5 sm:gap-4 lg:gap-6">
          
          {/* Zone 1: Brand wordmark & Patient Avatar */}
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-2 text-left group focus:outline-none"
              title="Ir al Inicio"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-teal-600 dark:bg-teal-500 text-white flex items-center justify-center font-bold text-sm sm:text-base shadow-sm group-hover:scale-105 transition-transform shrink-0">
                CP
              </div>
              <div className="hidden md:block">
                <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap block leading-tight">
                  CUIDAFAM <span className="text-teal-600 dark:text-teal-400 font-bold">PRO</span>
                </span>
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 block -mt-0.5">
                  Salud Familiar
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Global Search Bar */}
          <div className="flex-1 min-w-0 max-w-none sm:max-w-xs md:max-w-sm lg:max-w-xs xl:max-w-sm mx-0.5 sm:mx-2">
            <GlobalSearchBar onSelectTab={onSelectTab} className="w-full" />
          </div>

          {/* Zone 3: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                currentTab === 'dashboard'
                  ? 'bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0 text-teal-600" />
              <span>Inicio</span>
            </button>

            <button
              onClick={() => onSelectTab('tension')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                currentTab === 'tension'
                  ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Heart className="w-4 h-4 shrink-0 text-rose-500" />
              <span>Tensión Arterial</span>
            </button>

            <button
              onClick={() => onSelectTab('medicacion')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                currentTab === 'medicacion'
                  ? 'bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Pill className="w-4 h-4 shrink-0 text-blue-500" />
              <span>Medicación</span>
            </button>

            <button
              onClick={() => onSelectTab('citas')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                currentTab === 'citas'
                  ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4 shrink-0 text-amber-500" />
              <span>Citas Médicas</span>
            </button>

            <button
              onClick={() => onSelectTab('admin')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                currentTab === 'admin'
                  ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0 text-slate-500" />
              <span>Administración</span>
            </button>
          </nav>

          {/* Zone 3: Patient Selector + Quick Actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            
            {/* Patient Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPatientMenu(!showPatientMenu)}
                className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-xs font-medium shadow-2xs"
                title="Cambiar paciente familiar activo"
              >
                <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                  {activePatient?.avatar ? (
                    <img 
                      src={activePatient.avatar} 
                      alt={activePatient.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-teal-700 font-bold text-xs">
                      {activePatient?.name?.charAt(0) || 'P'}
                    </div>
                  )}
                </div>
                <span className="hidden sm:inline-block max-w-[100px] truncate font-semibold">
                  {activePatient?.nickname || activePatient?.name?.split(' ')[0] || 'Paciente'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {showPatientMenu && (
                <div 
                  className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150"
                  onBlur={() => setShowPatientMenu(false)}
                >
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    Familiares a cuidar
                  </div>
                  {patients.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setActivePatientId(p.id);
                        setShowPatientMenu(false);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors ${
                        p.id === activePatient.id 
                          ? 'bg-teal-50/70 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 font-semibold' 
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-100 shrink-0 border">
                        {p.avatar ? (
                          <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-slate-600">
                            {p.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold">{p.name}</div>
                        <div className="text-[10px] text-slate-500">
                          {p.age} años · {p.dniSip}
                        </div>
                      </div>
                    </button>
                  ))}
                  
                  <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1.5 px-2">
                    <button
                      onClick={() => {
                        setShowPatientMenu(false);
                        onSelectTab('admin');
                      }}
                      className="w-full text-left py-1.5 px-2 rounded-xl text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950 font-semibold transition-colors"
                    >
                      + Añadir nuevo familiar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. PWA Install & Offline Status */}
            <PWAInstallButton onOpenDeployGuide={onOpenDeployGuide} />

            {/* 4. Admin PIN Lock/Unlock Status */}
            <button
              type="button"
              onClick={handleAdminLockToggle}
              className={`p-1.5 sm:p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border shrink-0 ${
                config.isAdminUnlocked
                  ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-800 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
              }`}
              title={config.isAdminUnlocked ? "Modo Administrador Activo" : "Desbloquear Administración con PIN"}
            >
              {config.isAdminUnlocked ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="hidden xl:inline">Admin Activo</span>
                </>
              ) : (
                <>
                  <ShieldOff className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="hidden xl:inline">Admin PIN</span>
                </>
              )}
            </button>

            {/* 5. Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              title="Cambiar tema claro / oscuro"
            >
              {config.theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* 6. SOS 112 Direct Button */}
            <button
              type="button"
              onClick={() => setShowEmergencyModal(true)}
              className="px-2 sm:px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 sm:gap-1.5 shadow-sm active:scale-95 transition-all shrink-0"
              title="Contactos de emergencia médica y 112"
            >
              <PhoneCall className="w-3.5 h-3.5 animate-pulse shrink-0" />
              <span>112</span>
            </button>

          </div>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar (Responsive, ergonomic, 48px hitboxes) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-5 items-center h-16 pb-safe shadow-lg">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center h-full min-h-[48px] transition-colors ${
            currentTab === 'dashboard'
              ? 'text-teal-600 dark:text-teal-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight font-medium">Inicio</span>
        </button>

        <button
          onClick={() => onSelectTab('tension')}
          className={`flex flex-col items-center justify-center h-full min-h-[48px] transition-colors ${
            currentTab === 'tension'
              ? 'text-rose-600 dark:text-rose-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Heart className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight font-medium">Tensión</span>
        </button>

        <button
          onClick={() => onSelectTab('medicacion')}
          className={`flex flex-col items-center justify-center h-full min-h-[48px] transition-colors ${
            currentTab === 'medicacion'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Pill className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight font-medium">Pastillas</span>
        </button>

        <button
          onClick={() => onSelectTab('citas')}
          className={`flex flex-col items-center justify-center h-full min-h-[48px] transition-colors ${
            currentTab === 'citas'
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight font-medium">Citas</span>
        </button>

        <button
          onClick={() => onSelectTab('admin')}
          className={`flex flex-col items-center justify-center h-full min-h-[48px] transition-colors ${
            currentTab === 'admin'
              ? 'text-slate-900 dark:text-white font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <ShieldCheck className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight font-medium">Admin</span>
        </button>
      </div>

      {/* Admin PIN Unlock Modal */}
      <AdminPinModal 
        isOpen={showPinModal} 
        onClose={() => setShowPinModal(false)}
        title="Desbloquear Modo Administrador"
        description="Introduce el PIN de 4 dígitos para acceder a opciones de edición sensible o ajustes avanzados."
      />

      {/* SOS Emergency Contact Dialog */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-rose-200 dark:border-rose-900/60 p-4 sm:p-6 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs shrink-0">
                  <PhoneCall className="w-5 h-5 sm:w-6 sm:h-6 animate-bounce" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-base sm:text-lg text-rose-700 dark:text-rose-400 truncate">Emergencia Médica</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Llamada rápida y datos clínicos prioritarios</p>
                </div>
              </div>
              <button 
                onClick={() => setShowEmergencyModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Direct Dial Options */}
            <div className="space-y-3 mb-5">
              <a
                href="tel:112"
                className="w-full p-3.5 sm:p-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-between gap-2 font-bold text-sm sm:text-base shadow-md active:scale-[0.99] transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <PhoneCall className="w-5 h-5 shrink-0" />
                  <span className="truncate">Llamar a Emergencias (112)</span>
                </div>
                <span className="text-xs bg-rose-500/50 py-1 px-2.5 rounded-lg font-mono shrink-0">112</span>
              </a>

              <a
                href={`tel:${activePatient?.emergencyContactPhone}`}
                className="w-full p-3.5 sm:p-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white flex flex-wrap items-center justify-between gap-2 font-semibold text-sm transition-all border border-slate-200 dark:border-slate-700"
              >
                <div className="min-w-0">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Cuidador Principal:</div>
                  <div className="break-words">{activePatient?.emergencyContactName}</div>
                </div>
                <span className="text-xs text-teal-600 dark:text-teal-400 font-mono font-medium shrink-0">
                  {activePatient?.emergencyContactPhone}
                </span>
              </a>

              {activePatient?.healthCenterPhone && (
                <a
                  href={`tel:${activePatient.healthCenterPhone}`}
                  className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs transition-all border border-slate-200/70 dark:border-slate-700"
                >
                  <div className="min-w-0">
                    <div className="text-slate-400">Centro de Salud:</div>
                    <div className="font-medium break-words">{activePatient.healthCenter}</div>
                  </div>
                  <span className="font-mono text-slate-600 dark:text-slate-400 shrink-0">
                    {activePatient.healthCenterPhone}
                  </span>
                </a>
              )}
            </div>

            {/* Critical Patient Info for Paramedics */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs break-words">
              <div className="font-semibold text-amber-900 dark:text-amber-200 mb-1">
                Datos rápidos para sanitarios ({activePatient?.name}):
              </div>
              <div className="text-slate-700 dark:text-slate-300 space-y-0.5">
                <div>• <strong>SIP / DNI:</strong> {activePatient?.dniSip} · Grupo: <strong>{activePatient?.bloodType}</strong></div>
                <div>• <strong>Alergias conocidas:</strong> <span className="text-rose-600 dark:text-rose-400 font-medium">{activePatient?.allergies?.join(', ') || 'Ninguna descrita'}</span></div>
                <div>• <strong>Patologías:</strong> {activePatient?.chronicConditions?.join(', ') || 'Ninguna registrada'}</div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowEmergencyModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
