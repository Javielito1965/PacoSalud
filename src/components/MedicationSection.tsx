import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Medication, MedicationForm, FoodInstruction } from '../types';
import { 
  Pill, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  AlertTriangle, 
  Clock, 
  Package, 
  Search, 
  Info, 
  ShieldAlert, 
  Calendar,
  X,
  RotateCcw,
  PlusCircle,
  FileText
} from 'lucide-react';
import { AdminPinModal } from './AdminPinModal';

interface Props {
  onOpenReport: () => void;
}

export const MedicationSection: React.FC<Props> = ({ onOpenReport }) => {
  const { 
    activePatient, 
    patientMedications, 
    todayLogs, 
    markDoseStatus, 
    addMedication, 
    updateMedication, 
    deleteMedication, 
    updateStock, 
    config, 
    caregivers,
    activeCaregiver,
    setActiveCaregiverId,
    canModifyReadingOrDose
  } = useApp();

  const [activeTab, setActiveTab] = useState<'today' | 'catalog'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [medToDelete, setMedToDelete] = useState<string | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [pinModalDetails, setPinModalDetails] = useState<{ title: string; description: string }>({
    title: 'Acceso de Administrador',
    description: 'Se requiere el PIN de administración para realizar esta acción.'
  });

  // Form State
  const [formName, setFormName] = useState('');
  const [formActiveSubstance, setFormActiveSubstance] = useState('');
  const [formDose, setFormDose] = useState('');
  const [formForm, setFormForm] = useState<MedicationForm>('Comprimido');
  const [formScheduleTimes, setFormScheduleTimes] = useState<string>('08:30');
  const [formScheduleLabels, setFormScheduleLabels] = useState<string>('Desayuno');
  const [formInstructions, setFormInstructions] = useState('');
  const [formWithFood, setFormWithFood] = useState<FoodInstruction>('Con alimentos');
  const [formStock, setFormStock] = useState<number>(30);
  const [formLowStockThreshold, setFormLowStockThreshold] = useState<number>(7);
  const [formPrescription, setFormPrescription] = useState('Receta CS activa');

  // Dose timeline building for today
  const allTodayDoses = useMemo(() => {
    const list: Array<{
      med: Medication;
      timeSlot: string;
      slotLabel: string;
      status: 'tomada' | 'pendiente' | 'omitida' | 'pospuesta';
      takenAt: string | null;
      takenBy: string | null;
      notes: string;
    }> = [];

    (patientMedications || []).filter(m => m && m.active).forEach(med => {
      const times = med.scheduleTimes || [];
      const labels = med.scheduleLabels || [];
      if (times.length === 0) {
        // "Si precisa" PRN medication
        const log = todayLogs.find(l => l.medicationId === med.id && l.timeSlot === 'SOS');
        list.push({
          med,
          timeSlot: 'SOS',
          slotLabel: 'Si precisa (Dolor / Rescate)',
          status: log ? log.status : 'pendiente',
          takenAt: log ? log.takenAt : null,
          takenBy: log ? log.takenBy : null,
          notes: log ? log.notes : '',
        });
      } else {
        times.forEach((time, index) => {
          const label = labels[index] || 'Toma';
          const log = todayLogs.find(l => l.medicationId === med.id && l.timeSlot === time);
          list.push({
            med,
            timeSlot: time,
            slotLabel: label,
            status: log ? log.status : 'pendiente',
            takenAt: log ? log.takenAt : null,
            takenBy: log ? log.takenBy : null,
            notes: log ? log.notes : '',
          });
        });
      }
    });

    return list.sort((a, b) => {
      if (a.timeSlot === 'SOS') return 1;
      if (b.timeSlot === 'SOS') return -1;
      return a.timeSlot.localeCompare(b.timeSlot);
    });
  }, [patientMedications, todayLogs]);

  // Adherence
  const scheduledDoses = allTodayDoses.filter(d => d.timeSlot !== 'SOS');
  const takenCount = scheduledDoses.filter(d => d.status === 'tomada').length;
  const totalCount = scheduledDoses.length;
  const adherence = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 100;

  // Filtered Catalog
  const filteredCatalog = useMemo(() => {
    let list = [...patientMedications];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(m => 
        m.name.toLowerCase().includes(q) || 
        m.activeSubstance.toLowerCase().includes(q) ||
        m.dose.toLowerCase().includes(q)
      );
    }
    return list;
  }, [patientMedications, searchQuery]);

  const handleOpenAdd = () => {
    setEditingMed(null);
    setFormName('');
    setFormActiveSubstance('');
    setFormDose('');
    setFormForm('Comprimido');
    setFormScheduleTimes('08:30');
    setFormScheduleLabels('Desayuno');
    setFormInstructions('');
    setFormWithFood('Con alimentos');
    setFormStock(28);
    setFormLowStockThreshold(7);
    setFormPrescription('Receta Electrónica activa');
    setShowAddModal(true);
  };

  const handleOpenEdit = (med: Medication) => {
    if (!config.isAdminUnlocked && config.strictSafetyLock) {
      setPinModalDetails({
        title: 'Edición de Medicación Protegida',
        description: 'Se requiere el PIN de administración para modificar tratamientos prescritos.'
      });
      setPendingAction(() => () => openEditDirect(med));
      setShowPinModal(true);
      return;
    }
    openEditDirect(med);
  };

  const openEditDirect = (med: Medication) => {
    setEditingMed(med);
    setFormName(med.name);
    setFormActiveSubstance(med.activeSubstance);
    setFormDose(med.dose);
    setFormForm(med.form);
    setFormScheduleTimes((med.scheduleTimes || []).join(', '));
    setFormScheduleLabels((med.scheduleLabels || []).join(', '));
    setFormInstructions(med.instructions);
    setFormWithFood(med.withFood);
    setFormStock(med.currentStock);
    setFormLowStockThreshold(med.lowStockThreshold);
    setFormPrescription(med.prescriptionRef);
    setShowAddModal(true);
  };

  const handleDeletePrompt = (medId: string) => {
    if (!config.isAdminUnlocked && config.strictSafetyLock) {
      setPinModalDetails({
        title: 'Eliminación Protegida de Fármaco',
        description: 'Se requiere el PIN de administración para eliminar un tratamiento de la pauta médica.'
      });
      setPendingAction(() => () => setMedToDelete(medId));
      setShowPinModal(true);
      return;
    }
    setMedToDelete(medId);
  };

  const confirmDelete = () => {
    if (medToDelete) {
      deleteMedication(medToDelete);
      setMedToDelete(null);
    }
  };

  const handleUndoDose = (medId: string, timeSlot: string, slotLabel: string, takenBy: string | null) => {
    const allowed = canModifyReadingOrDose(takenBy || '');
    if (!allowed) {
      setPinModalDetails({
        title: 'Modificación de Toma Protegida',
        description: `Esta toma fue administrada por "${takenBy || 'otro cuidador'}". Como actualmente estás actuando como "${activeCaregiver?.name || 'Cuidador'}", solo esa persona o el Administrador con PIN pueden deshacerla.`
      });
      setPendingAction(() => () => {
        markDoseStatus(medId, timeSlot, slotLabel, 'pendiente');
      });
      setShowPinModal(true);
      return;
    }
    markDoseStatus(medId, timeSlot, slotLabel, 'pendiente');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const times = formScheduleTimes
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const labels = formScheduleLabels
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (editingMed) {
      updateMedication(editingMed.id, {
        name: formName,
        activeSubstance: formActiveSubstance,
        dose: formDose,
        form: formForm,
        scheduleTimes: times,
        scheduleLabels: labels,
        instructions: formInstructions,
        withFood: formWithFood,
        currentStock: Number(formStock),
        lowStockThreshold: Number(formLowStockThreshold),
        prescriptionRef: formPrescription,
      });
    } else {
      addMedication({
        name: formName,
        activeSubstance: formActiveSubstance,
        dose: formDose,
        form: formForm,
        scheduleTimes: times,
        scheduleLabels: labels,
        instructions: formInstructions,
        withFood: formWithFood,
        currentStock: Number(formStock),
        lowStockThreshold: Number(formLowStockThreshold),
        prescriptionRef: formPrescription,
        active: true,
        colorTheme: 'teal',
      });
    }
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Tratamiento Farmacológico
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight break-words">
            Medicación y Tomas Diarias
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pastillero interactivo, horarios con pauta de comida y control de recetas
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Segmented Mode Selector */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('today')}
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'today'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>Tomas de Hoy</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'catalog'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5 shrink-0" />
              <span>Catálogo ({patientMedications.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Fármaco</span>
          </button>
        </div>
      </div>

      {/* Friendly Caregiver Access Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/25 border border-blue-200/80 dark:border-blue-900/40 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
          <span className="text-slate-700 dark:text-slate-300">
            <strong>Pastillero libre:</strong> Cualquier cuidador registrado puede marcar las tomas diarias con 1 clic. El PIN de Administrador solo protege la creación, edición o borrado de tratamientos.
          </span>
        </div>
        <span className="self-start sm:self-auto text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 px-2.5 py-1 rounded-lg shrink-0">
          Tomas 1-Clic
        </span>
      </div>

      {/* Adherence KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Cumplimiento de Hoy
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 tabular-nums">
              {adherence}%
            </span>
            <span className="text-xs text-slate-500">
              ({takenCount} de {totalCount} tomas)
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
            <div 
              className="bg-teal-600 dark:bg-teal-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${adherence}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Fármacos en Tratamiento Activo
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {patientMedications.filter(m => m.active).length}
            </span>
            <span className="text-xs text-slate-500">prescritos</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Pautados por médico de atención primaria / especialista
          </div>
        </div>

      </div>

      {/* Main Content: Today's Timeline OR Master Catalog */}
      {activeTab === 'today' ? (
        
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm min-w-0 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Pastillero y Horario de Tomas (Hoy)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pulsar sobre el botón para confirmar la toma administrada
              </p>
            </div>

            {/* Quick Caregiver Selector */}
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-2">
                Cuidador en turno:
              </span>
              {caregivers.map(cg => {
                const isCurrent = (activeCaregiver?.id === cg.id) || (!activeCaregiver && cg.id === caregivers[0]?.id);
                return (
                  <button
                    key={cg.id}
                    type="button"
                    onClick={() => setActiveCaregiverId(cg.id)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-white' : 'bg-blue-500'}`} />
                    <span>{cg.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            {allTodayDoses.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No hay fármacos pautados para hoy. Pulsa &quot;Nuevo Fármaco&quot; para añadir medicación.
              </div>
            ) : (
              allTodayDoses.map((item, idx) => {
                const isTaken = item.status === 'tomada';
                const isOmitted = item.status === 'omitida';

                return (
                  <div
                    key={`${item.med.id}-${item.timeSlot}-${idx}`}
                    className={`p-3.5 sm:p-4 rounded-2xl transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 sm:gap-4 min-w-0 ${
                      isTaken
                        ? 'bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80'
                        : isOmitted
                          ? 'bg-slate-100 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700 opacity-60'
                          : 'bg-emerald-500/15 dark:bg-emerald-950/40 border-2 border-emerald-500 shadow-md ring-1 ring-emerald-400/40'
                    }`}
                  >
                    
                    {/* Time & Drug Info */}
                    <div className="flex items-start sm:items-center gap-3 w-full min-w-0">
                      <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 font-mono text-xs font-bold border tabular-nums ${
                        isTaken
                          ? 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                          : 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      }`}>
                        <span>{item.timeSlot}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span className={`font-extrabold text-sm sm:text-base break-words ${
                            isTaken 
                              ? 'line-through text-slate-400 dark:text-slate-500' 
                              : 'text-rose-700 dark:text-rose-400'
                          }`}>
                            {item.med.name}
                          </span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700 shrink-0">
                            {item.med.dose}
                          </span>
                          <span className="text-xs text-slate-400">
                            ({item.med.form})
                          </span>

                          {!isTaken && !isOmitted && (
                            <span className="bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs animate-pulse">
                              ¡PENDIENTE!
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{item.slotLabel}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-blue-600 dark:text-blue-400">{item.med.withFood}</span>
                          {item.med.instructions && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="break-words">{item.med.instructions}</span>
                            </>
                          )}
                        </div>

                        {isTaken && item.takenAt && (
                          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span className="break-words">
                              Administrada a las {new Date(item.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} por {item.takenBy || 'Cuidador'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto shrink-0">
                      {isTaken ? (
                        <>
                          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/60 py-1 px-2.5 rounded-lg border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>Tomada</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => handleUndoDose(item.med.id, item.timeSlot, item.slotLabel, item.takenBy)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Deshacer / Volver a pendiente"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => markDoseStatus(item.med.id, item.timeSlot, item.slotLabel, 'tomada', activeCaregiver?.name || caregivers[0]?.name || 'Familiar')}
                            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 text-center"
                          >
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span>Marcar tomada ({activeCaregiver?.name || 'Familiar'})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => markDoseStatus(item.med.id, item.timeSlot, item.slotLabel, 'omitida', activeCaregiver?.name || caregivers[0]?.name || 'Familiar')}
                            className="px-2.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                            title="Omitir toma hoy por indicación médica"
                          >
                            Omitir
                          </button>
                        </>
                      )}
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

      ) : (

        /* Master Catalog View */
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm min-w-0 overflow-hidden">
          
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
            <div className="relative flex-1 sm:max-w-sm min-w-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por fármaco o principio activo..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400">
              Mostrando {filteredCatalog.length} medicamentos en tratamiento
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCatalog.length === 0 ? (
              <div className="col-span-full text-center py-10 text-slate-400 text-xs">
                No se encontraron medicamentos.
              </div>
            ) : (
              filteredCatalog.map(med => {
                return (
                  <div
                    key={med.id}
                    className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between min-w-0 break-words"
                  >
                    <div className="min-w-0">
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-extrabold text-base text-slate-900 dark:text-white break-words">
                              {med.name}
                            </h4>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shrink-0">
                              {med.dose}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">
                            {med.activeSubstance} · {med.form}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(med)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Editar fármaco"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePrompt(med.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Eliminar fármaco (requiere Admin)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Instructions and pauta */}
                      <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 my-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 break-words">
                        <div>
                          <strong className="text-slate-800 dark:text-slate-200">Horarios:</strong>{' '}
                          {(med.scheduleTimes || []).length > 0 ? (
                            <span>{(med.scheduleTimes || []).join(', ')} ({(med.scheduleLabels || []).join(', ')})</span>
                          ) : (
                            <span>Solo si precisa (rescate)</span>
                          )}
                        </div>
                        <div>
                          <strong className="text-slate-800 dark:text-slate-200">Pauta con comida:</strong>{' '}
                          <span>{med.withFood}</span>
                        </div>
                        {med.instructions && (
                          <div>
                            <strong className="text-slate-800 dark:text-slate-200">Indicaciones:</strong>{' '}
                            <span>{med.instructions}</span>
                          </div>
                        )}
                        <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                          {med.prescriptionRef}
                        </div>
                      </div>
                    </div>

                    {/* Active Treatment Status */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Pill className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span className="font-medium">Tratamiento activo</span>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-900/40">
                        Pauta prescrita
                      </span>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

      )}

      {/* Add / Edit Medication Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Pill className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-base truncate">
                    {editingMed ? 'Editar Medicamento' : 'Añadir Nuevo Medicamento'}
                  </h3>
                  <p className="text-xs text-slate-500 truncate">Paciente: {activePatient.nickname || activePatient.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Name & Active Substance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre Comercial *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ej: Enalapril, Sintrom..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Principio Activo
                  </label>
                  <input
                    type="text"
                    value={formActiveSubstance}
                    onChange={(e) => setFormActiveSubstance(e.target.value)}
                    placeholder="Ej: Enalapril maleato"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Dose & Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Dosis *
                  </label>
                  <input
                    type="text"
                    required
                    value={formDose}
                    onChange={(e) => setFormDose(e.target.value)}
                    placeholder="Ej: 20 mg, 850 mg, 1 g, 5 gotas"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Presentación
                  </label>
                  <select
                    value={formForm}
                    onChange={(e) => setFormForm(e.target.value as MedicationForm)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Comprimido">Comprimido</option>
                    <option value="Cápsula">Cápsula</option>
                    <option value="Gotas">Gotas</option>
                    <option value="Sobres">Sobres</option>
                    <option value="Inhalador">Inhalador</option>
                    <option value="Parche">Parche</option>
                    <option value="Inyectable">Inyectable</option>
                    <option value="Jarabe">Jarabe</option>
                  </select>
                </div>
              </div>

              {/* Schedule Times and Labels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Horas de toma (separadas por comas)
                  </label>
                  <input
                    type="text"
                    value={formScheduleTimes}
                    onChange={(e) => setFormScheduleTimes(e.target.value)}
                    placeholder="08:30, 20:30 (vacío si es rescate)"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                  <span className="text-[10px] text-slate-400">Ejemplo: 08:30 o 09:00, 21:00</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Etiquetas de horario
                  </label>
                  <input
                    type="text"
                    value={formScheduleLabels}
                    onChange={(e) => setFormScheduleLabels(e.target.value)}
                    placeholder="Desayuno, Cena"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Food Instruction */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pauta con alimentos
                </label>
                <select
                  value={formWithFood}
                  onChange={(e) => setFormWithFood(e.target.value as FoodInstruction)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="En ayunas">En ayunas</option>
                  <option value="Con alimentos">Con alimentos</option>
                  <option value="Después de comer">Después de comer</option>
                  <option value="Indiferente">Indiferente</option>
                </select>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Instrucciones especiales para el paciente o cuidador
                </label>
                <textarea
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  placeholder="Ej: Tomar con medio vaso de agua. No acostarse inmediatamente tras la toma."
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              {/* Prescription reference */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Referencia de Receta Electrónica / Fecha de Renovación
                </label>
                <input
                  type="text"
                  value={formPrescription}
                  onChange={(e) => setFormPrescription(e.target.value)}
                  placeholder="Ej: Receta Electrónica (Caduca: 20/01/2027)"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors"
                >
                  {editingMed ? 'Guardar Cambios' : 'Añadir Fármaco'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {medToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-rose-200 dark:border-rose-900 text-slate-900 dark:text-slate-100">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base">¿Eliminar este fármaco?</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
              Esta acción borrará el medicamento y todos los registros de tomas asociadas del historial del paciente.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setMedToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
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

      {/* Admin Unlock Modal */}
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
        title={pinModalDetails.title}
        description={pinModalDetails.description}
      />

    </div>
  );
};
