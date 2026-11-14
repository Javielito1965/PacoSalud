import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ClinicalPathology, 
  ClinicalAllergy, 
  ClinicalAntecedent,
  PathologyStatus,
  AllergySeverity,
  AntecedentCategory
} from '../types';
import { 
  Activity, 
  AlertTriangle, 
  ShieldAlert, 
  Heart, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  FileText, 
  Search, 
  Check, 
  Sparkles, 
  User, 
  PhoneCall, 
  Calendar,
  Layers,
  Info
} from 'lucide-react';
import { AdminPinModal } from './AdminPinModal';

interface Props {
  onOpenReport: () => void;
}

export const ClinicalHistorySection: React.FC<Props> = ({ onOpenReport }) => {
  const { 
    activePatient,
    patientPathologies,
    addClinicalPathology,
    updateClinicalPathology,
    deleteClinicalPathology,
    patientAllergies,
    addClinicalAllergy,
    updateClinicalAllergy,
    deleteClinicalAllergy,
    patientAntecedents,
    addClinicalAntecedent,
    updateClinicalAntecedent,
    deleteClinicalAntecedent,
    config,
    activeCaregiver
  } = useApp();

  const [activeTab, setActiveTab] = useState<'patologias' | 'alergias' | 'antecedentes' | 'datos_medicos'>('patologias');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [showPathologyModal, setShowPathologyModal] = useState(false);
  const [editingPathology, setEditingPathology] = useState<ClinicalPathology | null>(null);
  const [pathName, setPathName] = useState('');
  const [pathStatus, setPathStatus] = useState<PathologyStatus>('activa');
  const [pathYear, setPathYear] = useState('');
  const [pathTreatment, setPathTreatment] = useState('');
  const [pathNotes, setPathNotes] = useState('');

  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [editingAllergy, setEditingAllergy] = useState<ClinicalAllergy | null>(null);
  const [algSubstance, setAlgSubstance] = useState('');
  const [algSeverity, setAlgSeverity] = useState<AllergySeverity>('moderada');
  const [algReaction, setAlgReaction] = useState('');
  const [algYear, setAlgYear] = useState('');
  const [algNotes, setAlgNotes] = useState('');

  const [showAntecedentModal, setShowAntecedentModal] = useState(false);
  const [editingAntecedent, setEditingAntecedent] = useState<ClinicalAntecedent | null>(null);
  const [antTitle, setAntTitle] = useState('');
  const [antCategory, setAntCategory] = useState<AntecedentCategory>('quirurgico');
  const [antYear, setAntYear] = useState('');
  const [antHospital, setAntHospital] = useState('');
  const [antDetails, setAntDetails] = useState('');

  // Delete & Security
  const [itemToDelete, setItemToDelete] = useState<{ type: 'pathology' | 'allergy' | 'antecedent'; id: string } | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Handlers for Pathologies
  const handleOpenAddPathology = () => {
    setEditingPathology(null);
    setPathName('');
    setPathStatus('activa');
    setPathYear(new Date().getFullYear().toString());
    setPathTreatment('');
    setPathNotes('');
    setShowPathologyModal(true);
  };

  const handleOpenEditPathology = (item: ClinicalPathology) => {
    setEditingPathology(item);
    setPathName(item.name);
    setPathStatus(item.status);
    setPathYear(item.diagnosedYear || '');
    setPathTreatment(item.treatmentSummary || '');
    setPathNotes(item.doctorNotes || '');
    setShowPathologyModal(true);
  };

  const handleSubmitPathology = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pathName.trim()) return;
    if (editingPathology) {
      updateClinicalPathology(editingPathology.id, {
        name: pathName.trim(),
        status: pathStatus,
        diagnosedYear: pathYear,
        treatmentSummary: pathTreatment.trim(),
        doctorNotes: pathNotes.trim(),
      });
    } else {
      addClinicalPathology({
        name: pathName.trim(),
        status: pathStatus,
        diagnosedYear: pathYear,
        treatmentSummary: pathTreatment.trim(),
        doctorNotes: pathNotes.trim(),
      });
    }
    setShowPathologyModal(false);
  };

  // Handlers for Allergies
  const handleOpenAddAllergy = () => {
    setEditingAllergy(null);
    setAlgSubstance('');
    setAlgSeverity('moderada');
    setAlgReaction('');
    setAlgYear('');
    setAlgNotes('');
    setShowAllergyModal(true);
  };

  const handleOpenEditAllergy = (item: ClinicalAllergy) => {
    setEditingAllergy(item);
    setAlgSubstance(item.substance);
    setAlgSeverity(item.severity);
    setAlgReaction(item.reaction || '');
    setAlgYear(item.diagnosedYear || '');
    setAlgNotes(item.notes || '');
    setShowAllergyModal(true);
  };

  const handleSubmitAllergy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!algSubstance.trim()) return;
    if (editingAllergy) {
      updateClinicalAllergy(editingAllergy.id, {
        substance: algSubstance.trim(),
        severity: algSeverity,
        reaction: algReaction.trim(),
        diagnosedYear: algYear,
        notes: algNotes.trim(),
      });
    } else {
      addClinicalAllergy({
        substance: algSubstance.trim(),
        severity: algSeverity,
        reaction: algReaction.trim(),
        diagnosedYear: algYear,
        notes: algNotes.trim(),
      });
    }
    setShowAllergyModal(false);
  };

  // Handlers for Antecedents
  const handleOpenAddAntecedent = () => {
    setEditingAntecedent(null);
    setAntTitle('');
    setAntCategory('quirurgico');
    setAntYear(new Date().getFullYear().toString());
    setAntHospital('');
    setAntDetails('');
    setShowAntecedentModal(true);
  };

  const handleOpenEditAntecedent = (item: ClinicalAntecedent) => {
    setEditingAntecedent(item);
    setAntTitle(item.title);
    setAntCategory(item.category);
    setAntYear(item.yearOrDate || '');
    setAntHospital(item.facilityOrHospital || '');
    setAntDetails(item.details || '');
    setShowAntecedentModal(true);
  };

  const handleSubmitAntecedent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!antTitle.trim()) return;
    if (editingAntecedent) {
      updateClinicalAntecedent(editingAntecedent.id, {
        title: antTitle.trim(),
        category: antCategory,
        yearOrDate: antYear.trim(),
        facilityOrHospital: antHospital.trim(),
        details: antDetails.trim(),
      });
    } else {
      addClinicalAntecedent({
        title: antTitle.trim(),
        category: antCategory,
        yearOrDate: antYear.trim(),
        facilityOrHospital: antHospital.trim(),
        details: antDetails.trim(),
      });
    }
    setShowAntecedentModal(false);
  };

  // Security protected delete prompt
  const handleDeleteItemPrompt = (type: 'pathology' | 'allergy' | 'antecedent', id: string) => {
    if (!config.isAdminUnlocked && config.strictSafetyLock && activeCaregiver.role !== 'admin') {
      setPendingAction(() => () => {
        setItemToDelete({ type, id });
      });
      setShowPinModal(true);
      return;
    }
    setItemToDelete({ type, id });
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'pathology') {
      deleteClinicalPathology(itemToDelete.id);
    } else if (itemToDelete.type === 'allergy') {
      deleteClinicalAllergy(itemToDelete.id);
    } else if (itemToDelete.type === 'antecedent') {
      deleteClinicalAntecedent(itemToDelete.id);
    }
    setItemToDelete(null);
  };

  // Helper labels and badges
  const getSeverityBadge = (severity: AllergySeverity) => {
    switch (severity) {
      case 'anafilaxia':
        return { label: 'Anafilaxia (Extrema)', class: 'bg-red-600 text-white font-bold animate-pulse border-red-700' };
      case 'grave':
        return { label: 'Grave', class: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800 font-bold' };
      case 'moderada':
        return { label: 'Moderada', class: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-semibold' };
      case 'leve':
      default:
        return { label: 'Leve', class: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-medium' };
    }
  };

  const getStatusBadge = (status: PathologyStatus) => {
    switch (status) {
      case 'activa':
        return { label: 'Activa / En Tratamiento', class: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800' };
      case 'controlada':
        return { label: 'Controlada', class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' };
      case 'en_remision':
        return { label: 'En Remisión', class: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-300 dark:border-teal-800' };
      case 'resuelta':
        return { label: 'Curada / Resuelta', class: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700' };
    }
  };

  const getCategoryLabel = (category: AntecedentCategory) => {
    switch (category) {
      case 'quirurgico':
        return { label: 'Cirugía / Quirúrgico', color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200' };
      case 'hospitalizacion':
        return { label: 'Hospitalización / Ingreso', color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200' };
      case 'dispositivo_implante':
        return { label: 'Prótesis / Implante / Dispositivo', color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border-teal-200' };
      case 'familiar':
        return { label: 'Antecedente Familiar Relevante', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200' };
      case 'habito':
        return { label: 'Hábito / Factor de Estilo', color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200' };
      case 'otro':
      default:
        return { label: 'Otro Antecedente', color: 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-200' };
    }
  };

  // Filtered entries by search
  const filteredPathologies = patientPathologies.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.treatmentSummary || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.doctorNotes || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAllergies = patientAllergies.filter(a => 
    a.substance.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.reaction || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAntecedents = patientAntecedents.filter(ant => 
    ant.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ant.facilityOrHospital || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ant.details || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Historial Clínico del Paciente
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight break-words">
            Historial Médico y Antecedentes
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">
            Registro estructurado de patologías crónicas, alergias y antecedentes quirúrgicos o familiares de {activePatient.nickname || activePatient.name}
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={onOpenReport}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-slate-200 dark:border-slate-700"
          >
            <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <span>Ver Informe Médico</span>
          </button>
        </div>
      </div>

      {/* Patient Summary Card */}
      <div className="bg-slate-50/70 dark:bg-slate-800/40 p-3.5 sm:p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 shrink-0">
            {activePatient.avatar ? (
              <img src={activePatient.avatar} alt={activePatient.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-sm">
                {activePatient.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-900 dark:text-white text-sm break-words">
              {activePatient.name} ({activePatient.age} años)
            </div>
            <div className="text-slate-500 dark:text-slate-400 break-words">
              SIP / DNI: <strong className="font-mono text-slate-700 dark:text-slate-300">{activePatient.dniSip || 'No asignado'}</strong> · Grupo: <strong className="text-rose-600 dark:text-rose-400 font-bold">{activePatient.bloodType || 'A+'}</strong>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-slate-500 dark:text-slate-400 text-xs min-w-0">
          <span>Médico Asignado:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 break-words">{activePatient.primaryCareDoctor || 'No indicado'}</span>
          <span aria-hidden="true">·</span>
          <span className="break-words">{activePatient.healthCenter}</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full lg:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('patologias')}
            className={`flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'patologias'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5 shrink-0" />
            <span>Patologías ({patientPathologies.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('alergias')}
            className={`flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'alergias'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Alergias ({patientAllergies.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('antecedentes')}
            className={`flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'antecedentes'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>Antecedentes ({patientAntecedents.length})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por término o notas..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
        </div>
      </div>

      {/* 1. SECCIÓN PATOLOGÍAS */}
      {activeTab === 'patologias' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-bold text-base text-slate-900 dark:text-white break-words">
                Enfermedades y Patologías Diagnosticadas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Afecciones clínicas activas, controladas o con pauta de seguimiento
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddPathology}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir Patología</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPathologies.length === 0 ? (
              <div className="col-span-full py-10 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                No hay patologías registradas con el filtro actual.
              </div>
            ) : (
              filteredPathologies.map(p => {
                const badge = getStatusBadge(p.status);
                return (
                  <div 
                    key={p.id}
                    className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between min-w-0 overflow-hidden break-words"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-base text-slate-900 dark:text-white break-words">
                            {p.name}
                          </h4>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Año diagnóstico: {p.diagnosedYear || 'No indicado'}
                          </div>
                        </div>
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-lg border ${badge.class} shrink-0`}>
                          {badge.label}
                        </span>
                      </div>

                      {p.treatmentSummary && (
                        <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                            Pauta / Tratamiento actual:
                          </span>
                          <span className="text-slate-600 dark:text-slate-400">
                            {p.treatmentSummary}
                          </span>
                        </div>
                      )}

                      {p.doctorNotes && (
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 italic">
                          "{p.doctorNotes}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-4 mt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleOpenEditPathology(p)}
                        className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Editar patología"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItemPrompt('pathology', p.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Eliminar patología"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 2. SECCIÓN ALERGIAS */}
      {activeTab === 'alergias' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-bold text-base text-slate-900 dark:text-white break-words">
                Alergias e Intolerancias a Fármacos o Sustancias
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Información crítica de seguridad para prevenir prescripciones incompatibles
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddAllergy}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir Alergia</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAllergies.length === 0 ? (
              <div className="col-span-full py-10 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                No hay alergias registradas para este paciente.
              </div>
            ) : (
              filteredAllergies.map(a => {
                const badge = getSeverityBadge(a.severity);
                return (
                  <div 
                    key={a.id}
                    className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between min-w-0 overflow-hidden break-words"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <AlertTriangle className={`w-4 h-4 shrink-0 ${a.severity === 'anafilaxia' || a.severity === 'grave' ? 'text-rose-600' : 'text-amber-500'}`} />
                            <h4 className="font-extrabold text-base text-slate-900 dark:text-white break-words">
                              {a.substance}
                            </h4>
                          </div>
                          {a.diagnosedYear && (
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Diagnosticada en: {a.diagnosedYear}
                            </div>
                          )}
                        </div>
                        <span className={`text-[11px] px-2.5 py-0.5 rounded-lg border ${badge.class} shrink-0`}>
                          {badge.label}
                        </span>
                      </div>

                      {a.reaction && (
                        <div className="mt-3 p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 text-xs">
                          <span className="font-bold text-rose-800 dark:text-rose-300 block mb-0.5">
                            Reacción observada / Síntomas:
                          </span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {a.reaction}
                          </span>
                        </div>
                      )}

                      {a.notes && (
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          {a.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-4 mt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleOpenEditAllergy(a)}
                        className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Editar alergia"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItemPrompt('allergy', a.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Eliminar alergia"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 3. SECCIÓN ANTECEDENTES */}
      {activeTab === 'antecedentes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-bold text-base text-slate-900 dark:text-white break-words">
                Antecedentes Quirúrgicos, Implantes y Familiares
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cirugías previas, prótesis, marcapasos o antecedentes directos de interés
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddAntecedent}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir Antecedente</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAntecedents.length === 0 ? (
              <div className="col-span-full py-10 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                No hay antecedentes registrados para este paciente.
              </div>
            ) : (
              filteredAntecedents.map(ant => {
                const cat = getCategoryLabel(ant.category);
                return (
                  <div 
                    key={ant.id}
                    className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between min-w-0 overflow-hidden break-words"
                  >
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${cat.color} inline-block mb-1`}>
                            {cat.label}
                          </span>
                          <h4 className="font-bold text-base text-slate-900 dark:text-white break-words">
                            {ant.title}
                          </h4>
                          <div className="text-[11px] text-slate-400 mt-0.5 break-words">
                            Fecha / Año: {ant.yearOrDate || 'No indicado'} {ant.facilityOrHospital ? `· ${ant.facilityOrHospital}` : ''}
                          </div>
                        </div>
                      </div>

                      {ant.details && (
                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                          {ant.details}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-4 mt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleOpenEditAntecedent(ant)}
                        className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Editar antecedente"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItemPrompt('antecedent', ant.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Eliminar antecedente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL PATOLOGÍA */}
      {showPathologyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base">
                {editingPathology ? 'Editar Patología' : 'Añadir Patología o Enfermedad'}
              </h3>
              <button
                type="button"
                onClick={() => setShowPathologyModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPathology} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre de la patología o diagnóstico clínico *
                </label>
                <input
                  type="text"
                  required
                  value={pathName}
                  onChange={(e) => setPathName(e.target.value)}
                  placeholder="Ej: Hipertensión arterial esencial, Diabetes Tipo 2..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estado clínico
                  </label>
                  <select
                    value={pathStatus}
                    onChange={(e) => setPathStatus(e.target.value as PathologyStatus)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="activa">Activa / En tratamiento</option>
                    <option value="controlada">Controlada</option>
                    <option value="en_remision">En remisión</option>
                    <option value="resuelta">Curada / Resuelta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Año de diagnóstico
                  </label>
                  <input
                    type="text"
                    value={pathYear}
                    onChange={(e) => setPathYear(e.target.value)}
                    placeholder="Ej: 2018"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tratamiento o pauta pautada
                </label>
                <input
                  type="text"
                  value={pathTreatment}
                  onChange={(e) => setPathTreatment(e.target.value)}
                  placeholder="Ej: Enalapril 20mg diario + dieta baja en sal"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notas u observaciones del médico
                </label>
                <textarea
                  value={pathNotes}
                  onChange={(e) => setPathNotes(e.target.value)}
                  placeholder="Recomendaciones, controles periódicos, etc."
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPathologyModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs"
                >
                  Guardar Patología
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ALERGIA */}
      {showAllergyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base">
                {editingAllergy ? 'Editar Alergia' : 'Añadir Alergia / Intolerancia'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAllergyModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAllergy} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sustancia, fármaco o alimento alérgeno *
                </label>
                <input
                  type="text"
                  required
                  value={algSubstance}
                  onChange={(e) => setAlgSubstance(e.target.value)}
                  placeholder="Ej: Penicilina, Ibuprofeno, Látex, Frutos secos..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Gravedad conocida
                  </label>
                  <select
                    value={algSeverity}
                    onChange={(e) => setAlgSeverity(e.target.value as AllergySeverity)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="leve">Leve (prurito leve, eritema)</option>
                    <option value="moderada">Moderada (urticaria, molestias)</option>
                    <option value="grave">Grave (edema facial, dificultad respiratoria)</option>
                    <option value="anafilaxia">Anafilaxia (Riesgo vital extremo)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Año de diagnóstico
                  </label>
                  <input
                    type="text"
                    value={algYear}
                    onChange={(e) => setAlgYear(e.target.value)}
                    placeholder="Ej: 1995"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reacción clínica observada
                </label>
                <input
                  type="text"
                  value={algReaction}
                  onChange={(e) => setAlgReaction(e.target.value)}
                  placeholder="Ej: Urticaria severa, shock, edema de glotis..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Instrucciones o sustitutos autorizados
                </label>
                <textarea
                  value={algNotes}
                  onChange={(e) => setAlgNotes(e.target.value)}
                  placeholder="Ej: Contraindicados todos los derivados de penicilina. Analgésico seguro: paracetamol."
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAllergyModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs"
                >
                  Guardar Alergia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ANTECEDENTE */}
      {showAntecedentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base">
                {editingAntecedent ? 'Editar Antecedente' : 'Añadir Antecedente Importante'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAntecedentModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAntecedent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Título o descripción del antecedente *
                </label>
                <input
                  type="text"
                  required
                  value={antTitle}
                  onChange={(e) => setAntTitle(e.target.value)}
                  placeholder="Ej: Prótesis de cadera izquierda, Marcapasos, Colecistectomía..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Categoría
                  </label>
                  <select
                    value={antCategory}
                    onChange={(e) => setAntCategory(e.target.value as AntecedentCategory)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="quirurgico">Quirúrgico / Operación</option>
                    <option value="hospitalizacion">Hospitalización / Ingreso</option>
                    <option value="dispositivo_implante">Prótesis / Implante / Dispositivo</option>
                    <option value="familiar">Antecedente Familiar Relevante</option>
                    <option value="habito">Hábito de Vida</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Año o fecha
                  </label>
                  <input
                    type="text"
                    value={antYear}
                    onChange={(e) => setAntYear(e.target.value)}
                    placeholder="Ej: 2021 o Familiar"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hospital o centro médico donde se realizó
                </label>
                <input
                  type="text"
                  value={antHospital}
                  onChange={(e) => setAntHospital(e.target.value)}
                  placeholder="Ej: Hospital General Universitario"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Detalles clínicos y evolución
                </label>
                <textarea
                  value={antDetails}
                  onChange={(e) => setAntDetails(e.target.value)}
                  placeholder="Evolución, secuelas, tipo de prótesis o detalles..."
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAntecedentModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs"
                >
                  Guardar Antecedente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIÁLOGO CONFIRMACIÓN DE BORRADO */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-rose-200 dark:border-rose-900 text-slate-900 dark:text-slate-100">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base">¿Eliminar registro clínico?</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
              Esta acción borrará este elemento del historial médico permanente del paciente.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Pin Modal */}
      <AdminPinModal
        isOpen={showPinModal}
        onClose={() => {
          setShowPinModal(false);
          setPendingAction(null);
        }}
        onSuccess={() => {
          if (pendingAction) {
            pendingAction();
            setPendingAction(null);
          }
        }}
        title="Acción Protegida de Administrador"
        description="Se requiere el PIN de administración familiar para modificar o eliminar elementos del historial clínico."
      />

    </div>
  );
};
