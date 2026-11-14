import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { PatientProfile, FamilyCaregiver } from '../types';
import { 
  ShieldCheck, 
  KeyRound, 
  User, 
  Users, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  AlertTriangle, 
  PhoneCall, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  Sliders, 
  Type, 
  Sun, 
  Moon,
  Sparkles,
  FileCheck,
  Smartphone,
  Globe,
  Camera,
  FileText
} from 'lucide-react';
import { AdminPinModal } from './AdminPinModal';
import { ChangePatientPhotoModal } from './ChangePatientPhotoModal';
import { ClinicalHistorySection } from './ClinicalHistorySection';

interface Props {
  onOpenReport: () => void;
  onOpenDeployGuide?: () => void;
}

export const AdminPanelSection: React.FC<Props> = ({ onOpenReport, onOpenDeployGuide }) => {
  const { 
    patients, 
    activePatient, 
    updatePatient, 
    addPatient, 
    deletePatient, 
    caregivers, 
    addCaregiver, 
    updateCaregiver, 
    deleteCaregiver, 
    config, 
    updateConfig, 
    unlockAdmin, 
    lockAdmin, 
    resetToDefaults, 
    exportFullData, 
    importFullData 
  } = useApp();

  const [newPin, setNewPin] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);
  const [pinChangeError, setPinChangeError] = useState('');
  const [activeAdminTab, setActiveAdminTab] = useState<'historial' | 'seguridad' | 'pacientes' | 'cuidadores'>('historial');

  // Patient editing state
  const [editingPatient, setEditingPatient] = useState<PatientProfile | null>(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [isNewPatient, setIsNewPatient] = useState(false);

  // Patient form fields
  const [pName, setPName] = useState('');
  const [pNickname, setPNickname] = useState('');
  const [pAge, setPAge] = useState(78);
  const [pDniSip, setPDniSip] = useState('');
  const [pBloodType, setPBloodType] = useState('A+');
  const [pDoctor, setPDoctor] = useState('');
  const [pCenter, setPCenter] = useState('');
  const [pCenterPhone, setPCenterPhone] = useState('');
  const [pEmergencyName, setPEmergencyName] = useState('');
  const [pEmergencyPhone, setPEmergencyPhone] = useState('');
  const [pAllergies, setPAllergies] = useState('');
  const [pConditions, setPConditions] = useState('');
  const [pNotes, setPNotes] = useState('');
  const [pAvatar, setPAvatar] = useState('');
  const [photoModalPatient, setPhotoModalPatient] = useState<PatientProfile | null>(null);
  const [showPhotoModalForForm, setShowPhotoModalForForm] = useState(false);

  // Caregiver form state
  const [editingCaregiver, setEditingCaregiver] = useState<FamilyCaregiver | null>(null);
  const [showCaregiverModal, setShowCaregiverModal] = useState(false);
  const [cgName, setCgName] = useState('');
  const [cgRelation, setCgRelation] = useState('');
  const [cgPhone, setCgPhone] = useState('');
  const [cgRole, setCgRole] = useState<'admin' | 'cuidador'>('cuidador');
  const [cgIsEmergency, setCgIsEmergency] = useState(false);
  const [cgNotes, setCgNotes] = useState('');

  // PIN Unlock Modal
  const [showPinModal, setShowPinModal] = useState(false);

  // Backup file ref & reset confirm modal
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleOpenPatientEdit = (patient: PatientProfile) => {
    setIsNewPatient(false);
    setEditingPatient(patient);
    setPName(patient.name);
    setPNickname(patient.nickname);
    setPAge(patient.age);
    setPDniSip(patient.dniSip);
    setPBloodType(patient.bloodType);
    setPDoctor(patient.primaryCareDoctor);
    setPCenter(patient.healthCenter);
    setPCenterPhone(patient.healthCenterPhone);
    setPEmergencyName(patient.emergencyContactName);
    setPEmergencyPhone(patient.emergencyContactPhone);
    setPAllergies((patient.allergies || []).join(', '));
    setPConditions((patient.chronicConditions || []).join(', '));
    setPNotes(patient.notes);
    setPAvatar(patient.avatar || '');
    setShowPatientModal(true);
  };

  const handleOpenNewPatient = () => {
    setIsNewPatient(true);
    setEditingPatient(null);
    setPName('');
    setPNickname('');
    setPAge(75);
    setPDniSip('SIP: 03/');
    setPBloodType('A+');
    setPDoctor('Dr.');
    setPCenter('Centro de Salud');
    setPCenterPhone('+34 965 ');
    setPEmergencyName('Familiar');
    setPEmergencyPhone('+34 6');
    setPAllergies('');
    setPConditions('');
    setPNotes('');
    setPAvatar('');
    setShowPatientModal(true);
  };

  const handleSavePatient = (e: React.FormEvent) => {
    e.preventDefault();
    const allergiesList = pAllergies.split(',').map(s => s.trim()).filter(Boolean);
    const conditionsList = pConditions.split(',').map(s => s.trim()).filter(Boolean);

    if (isNewPatient) {
      addPatient({
        name: pName,
        nickname: pNickname || pName.split(' ')[0],
        age: Number(pAge),
        birthDate: '1948-01-01',
        gender: 'Otro',
        dniSip: pDniSip,
        bloodType: pBloodType,
        avatar: pAvatar,
        primaryCareDoctor: pDoctor,
        healthCenter: pCenter,
        healthCenterPhone: pCenterPhone,
        emergencyContactName: pEmergencyName,
        emergencyContactPhone: pEmergencyPhone,
        emergencyContactRelation: 'Familiar',
        allergies: allergiesList,
        chronicConditions: conditionsList,
        notes: pNotes,
      });
    } else if (editingPatient) {
      updatePatient(editingPatient.id, {
        name: pName,
        nickname: pNickname,
        age: Number(pAge),
        dniSip: pDniSip,
        bloodType: pBloodType,
        avatar: pAvatar,
        primaryCareDoctor: pDoctor,
        healthCenter: pCenter,
        healthCenterPhone: pCenterPhone,
        emergencyContactName: pEmergencyName,
        emergencyContactPhone: pEmergencyPhone,
        allergies: allergiesList,
        chronicConditions: conditionsList,
        notes: pNotes,
      });
    }
    setShowPatientModal(false);
  };

  // Caregiver handlers
  const handleOpenCaregiverModal = (cg?: FamilyCaregiver) => {
    if (cg) {
      setEditingCaregiver(cg);
      setCgName(cg.name);
      setCgRelation(cg.relation);
      setCgPhone(cg.phone);
      setCgRole(cg.role);
      setCgIsEmergency(cg.isEmergencyContact);
      setCgNotes(cg.notes);
    } else {
      setEditingCaregiver(null);
      setCgName('');
      setCgRelation('Hijo/a');
      setCgPhone('+34 6');
      setCgRole('cuidador');
      setCgIsEmergency(false);
      setCgNotes('');
    }
    setShowCaregiverModal(true);
  };

  const handleSaveCaregiver = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCaregiver) {
      updateCaregiver(editingCaregiver.id, {
        name: cgName,
        relation: cgRelation,
        phone: cgPhone,
        role: cgRole,
        isEmergencyContact: cgIsEmergency,
        notes: cgNotes,
      });
    } else {
      addCaregiver({
        name: cgName,
        relation: cgRelation,
        phone: cgPhone,
        role: cgRole,
        isEmergencyContact: cgIsEmergency,
        notes: cgNotes,
      });
    }
    setShowCaregiverModal(false);
  };

  // Change PIN handler
  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(newPin)) {
      setPinChangeError('El PIN debe tener exactamente 4 dígitos numéricos.');
      setPinChangeSuccess(false);
      return;
    }
    updateConfig({ adminPin: newPin });
    setPinChangeSuccess(true);
    setPinChangeError('');
    setNewPin('');
    setTimeout(() => setPinChangeSuccess(false), 4000);
  };

  // Export JSON
  const handleDownloadBackup = () => {
    const dataStr = exportFullData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeSlug = (activePatient.nickname || activePatient.name || 'paciente').toLowerCase().replace(/\s+/g, '_');
    link.download = `cuidafam_backup_${safeSlug}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importFullData(content);
      if (success) {
        setImportStatus('¡Copia de seguridad restaurada con éxito!');
      } else {
        setImportStatus('Error: el archivo no contiene un formato válido de CUIDAFAM PRO.');
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
              Control Maestro y Seguridad
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight break-words">
            Panel de Administración Familiar
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gestión de seguridad, contraseñas, perfiles familiares y copias de seguridad
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {config.isAdminUnlocked ? (
            <button
              type="button"
              onClick={lockAdmin}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-amber-300 dark:border-amber-800"
            >
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Bloquear Modo Admin</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowPinModal(true)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <KeyRound className="w-4 h-4 shrink-0" />
              <span>Desbloquear con PIN</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:flex sm:flex-wrap items-stretch sm:items-center gap-1.5 sm:gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveAdminTab('historial')}
          className={`px-3 py-2 sm:py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all min-w-0 ${
            activeAdminTab === 'historial'
              ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Historial ({activePatient.nickname || activePatient.name})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('seguridad')}
          className={`px-3 py-2 sm:py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all min-w-0 ${
            activeAdminTab === 'seguridad'
              ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5 shrink-0" />
          <span>PIN y Ajustes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('pacientes')}
          className={`px-3 py-2 sm:py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all min-w-0 ${
            activeAdminTab === 'pacientes'
              ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <User className="w-3.5 h-3.5 shrink-0" />
          <span>Pacientes ({patients.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('cuidadores')}
          className={`px-3 py-2 sm:py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all min-w-0 ${
            activeAdminTab === 'cuidadores'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5 shrink-0" />
          <span>Cuidadores ({caregivers.length})</span>
        </button>
      </div>

      {/* 1. Clinical Medical History Tab */}
      {activeAdminTab === 'historial' && (
        <ClinicalHistorySection onOpenReport={onOpenReport} />
      )}

      {/* 2. Security PIN & Accessibility Tab */}
      {activeAdminTab === 'seguridad' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Security & PIN Manager */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between min-w-0 overflow-hidden">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  PIN de Seguridad Familiar
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Protege contra borrados y ediciones accidentales
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs mb-4 space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-slate-600 dark:text-slate-400">Estado actual:</span>
                <span className={`font-semibold ${config.isAdminUnlocked ? 'text-amber-600' : 'text-slate-700 dark:text-slate-300'}`}>
                  {config.isAdminUnlocked ? 'Desbloqueado (Admin)' : 'Bloqueado (Protegido)'}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-slate-600 dark:text-slate-400">PIN activo actual:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">•••• (Configurado)</span>
              </div>
            </div>

            {/* Strict Safety Lock Toggle */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs mb-4">
              <div className="min-w-0">
                <div className="font-semibold text-slate-900 dark:text-white">
                  Bloqueo Estricto de Seguridad
                </div>
                <div className="text-[11px] text-slate-500">
                  Exigir PIN siempre para borrar fármacos o mediciones
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.strictSafetyLock}
                onChange={(e) => updateConfig({ strictSafetyLock: e.target.checked })}
                className="w-4 h-4 text-teal-600 rounded-md focus:ring-teal-500 shrink-0"
              />
            </div>

            {/* Change PIN Form */}
            <form onSubmit={handleChangePin} className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Cambiar PIN de 4 dígitos:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="password"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Nuevo PIN (ej. 5678)"
                  className="flex-1 min-w-0 text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono tracking-widest text-center"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 sm:py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors shrink-0"
                >
                  Actualizar PIN
                </button>
              </div>

              {pinChangeSuccess && (
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>PIN actualizado correctamente. Recuerda anotarlo en lugar seguro.</span>
                </div>
              )}
              {pinChangeError && (
                <div className="text-xs text-rose-600 font-medium">
                  {pinChangeError}
                </div>
              )}
            </form>
          </div>

          <div className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            PIN predeterminado inicial: <span className="font-mono font-bold text-slate-600 dark:text-slate-300">1234</span>
          </div>
        </div>

        {/* Accessibility & Visual Customization */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between min-w-0 overflow-hidden">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Sliders className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Accesibilidad y Tema
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Adaptado para familiares mayores y visibilidad óptima
                </p>
              </div>
            </div>

            {/* Font Size Selector */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <Type className="w-4 h-4 shrink-0" />
                <span>Tamaño de Texto en Pantalla:</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {[
                  { id: 'normal', label: 'Estándar' },
                  { id: 'large', label: 'Grande' },
                  { id: 'xlarge', label: 'Muy Grande' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateConfig({ fontSize: opt.id as any })}
                    className={`py-2 px-1.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-medium border transition-colors text-center leading-tight ${
                      config.fontSize === opt.id
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Selector */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Modo de Color / Contraste:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateConfig({ theme: 'light' })}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition-colors ${
                    config.theme === 'light'
                      ? 'bg-white border-teal-500 text-teal-800 font-bold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Modo Claro</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateConfig({ theme: 'dark' })}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition-colors ${
                    config.theme === 'dark'
                      ? 'bg-slate-800 border-teal-500 text-white font-bold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Moon className="w-4 h-4 text-blue-400" />
                  <span>Modo Oscuro</span>
                </button>
              </div>
            </div>

            {/* Emergency Phone configuration */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
                <span>Teléfono de Marcación Rápida SOS:</span>
              </label>
              <input
                type="text"
                value={config.emergencyCallNumber}
                onChange={(e) => updateConfig({ emergencyCallNumber: e.target.value })}
                placeholder="112 o número de emergencias autonómico"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={onOpenReport}
              className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1.5"
            >
              <FileCheck className="w-4 h-4" />
              <span>Ver y Configurar Informe Clínico para Médico</span>
            </button>
          </div>
        </div>

      </div>
        </>
      )}

      {/* 3. Patient Profiles Directory Tab */}
      {activeAdminTab === 'pacientes' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm min-w-0 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Fichas de Familiares y Pacientes
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cada familiar tiene su propio historial médico y botiquín independiente
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenNewPatient}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Nuevo Paciente</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {patients.map(p => (
            <div
              key={p.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all min-w-0 break-words ${
                p.id === activePatient.id 
                  ? 'border-teal-400/80 dark:border-teal-600 bg-teal-50/20 dark:bg-teal-950/20 ring-1 ring-teal-400/50' 
                  : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex items-start justify-between gap-2.5 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative group shrink-0">
                    <button
                      type="button"
                      onClick={() => setPhotoModalPatient(p)}
                      className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 block transition-transform active:scale-95"
                      title={`Cambiar fotografía de ${p.name}`}
                    >
                      {p.avatar ? (
                        <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                          {p.name.charAt(0)}
                        </div>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoModalPatient(p)}
                      className="absolute -bottom-1 -right-1 p-1 rounded-md bg-teal-600 hover:bg-teal-700 text-white shadow-xs border border-white dark:border-slate-900 transition-colors"
                      title={`Cambiar fotografía de ${p.name}`}
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-base text-slate-900 dark:text-white break-words">
                      {p.name}
                    </h4>
                    <div className="text-xs text-slate-500 dark:text-slate-400 break-words">
                      {p.nickname} · {p.age} años · SIP: {p.dniSip}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPhotoModalPatient(p)}
                    className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg transition-colors"
                    title={`Cambiar foto de ${p.name}`}
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenPatientEdit(p)}
                    className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg transition-colors"
                    title="Editar ficha"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {patients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => deletePatient(p.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      title="Eliminar paciente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 break-words">
                <div><strong>Médico:</strong> {p.primaryCareDoctor} ({p.healthCenter})</div>
                <div><strong>Contacto Emergencia:</strong> {p.emergencyContactName} ({p.emergencyContactPhone})</div>
                <div>
                  <strong>Alergias:</strong>{' '}
                  <span className="text-rose-600 dark:text-rose-400 font-medium">
                    {(p.allergies?.length ?? 0) > 0 ? p.allergies?.join(', ') : 'Ninguna'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        </div>
      )}

      {/* 4. Family Caregivers Directory Tab */}
      {activeAdminTab === 'cuidadores' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm min-w-0 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Directorio de Cuidadores Familiares
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cualquier cuidador registrado puede tomar la tensión y marcar la medicación diaria libremente sin PIN
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOpenCaregiverModal()}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Cuidador Familiar</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {caregivers.map(cg => (
            <div
              key={cg.id}
              className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between min-w-0 break-words"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {cg.name}
                    </h4>
                    <div className="text-xs text-slate-500">
                      {cg.relation}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenCaregiverModal(cg)}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {caregivers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => deleteCaregiver(cg.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 mb-2 font-mono">
                  <a href={`tel:${cg.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                    {cg.phone}
                  </a>
                </div>

                {cg.notes && (
                  <p className="text-[11px] text-slate-500 italic">
                    &quot;{cg.notes}&quot;
                  </p>
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                <span className="font-medium text-slate-600 dark:text-slate-400">
                  Rol: {cg.role === 'admin' ? 'Administrador' : 'Cuidador'}
                </span>
                {cg.isEmergencyContact && (
                  <span className="text-rose-600 dark:text-rose-400 font-bold">
                    Contacto SOS
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        </div>
      )}

      {/* Backup and Data Maintenance (Shown under Seguridad tab) */}
      {activeAdminTab === 'seguridad' && (
        <>
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm min-w-0 overflow-hidden">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Copia de Seguridad y Restauración
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Exporta todos los datos clínicos a un archivo JSON seguro o restáuralos en otro dispositivo
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors flex items-center gap-3 min-w-0"
          >
            <Download className="w-5 h-5 text-teal-600 shrink-0" />
            <div className="min-w-0">
              <div className="font-semibold text-xs text-slate-900 dark:text-white">
                Descargar Respaldo JSON
              </div>
              <div className="text-[11px] text-slate-500">
                Guarda mediciones, citas y medicación
              </div>
            </div>
          </button>

          <div className="min-w-0">
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors flex items-center gap-3 min-w-0"
            >
              <Upload className="w-5 h-5 text-blue-600 shrink-0" />
              <div className="min-w-0">
                <div className="font-semibold text-xs text-slate-900 dark:text-white">
                  Restaurar desde JSON
                </div>
                <div className="text-[11px] text-slate-500">
                  Carga un archivo de copia anterior
                </div>
              </div>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 text-left transition-colors flex items-center gap-3 min-w-0"
          >
            <RotateCcw className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="min-w-0">
              <div className="font-semibold text-xs text-rose-700 dark:text-rose-400">
                Restablecer Datos de Muestra
              </div>
              <div className="text-[11px] text-slate-500">
                Vuelve al estado inicial del tutorial
              </div>
            </div>
          </button>

        </div>

        {importStatus && (
          <div className="mt-4 p-3 rounded-xl bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{importStatus}</span>
          </div>
        )}
      </div>

      {/* Web App (PWA) & Free Hosting Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 min-w-0 overflow-hidden">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <Globe className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-base text-slate-900 dark:text-white break-words">
              Subir a Web Gratuita y Funcionamiento como App Móvil (PWA)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Guía paso a paso para alojar en Vercel, Netlify o GitHub Pages, e instalar como app nativa en Android e iOS.
            </p>
          </div>
        </div>

        {onOpenDeployGuide && (
          <button
            type="button"
            onClick={onOpenDeployGuide}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shrink-0 shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <Smartphone className="w-4 h-4 shrink-0" />
            <span>Abrir Guía de Instalación</span>
          </button>
        )}
      </div>
      </>
      )}

      {/* Patient Edit / Create Modal */}
      {showPatientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {isNewPatient ? 'Registrar Nuevo Paciente' : 'Editar Ficha del Paciente'}
                  </h3>
                  <p className="text-xs text-slate-500">Datos clínicos y de contacto</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPatientModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePatient} className="space-y-4">
              
              {/* Photo selector inside form */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-teal-100 dark:bg-teal-950 border border-teal-500/30 shrink-0 flex items-center justify-center">
                  {pAvatar ? (
                    <img src={pAvatar} alt={pName || 'Paciente'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="font-bold text-lg text-teal-700 dark:text-teal-300">
                      {pName?.charAt(0) || 'P'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Fotografía del Paciente
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {pAvatar ? 'Foto personalizada asignada' : 'Sin foto asignada (se muestran iniciales)'}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setShowPhotoModalForForm(true)}
                      className="px-3 py-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{pAvatar ? 'Cambiar Foto' : 'Añadir Foto'}</span>
                    </button>
                    {pAvatar && (
                      <button
                        type="button"
                        onClick={() => setPAvatar('')}
                        className="px-2.5 py-1 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        Quitar foto
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                    placeholder="Carmen Gómez..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Apodo / Nombre Familiar
                  </label>
                  <input
                    type="text"
                    value={pNickname}
                    onChange={(e) => setPNickname(e.target.value)}
                    placeholder="Abuela Carmen, Papá..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Edad
                  </label>
                  <input
                    type="number"
                    value={pAge}
                    onChange={(e) => setPAge(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    SIP / N° Sanitario
                  </label>
                  <input
                    type="text"
                    value={pDniSip}
                    onChange={(e) => setPDniSip(e.target.value)}
                    placeholder="SIP: 03/..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Grupo Sanguíneo
                  </label>
                  <select
                    value={pBloodType}
                    onChange={(e) => setPBloodType(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="0+">0+</option>
                    <option value="0-">0-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Médico de Cabecera
                  </label>
                  <input
                    type="text"
                    value={pDoctor}
                    onChange={(e) => setPDoctor(e.target.value)}
                    placeholder="Dra. Elena Ramos..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Centro de Salud y Consulta
                  </label>
                  <input
                    type="text"
                    value={pCenter}
                    onChange={(e) => setPCenter(e.target.value)}
                    placeholder="CS San Juan..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono del Centro
                  </label>
                  <input
                    type="text"
                    value={pCenterPhone}
                    onChange={(e) => setPCenterPhone(e.target.value)}
                    placeholder="+34 965 22 44 11"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono Familiar de Emergencia
                  </label>
                  <input
                    type="text"
                    value={pEmergencyPhone}
                    onChange={(e) => setPEmergencyPhone(e.target.value)}
                    placeholder="+34 611 452 890"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-rose-700 dark:text-rose-400 mb-1">
                  Alergias Conocidas (separadas por coma)
                </label>
                <input
                  type="text"
                  value={pAllergies}
                  onChange={(e) => setPAllergies(e.target.value)}
                  placeholder="Ej: Penicilina, Ibuprofeno..."
                  className="w-full text-xs p-2.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Patologías Crónicas (separadas por coma)
                </label>
                <input
                  type="text"
                  value={pConditions}
                  onChange={(e) => setPConditions(e.target.value)}
                  placeholder="Ej: Hipertensión, Artrosis, Diabetes..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Instrucciones o Hábitos de Cuidado
                </label>
                <textarea
                  value={pNotes}
                  onChange={(e) => setPNotes(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPatientModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs"
                >
                  Guardar Ficha
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Caregiver Modal */}
      {showCaregiverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base">
                {editingCaregiver ? 'Editar Cuidador' : 'Añadir Familiar / Cuidador'}
              </h3>
              <button
                type="button"
                onClick={() => setShowCaregiverModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCaregiver} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={cgName}
                  onChange={(e) => setCgName(e.target.value)}
                  placeholder="María Gómez..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Parentesco / Rol</label>
                  <input
                    type="text"
                    value={cgRelation}
                    onChange={(e) => setCgRelation(e.target.value)}
                    placeholder="Hija, Hijo, Auxiliar..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Teléfono Móvil *</label>
                  <input
                    type="text"
                    required
                    value={cgPhone}
                    onChange={(e) => setCgPhone(e.target.value)}
                    placeholder="+34 6..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Permisos</label>
                  <select
                    value={cgRole}
                    onChange={(e) => setCgRole(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="admin">Administrador (Total)</option>
                    <option value="cuidador">Cuidador (Lectura + Tomas)</option>
                  </select>
                </div>
                <div className="flex items-center sm:pt-5">
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cgIsEmergency}
                      onChange={(e) => setCgIsEmergency(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded"
                    />
                    <span>Contacto SOS Principal</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Disponibilidad / Turno</label>
                <input
                  type="text"
                  value={cgNotes}
                  onChange={(e) => setCgNotes(e.target.value)}
                  placeholder="Ej: Fines de semana, Mañanas..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCaregiverModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
                >
                  Guardar Cuidador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin PIN Unlock Modal */}
      <AdminPinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        title="Desbloquear Modo Administrador"
        description="Introduce el PIN de 4 dígitos para acceder a todos los privilegios de configuración y edición."
      />

      {/* Direct Photo Modal for Patient in Directory */}
      {photoModalPatient && (
        <ChangePatientPhotoModal
          isOpen={true}
          onClose={() => setPhotoModalPatient(null)}
          patientId={photoModalPatient.id}
          patientName={photoModalPatient.nickname || photoModalPatient.name}
          currentAvatar={photoModalPatient.avatar || ''}
          onSave={(newAvatar) => {
            updatePatient(photoModalPatient.id, { avatar: newAvatar });
            setPhotoModalPatient(null);
          }}
        />
      )}

      {/* Photo Modal for Patient Form */}
      {showPhotoModalForForm && (
        <ChangePatientPhotoModal
          isOpen={true}
          onClose={() => setShowPhotoModalForForm(false)}
          patientId={editingPatient?.id || 'new'}
          patientName={pNickname || pName || 'Paciente'}
          currentAvatar={pAvatar}
          onSave={(newAvatar) => {
            setPAvatar(newAvatar);
            setShowPhotoModalForForm(false);
          }}
        />
      )}

      {/* Reset Defaults Confirmation Modal (replaces window.confirm) */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 shadow-2xl border border-rose-200 dark:border-rose-900 text-slate-900 dark:text-slate-100">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base">¿Restablecer datos de muestra?</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
              Se restaurarán los registros iniciales del tutorial y se perderán las modificaciones locales que no hayas exportado en JSON.
            </p>
            <div className="flex flex-wrap justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  resetToDefaults();
                  setShowResetConfirm(false);
                }}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs"
              >
                Sí, restablecer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
