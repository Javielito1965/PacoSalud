import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getOMSMeta, classifyBloodPressure } from '../utils/omsBloodPressure';
import { getLocalDateString } from '../utils/safeStorage';
import { 
  Heart, 
  Pill, 
  Calendar, 
  AlertTriangle, 
  Clock, 
  ChevronRight, 
  FileText, 
  Check, 
  Camera,
  Activity,
  RotateCcw,
  Sparkles,
  Plus
} from 'lucide-react';
import { NavTab } from './Header';
import { ChangePatientPhotoModal } from './ChangePatientPhotoModal';
import { AdminPinModal } from './AdminPinModal';
import { MonthlyBPTrendChart } from './MonthlyBPTrendChart';

interface Props {
  onNavigate: (tab: NavTab) => void;
  onOpenNewBPModal: () => void;
  onOpenReport: () => void;
  onOpenDeployGuide?: () => void;
}

export const DashboardSection: React.FC<Props> = ({ 
  onNavigate, 
  onOpenNewBPModal, 
  onOpenReport 
}) => {
  const { 
    activePatient, 
    updatePatient,
    patientReadings, 
    patientMedications, 
    todayLogs, 
    markDoseStatus, 
    patientAppointments, 
    caregivers,
    activeCaregiver,
    canModifyReadingOrDose
  } = useApp();

  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedCaregiverName, setSelectedCaregiverName] = useState<string>(caregivers[0]?.name || 'Familiar');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [pinModalDetails, setPinModalDetails] = useState<{ title: string; description: string }>({
    title: 'Acción Protegida',
    description: 'Se requiere el PIN de administración para realizar esta acción.'
  });

  const handleUndoDose = (medId: string, timeSlot: string, slotLabel: string, takenBy: string | null) => {
    const allowed = canModifyReadingOrDose(takenBy || '');
    if (!allowed) {
      setPinModalDetails({
        title: 'Modificación de Toma Protegida',
        description: `Esta dosis fue administrada por "${takenBy || 'otro cuidador'}". Como actualmente estás actuando como "${activeCaregiver?.name || selectedCaregiverName}", solo esa persona o el Administrador con PIN pueden deshacerla.`
      });
      setPendingAction(() => () => {
        markDoseStatus(medId, timeSlot, slotLabel, 'pendiente');
      });
      setShowPinModal(true);
      return;
    }
    markDoseStatus(medId, timeSlot, slotLabel, 'pendiente');
  };

  // Latest BP reading
  const latestBP = patientReadings[0];
  const latestBPMeta = latestBP ? getOMSMeta(latestBP.classification) : null;

  // 7-day average of blood pressure & heart rate (ppm)
  const avg7Days = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const cutoffStr = getLocalDateString(cutoff);
    const filtered = patientReadings.filter(r => r.date >= cutoffStr);

    const list = filtered.length > 0 ? filtered : patientReadings.slice(0, 7);
    if (list.length === 0) return null;

    const sumSys = list.reduce((acc, r) => acc + r.systolic, 0);
    const sumDia = list.reduce((acc, r) => acc + r.diastolic, 0);
    const sumPulse = list.reduce((acc, r) => acc + r.pulse, 0);

    const avgSys = Math.round(sumSys / list.length);
    const avgDia = Math.round(sumDia / list.length);
    const avgPulse = Math.round(sumPulse / list.length);
    const meta = getOMSMeta(classifyBloodPressure(avgSys, avgDia));

    return {
      sys: avgSys,
      dia: avgDia,
      pulse: avgPulse,
      count: list.length,
      meta
    };
  }, [patientReadings]);

  // Blood pressure readings from the last 3 days
  const last3DaysReadings = useMemo(() => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const cutoffStr = getLocalDateString(threeDaysAgo);

    const filtered = patientReadings.filter(r => r.date >= cutoffStr);
    // If fewer than 3 readings in the last 3 days, show up to 4 most recent to keep the view informative
    if (filtered.length < 3 && patientReadings.length > 0) {
      return patientReadings.slice(0, 4);
    }
    return filtered;
  }, [patientReadings]);

  // Upcoming appointment
  const upcomingAppointments = patientAppointments.filter(a => a.status === 'pendiente');
  const nextAppointment = upcomingAppointments[0];

  const daysUntilNextApt = nextAppointment ? Math.ceil(
    (new Date(nextAppointment.date).getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24)
  ) : null;

  // Today's scheduled doses
  const allScheduledDoses: Array<{
    medId: string;
    medName: string;
    dose: string;
    timeSlot: string;
    slotLabel: string;
    withFood: string;
    status: 'tomada' | 'pendiente' | 'omitida' | 'pospuesta';
    takenAt: string | null;
    takenBy: string | null;
  }> = [];

  (patientMedications || []).filter(m => m && m.active).forEach(med => {
    (med.scheduleTimes || []).forEach((time, index) => {
      const label = (med.scheduleLabels || [])[index] || 'Toma';
      const log = todayLogs.find(l => l.medicationId === med.id && l.timeSlot === time);
      allScheduledDoses.push({
        medId: med.id,
        medName: med.name,
        dose: med.dose,
        timeSlot: time,
        slotLabel: label,
        withFood: med.withFood,
        status: log ? log.status : 'pendiente',
        takenAt: log ? log.takenAt : null,
        takenBy: log ? log.takenBy : null,
      });
    });
  });

  // Sort by time
  allScheduledDoses.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

  const completedDosesCount = allScheduledDoses.filter(d => d.status === 'tomada').length;
  const totalDosesCount = allScheduledDoses.length;
  const adherencePercent = totalDosesCount > 0 ? Math.round((completedDosesCount / totalDosesCount) * 100) : 100;
  const pendingDoses = allScheduledDoses.filter(d => d.status === 'pendiente');

  const formatShortDate = (dateStr: string) => {
    const today = getLocalDateString();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = getLocalDateString(yesterdayDate);

    if (dateStr === today) return 'Hoy';
    if (dateStr === yesterday) return 'Ayer';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return dateStr;
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-150 min-w-0 w-full">
      
      {/* 1. Welcoming Mobile-Friendly Patient Identity Hero Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-3.5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        
        {/* Soft background tint accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 dark:bg-teal-400/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 sm:gap-4 relative z-10 min-w-0">
          
          {/* Identity with Photo Picker */}
          <div className="flex items-center gap-3 sm:gap-5 w-full sm:w-auto min-w-0">
            <div className="relative group shrink-0">
              <button
                type="button"
                onClick={() => setShowPhotoModal(true)}
                className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-teal-100 dark:bg-teal-950 border-2 border-teal-500/30 shadow-md group-hover:border-teal-500 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/50 block text-left"
                title="Pulsar para cambiar la foto del paciente"
              >
                {activePatient?.avatar ? (
                  <img 
                    src={activePatient.avatar} 
                    alt={activePatient.name} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-2xl text-teal-700 dark:text-teal-300">
                    {activePatient?.name?.charAt(0) || 'P'}
                  </div>
                )}

                {/* Hover / Tap Overlay */}
                <div className="absolute inset-0 bg-slate-950/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold gap-0.5">
                  <Camera className="w-4 h-4 text-white" />
                  <span>Cambiar</span>
                </div>
              </button>

              {/* Dedicated mini camera button */}
              <button
                type="button"
                onClick={() => setShowPhotoModal(true)}
                className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-xs border-2 border-white dark:border-slate-900 transition-transform active:scale-90"
                title="Cambiar fotografía del paciente"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                <span className="text-[11px] font-bold px-2 py-0.2 rounded-md bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800 max-w-full truncate">
                  {activePatient?.nickname || activePatient?.name}
                </span>
                <span className="text-[11px] text-slate-400 font-mono truncate max-w-full">
                  {activePatient?.dniSip}
                </span>
              </div>

              <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight break-words leading-snug">
                {activePatient?.name}
              </h1>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span>{activePatient?.age} años</span>
                <span aria-hidden="true">·</span>
                <span>Grupo: <strong>{activePatient?.bloodType}</strong></span>
                <span aria-hidden="true">·</span>
                <span className="break-words">{activePatient?.healthCenter}</span>
              </div>

              {(activePatient?.allergies?.length ?? 0) > 0 && (
                <div className="flex items-start gap-1 text-[11px] text-rose-700 dark:text-rose-400 font-medium mt-1 min-w-0">
                  <AlertTriangle className="w-3 h-3 shrink-0 text-rose-600 mt-0.5" />
                  <span className="break-words">Alergias: <strong>{activePatient.allergies?.join(', ')}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="w-full sm:w-auto flex flex-wrap sm:flex-nowrap items-center gap-2 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onOpenNewBPModal}
              className="flex-1 min-w-[125px] sm:flex-none px-3 sm:px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all whitespace-nowrap"
            >
              <Heart className="w-3.5 h-3.5 fill-white shrink-0" />
              <span>Tomar Tensión</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('medicacion')}
              className="flex-1 min-w-[125px] sm:flex-none px-3 sm:px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all whitespace-nowrap"
            >
              <Pill className="w-3.5 h-3.5 shrink-0" />
              <span>Pastillero ({pendingDoses.length})</span>
            </button>

            <button
              type="button"
              onClick={onOpenReport}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center border border-slate-200 dark:border-slate-700 transition-colors shrink-0"
              title="Generar informe para el médico"
            >
              <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            </button>
          </div>

        </div>

      </div>

      {/* 2. Key Medical Metrics: Última Tensión, Media 7 Días, Tomas de Hoy, Próxima Cita */}
      <div className="grid grid-cols-1 min-[370px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Metric 1: Última Tensión y Pulsaciones */}
        <div 
          onClick={() => onNavigate('tension')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group min-w-0 overflow-hidden"
        >
          <div className="flex items-center justify-between gap-1.5 mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              Última Tensión
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform shrink-0">
              <Heart className="w-3.5 h-3.5" />
            </div>
          </div>

          {latestBP ? (
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-1 mb-1">
                <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                  {latestBP.systolic}/{latestBP.diastolic}
                </span>
                <span className="text-[10px] text-slate-500">mmHg</span>
              </div>

              {/* Pulsaciones destacadas */}
              <div className="flex flex-wrap items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 mb-1.5">
                <Activity className="w-3.5 h-3.5 shrink-0" />
                <span className="tabular-nums">{latestBP.pulse} ppm</span>
                <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">(Pulsaciones)</span>
              </div>

              {latestBPMeta && (
                <div className={`text-[10px] font-semibold py-0.5 px-2 rounded-lg inline-flex items-center max-w-full break-words leading-tight ${latestBPMeta.badgeClass}`}>
                  <span>{latestBPMeta.label}</span>
                </div>
              )}

              <div className="text-[10px] text-slate-400 mt-2 truncate">
                {latestBP.time} · por {latestBP.takenBy}
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 py-3">
              Sin registros. Pulsa para anotar.
            </div>
          )}
        </div>

        {/* Metric 2: Media 7 Días (Casilla Informativa solicitada por el usuario) */}
        <div 
          onClick={() => onNavigate('tension')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-teal-200/80 dark:border-teal-900/60 shadow-xs hover:border-teal-400 dark:hover:border-teal-700 transition-all cursor-pointer group bg-gradient-to-br from-white to-teal-50/30 dark:from-slate-900 dark:to-teal-950/20 min-w-0 overflow-hidden"
        >
          <div className="flex items-center justify-between gap-1.5 mb-2">
            <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider truncate">
              Media 7 Días
            </span>
            <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950/60 flex items-center justify-center text-teal-700 dark:text-teal-300 group-hover:scale-110 transition-transform shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          {avg7Days ? (
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-1 mb-1">
                <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                  {avg7Days.sys}/{avg7Days.dia}
                </span>
                <span className="text-[10px] text-slate-500">mmHg</span>
              </div>

              {/* Pulsaciones promedio */}
              <div className="flex flex-wrap items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 mb-1.5">
                <Activity className="w-3.5 h-3.5 shrink-0" />
                <span className="tabular-nums">{avg7Days.pulse} ppm</span>
                <span className="text-[10px] text-slate-400 font-normal">media</span>
              </div>

              <div className={`text-[10px] font-semibold py-0.5 px-2 rounded-lg inline-flex items-center max-w-full break-words leading-tight ${avg7Days.meta.badgeClass}`}>
                <span>{avg7Days.meta.label}</span>
              </div>

              <div className="text-[10px] text-slate-400 mt-2 truncate">
                Promedio de {avg7Days.count} tomas
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 py-3">
              Registra mediciones para calcular la media semanal.
            </div>
          )}
        </div>

        {/* Metric 3: Tomas de Hoy */}
        <div 
          onClick={() => onNavigate('medicacion')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group min-w-0 overflow-hidden"
        >
          <div className="flex items-center justify-between gap-1.5 mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              Tomas de Hoy
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform shrink-0">
              <Pill className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="flex flex-wrap items-baseline gap-1 mb-1">
            <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {completedDosesCount}/{totalDosesCount}
            </span>
            <span className="text-[10px] text-slate-500">tomas</span>
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400 ml-auto tabular-nums">
              {adherencePercent}%
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden my-2">
            <div 
              className="bg-teal-600 dark:bg-teal-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${adherencePercent}%` }}
            />
          </div>

          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-1">
            <span className={pendingDoses.length > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>
              {pendingDoses.length > 0 ? `⚠️ ${pendingDoses.length} pend.` : 'Todas tomadas'}
            </span>
            <span className="text-blue-600 dark:text-blue-400 font-bold group-hover:underline">Pastillero →</span>
          </div>
        </div>

        {/* Metric 4: Próxima Cita */}
        <div 
          onClick={() => onNavigate('citas')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group min-w-0 overflow-hidden"
        >
          <div className="flex items-center justify-between gap-1.5 mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              Próxima Cita
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform shrink-0">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>

          {nextAppointment ? (
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {nextAppointment.specialty}
              </div>
              <div className="text-[11px] text-slate-500 truncate mb-1.5">
                {nextAppointment.doctor}
              </div>

              <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 py-1 px-2 rounded-lg border border-amber-200 dark:border-amber-900/60 min-w-0">
                <Clock className="w-3 h-3 shrink-0 text-amber-600" />
                <span className="truncate">
                  {daysUntilNextApt === 0 ? '¡Hoy!' : daysUntilNextApt === 1 ? 'Mañana' : `En ${daysUntilNextApt} d`} ({nextAppointment.date.slice(5)})
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 py-3">
              No hay citas programadas.
            </div>
          )}
        </div>

      </div>

      {/* 2.5 Recharts Monthly Blood Pressure Trend Section */}
      <MonthlyBPTrendChart onNavigateToTension={() => onNavigate('tension')} />

      {/* 3. Main Split View: Pastillero de Hoy (con alerta llamativa en tomas pendientes) + Tomas de Tensión (3 últimos días) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Left Column: Today's Pillbox Timeline */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-3.5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm min-w-0 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Pill className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Pastillero de Hoy
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {pendingDoses.length > 0 ? `${pendingDoses.length} tomas pendientes por confirmar` : '¡Todas las tomas de hoy registradas!'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('medicacion')}
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 flex items-center gap-1 shrink-0"
            >
              <span>Ver todas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Caregiver Name Selector for Dose Administration */}
          {caregivers.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-3 text-xs">
              <span className="text-[11px] text-slate-400 shrink-0">Administra:</span>
              {caregivers.map(cg => (
                <button
                  key={cg.id}
                  type="button"
                  onClick={() => setSelectedCaregiverName(cg.name)}
                  className={`px-2 py-0.5 rounded-lg font-semibold text-[11px] shrink-0 transition-colors ${
                    selectedCaregiverName === cg.name
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {cg.name}
                </button>
              ))}
            </div>
          )}

          {/* Doses List with EYE-CATCHING visual contrast for pending doses as requested */}
          <div className="space-y-3">
            {allScheduledDoses.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No hay fármacos pautados para hoy.
              </div>
            ) : (
              allScheduledDoses.map((dose, idx) => {
                const isTaken = dose.status === 'tomada';
                
                return (
                  <div
                    key={`${dose.medId}-${dose.timeSlot}-${idx}`}
                    className={`p-3 sm:p-4 rounded-2xl transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 min-w-0 ${
                      isTaken
                        ? 'bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-200'
                        : /* STRIKING ALERT COMBINATION: Green background with bold urgent red accents */
                          'bg-emerald-500/15 dark:bg-emerald-950/40 border-2 border-emerald-500 shadow-md ring-1 ring-emerald-400/40'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 w-full sm:w-auto flex-1">
                      <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 font-mono text-xs font-bold border tabular-nums ${
                        isTaken
                          ? 'bg-white text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                          : 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      }`}>
                        <span>{dose.timeSlot}</span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`font-extrabold text-sm sm:text-base break-words ${
                            isTaken 
                              ? 'line-through text-slate-400 dark:text-slate-500' 
                              : 'text-rose-700 dark:text-rose-400'
                          }`}>
                            {dose.medName}
                          </span>
                          <span className="text-xs font-bold px-2 py-0.2 rounded-md bg-white/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700 shrink-0">
                            {dose.dose}
                          </span>

                          {/* Eye-catching badge when dose is NOT registered */}
                          {!isTaken && (
                            <span className="bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs animate-pulse shrink-0">
                              ¡PENDIENTE!
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{dose.slotLabel}</span>
                          <span aria-hidden="true">·</span>
                          <span>{dose.withFood}</span>
                        </div>

                        {isTaken && (
                          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1 flex items-start gap-1">
                            <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span className="break-words">
                              Tomada {dose.takenAt ? `a las ${new Date(dose.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''} por {dose.takenBy || 'Familiar'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="shrink-0 w-full sm:w-auto flex items-center justify-end gap-2">
                      {isTaken ? (
                        <button
                          type="button"
                          onClick={() => handleUndoDose(dose.medId, dose.timeSlot, dose.slotLabel, dose.takenBy)}
                          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-1 transition-colors"
                          title="Desmarcar / Volver a pendiente"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Deshacer</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => markDoseStatus(dose.medId, dose.timeSlot, dose.slotLabel, 'tomada', selectedCaregiverName)}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-4 h-4 stroke-[3] shrink-0" />
                          <span>Marcar como tomada</span>
                        </button>
                      )}
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Blood Pressure Readings from the last 3 days (Requested feature) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-3.5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between min-w-0 overflow-hidden">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <Heart className="w-4 h-4 fill-rose-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                    Tomas de Tensión (Últimos 3 días)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Historial reciente con pulsaciones y semáforo OMS
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenNewBPModal}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-transform active:scale-95 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva</span>
              </button>
            </div>

            {/* List of last 3 days readings */}
            <div className="space-y-2.5">
              {last3DaysReadings.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <p className="mb-2">No hay tomas de tensión registradas en los últimos 3 días.</p>
                  <button
                    type="button"
                    onClick={onOpenNewBPModal}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs"
                  >
                    Anotar Medición Ahora
                  </button>
                </div>
              ) : (
                last3DaysReadings.map(reading => {
                  const meta = getOMSMeta(reading.classification);
                  return (
                    <div
                      key={reading.id}
                      className="p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all flex items-center justify-between gap-2.5 text-xs min-w-0"
                    >
                      {/* Date & Moment */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-extrabold text-slate-900 dark:text-white">
                            {formatShortDate(reading.date)}
                          </span>
                          <span className="font-mono text-slate-400 text-[11px]">
                            {reading.time}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {reading.moment} · {reading.arm}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          Por: <strong className="text-slate-600 dark:text-slate-300 font-medium">{reading.takenBy}</strong>
                        </div>
                      </div>

                      {/* Values: Sys/Dia + PULSACIONES DESTACADAS */}
                      <div className="text-right shrink-0 max-w-[50%]">
                        <div className="flex items-baseline justify-end gap-1">
                          <span className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tabular-nums tracking-tight">
                            {reading.systolic}/{reading.diastolic}
                          </span>
                          <span className="text-[10px] text-slate-400">mmHg</span>
                        </div>

                        {/* Pulsaciones */}
                        <div className="flex items-center justify-end gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                          <Activity className="w-3 h-3 shrink-0" />
                          <span className="tabular-nums">{reading.pulse} ppm</span>
                        </div>

                        {/* WHO badge */}
                        <div className="mt-1">
                          <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md max-w-full truncate ${meta.badgeClass}`}>
                            {meta.label}
                          </span>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-400 text-[11px]">
              Mostrando {last3DaysReadings.length} tomas recientes
            </span>
            <button
              type="button"
              onClick={() => onNavigate('tension')}
              className="font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
            >
              <span>Ver gráfica e historial</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>

      {/* Change Patient Photo Modal */}
      <ChangePatientPhotoModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        patientId={activePatient?.id || ''}
        patientName={activePatient?.nickname || activePatient?.name || 'Familiar'}
        currentAvatar={activePatient?.avatar || ''}
        onSave={(newAvatar) => {
          if (activePatient?.id) {
            updatePatient(activePatient.id, { avatar: newAvatar });
          }
        }}
      />

      {/* Admin Unlock Modal for protected dose modifications */}
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
