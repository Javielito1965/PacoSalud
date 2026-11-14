import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { BloodPressureReading, MomentOfDay } from '../types';
import { classifyBloodPressure, getOMSMeta, OMS_STANDARDS } from '../utils/omsBloodPressure';
import { 
  Heart, 
  Plus, 
  Trash2, 
  Edit3, 
  FileText, 
  Search, 
  Filter, 
  TrendingUp, 
  Activity, 
  Info, 
  ShieldAlert, 
  Calendar, 
  Check, 
  X,
  Clock,
  Sparkles,
  Lock,
  User
} from 'lucide-react';
import { AdminPinModal } from './AdminPinModal';

interface Props {
  onOpenReport: () => void;
  isOpenModalDirectly?: boolean;
}

export const BloodPressureSection: React.FC<Props> = ({ onOpenReport, isOpenModalDirectly = false }) => {
  const { 
    activePatient, 
    patientReadings, 
    addBloodPressure, 
    updateBloodPressure, 
    deleteBloodPressure, 
    config, 
    caregivers,
    activeCaregiver,
    setActiveCaregiverId,
    canModifyReadingOrDose
  } = useApp();

  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d' | 'all'>('14d');
  const [momentFilter, setMomentFilter] = useState<string>('all');
  const [searchNotes, setSearchNotes] = useState('');
  const [showAddModal, setShowAddModal] = useState(isOpenModalDirectly);
  const [editingReading, setEditingReading] = useState<BloodPressureReading | null>(null);
  const [readingToDelete, setReadingToDelete] = useState<string | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [pinModalDetails, setPinModalDetails] = useState<{ title: string; description: string }>({
    title: 'Acción Protegida de Administrador',
    description: 'Se requiere el PIN de administración para realizar esta acción.'
  });
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Form state
  const defaultDate = new Date().toISOString().split('T')[0];
  const now = new Date();
  const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const [formDate, setFormDate] = useState(defaultDate);
  const [formTime, setFormTime] = useState(defaultTime);
  const [formSystolic, setFormSystolic] = useState<number>(125);
  const [formDiastolic, setFormDiastolic] = useState<number>(80);
  const [formPulse, setFormPulse] = useState<number>(70);
  const [formArm, setFormArm] = useState<'Izquierdo' | 'Derecho'>('Izquierdo');
  const [formMoment, setFormMoment] = useState<MomentOfDay>('En ayunas / Mañana');
  const [formNotes, setFormNotes] = useState('');
  const [formTakenBy, setFormTakenBy] = useState(activeCaregiver?.name || caregivers[0]?.name || 'Familiar');

  // Live preview of classification in form
  const liveClassification = useMemo(() => {
    return classifyBloodPressure(Number(formSystolic) || 120, Number(formDiastolic) || 80);
  }, [formSystolic, formDiastolic]);
  const liveMeta = getOMSMeta(liveClassification);

  // Filtered readings for table and chart
  const filteredReadings = useMemo(() => {
    let list = [...patientReadings];

    // Filter by time range
    if (timeRange !== 'all') {
      const days = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const cutoffStr = cutoff.toISOString().split('T')[0];
      list = list.filter(r => r.date >= cutoffStr);
    }

    // Filter by moment
    if (momentFilter !== 'all') {
      list = list.filter(r => r.moment === momentFilter);
    }

    // Filter by search notes
    if (searchNotes.trim()) {
      const q = searchNotes.toLowerCase();
      list = list.filter(r => 
        (r.notes || '').toLowerCase().includes(q) || 
        (r.takenBy || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [patientReadings, timeRange, momentFilter, searchNotes]);

  // Statistics
  const stats = useMemo(() => {
    if (filteredReadings.length === 0) {
      return { avgSys: 0, avgDia: 0, avgPulse: 0, optimalPct: 0, count: 0 };
    }
    const sumSys = filteredReadings.reduce((acc, r) => acc + r.systolic, 0);
    const sumDia = filteredReadings.reduce((acc, r) => acc + r.diastolic, 0);
    const sumPulse = filteredReadings.reduce((acc, r) => acc + r.pulse, 0);
    const normalCount = filteredReadings.filter(r => r.classification === 'optima' || r.classification === 'normal').length;

    return {
      avgSys: Math.round(sumSys / filteredReadings.length),
      avgDia: Math.round(sumDia / filteredReadings.length),
      avgPulse: Math.round(sumPulse / filteredReadings.length),
      optimalPct: Math.round((normalCount / filteredReadings.length) * 100),
      count: filteredReadings.length,
    };
  }, [filteredReadings]);

  // Chronological readings for the chart (oldest to newest)
  const chartReadings = useMemo(() => {
    return [...filteredReadings].reverse();
  }, [filteredReadings]);

  // Chart dimensions & scaling
  const chartWidth = 720;
  const chartHeight = 220;
  const paddingX = 40;
  const paddingY = 24;

  const minVal = 40;
  const maxVal = 200;

  const getY = (val: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    const range = maxVal - minVal;
    return chartHeight - paddingY - ((clamped - minVal) / range) * (chartHeight - paddingY * 2);
  };

  const getX = (index: number, total: number) => {
    if (total <= 1) return chartWidth / 2;
    return paddingX + (index / (total - 1)) * (chartWidth - paddingX * 2);
  };

  // SVG Paths
  const systolicPath = useMemo(() => {
    if (chartReadings.length === 0) return '';
    return chartReadings.map((r, i) => `${i === 0 ? 'M' : 'L'} ${getX(i, chartReadings.length)} ${getY(r.systolic)}`).join(' ');
  }, [chartReadings]);

  const diastolicPath = useMemo(() => {
    if (chartReadings.length === 0) return '';
    return chartReadings.map((r, i) => `${i === 0 ? 'M' : 'L'} ${getX(i, chartReadings.length)} ${getY(r.diastolic)}`).join(' ');
  }, [chartReadings]);

  const pulsePath = useMemo(() => {
    if (chartReadings.length === 0) return '';
    return chartReadings.map((r, i) => `${i === 0 ? 'M' : 'L'} ${getX(i, chartReadings.length)} ${getY(r.pulse)}`).join(' ');
  }, [chartReadings]);

  const handleOpenAdd = () => {
    setEditingReading(null);
    setFormDate(defaultDate);
    setFormTime(defaultTime);
    setFormSystolic(125);
    setFormDiastolic(80);
    setFormPulse(70);
    setFormArm('Izquierdo');
    setFormMoment('En ayunas / Mañana');
    setFormNotes('');
    setFormTakenBy(activeCaregiver?.name || caregivers[0]?.name || 'Familiar');
    setShowAddModal(true);
  };

  const handleOpenEdit = (reading: BloodPressureReading) => {
    const allowed = canModifyReadingOrDose(reading.takenBy);
    if (!allowed) {
      setPinModalDetails({
        title: 'Modificación Protegida por Seguridad',
        description: `Esta medición fue registrada por "${reading.takenBy}". Como actualmente estás actuando como "${activeCaregiver?.name || 'Cuidador'}", solo esa persona o el Administrador con PIN pueden modificarla.`
      });
      setPendingAction(() => () => {
        openEditDirect(reading);
      });
      setShowPinModal(true);
      return;
    }
    openEditDirect(reading);
  };

  const openEditDirect = (reading: BloodPressureReading) => {
    setEditingReading(reading);
    setFormDate(reading.date);
    setFormTime(reading.time);
    setFormSystolic(reading.systolic);
    setFormDiastolic(reading.diastolic);
    setFormPulse(reading.pulse);
    setFormArm(reading.arm);
    setFormMoment(reading.moment);
    setFormNotes(reading.notes);
    setFormTakenBy(reading.takenBy);
    setShowAddModal(true);
  };

  const handleDeletePrompt = (reading: BloodPressureReading) => {
    const allowed = canModifyReadingOrDose(reading.takenBy);
    if (!allowed) {
      setPinModalDetails({
        title: 'Eliminación Protegida por Seguridad',
        description: `Esta medición fue registrada por "${reading.takenBy}". Como actualmente estás actuando como "${activeCaregiver?.name || 'Cuidador'}", solo esa persona o el Administrador con PIN pueden eliminarla.`
      });
      setPendingAction(() => () => {
        setReadingToDelete(reading.id);
      });
      setShowPinModal(true);
      return;
    }
    setReadingToDelete(reading.id);
  };

  const confirmDelete = () => {
    if (readingToDelete) {
      deleteBloodPressure(readingToDelete);
      setReadingToDelete(null);
    }
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingReading) {
      updateBloodPressure(editingReading.id, {
        date: formDate,
        time: formTime,
        systolic: Number(formSystolic),
        diastolic: Number(formDiastolic),
        pulse: Number(formPulse),
        arm: formArm,
        moment: formMoment,
        notes: formNotes,
        takenBy: formTakenBy,
      });
    } else {
      addBloodPressure({
        date: formDate,
        time: formTime,
        systolic: Number(formSystolic),
        diastolic: Number(formDiastolic),
        pulse: Number(formPulse),
        arm: formArm,
        moment: formMoment,
        notes: formNotes,
        takenBy: formTakenBy,
      });
    }
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Control Cardiovascular
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight break-words">
            Tensión Arterial y Pulso
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Registro con semáforo según directrices OMS/ESC-ESH y gráfica evolutiva
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onOpenReport}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-2 transition-colors border border-slate-200 dark:border-slate-700"
          >
            <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Informe</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Medición</span>
          </button>
        </div>
      </div>

      {/* Caregiver Switcher & Permissions Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/25 border border-rose-200/80 dark:border-rose-900/40 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
            <User className="w-4 h-4 text-rose-600" />
            <span>Registrando como:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {caregivers.map(cg => {
              const isCurrent = cg.id === activeCaregiver?.id;
              return (
                <button
                  key={cg.id}
                  type="button"
                  onClick={() => setActiveCaregiverId(cg.id)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isCurrent
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-white' : 'bg-rose-500'}`} />
                  <span>{cg.name}</span>
                  <span className="text-[10px] opacity-80 font-normal">({cg.role === 'admin' ? 'Admin' : cg.relation})</span>
                </button>
              );
            })}
          </div>
        </div>
        <span className="self-start sm:self-auto text-[11px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/50 px-2.5 py-1 rounded-lg shrink-0">
          {activeCaregiver?.role === 'admin' || config.isAdminUnlocked ? '👑 Permiso Total (Admin)' : '👤 Puedes editar tus tomas'}
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 min-[370px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs min-w-0">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Media Sistólica (Alta)
          </div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {stats.avgSys || '--'}
            </span>
            <span className="text-xs text-slate-500">mmHg</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Objetivo clínico: &lt; 130 mmHg
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs min-w-0">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Media Diastólica (Baja)
          </div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {stats.avgDia || '--'}
            </span>
            <span className="text-xs text-slate-500">mmHg</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Objetivo clínico: &lt; 85 mmHg
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs min-w-0">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Frecuencia Cardíaca
          </div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {stats.avgPulse || '--'}
            </span>
            <span className="text-xs text-slate-500">ppm</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Pulso promedio en reposo
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs min-w-0">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Lecturas en Rango Normal
          </div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl sm:text-2xl font-extrabold text-teal-600 dark:text-teal-400 tabular-nums">
              {stats.optimalPct}%
            </span>
            <span className="text-xs text-slate-500">({stats.count} tomas)</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Según estándar OMS
          </div>
        </div>

      </div>

      {/* Interactive Evolution Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm min-w-0 overflow-hidden">
        
        {/* Chart controls & range buttons (functional segmented controls per frontend constitution) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div className="min-w-0">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Evolución Histórica
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tendencia temporal de Sistólica, Diastólica y Pulso
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full sm:w-auto">
            {(['7d', '14d', '30d', 'all'] as const).map(range => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-colors text-center ${
                  timeRange === range
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {range === '7d' ? '7 días' : range === '14d' ? '14 días' : range === '30d' ? '30 días' : 'Todo'}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600 dark:text-slate-400 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 bg-rose-500 rounded-full inline-block" />
            <span className="font-medium">Sistólica (Alta)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 bg-teal-500 rounded-full inline-block" />
            <span className="font-medium">Diastólica (Baja)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 bg-amber-500 rounded-full inline-block border-t border-dashed" />
            <span className="font-medium">Pulso (ppm)</span>
          </div>
          <div className="flex items-center gap-2 sm:ml-auto text-slate-400 text-[11px]">
            <span>Líneas límite OMS: 140 / 90 mmHg</span>
          </div>
        </div>

        {/* SVG Chart */}
        {chartReadings.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-xs text-slate-500">
            No hay lecturas registradas en este período.
          </div>
        ) : (
          <div className="relative w-full overflow-x-auto pb-2">
            <svg 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
              className="w-full h-56 min-w-[500px] overflow-visible"
            >
              <defs>
                <linearGradient id="sysGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Reference Lines */}
              {[180, 140, 120, 90, 60].map(val => (
                <g key={val}>
                  <line
                    x1={paddingX}
                    y1={getY(val)}
                    x2={chartWidth - paddingX}
                    y2={getY(val)}
                    stroke="currentColor"
                    strokeDasharray={val === 140 || val === 90 ? '4 4' : '2 2'}
                    className={val === 140 ? 'text-rose-300 dark:text-rose-900/60' : 'text-slate-200 dark:text-slate-800'}
                    strokeWidth={val === 140 ? 1.5 : 1}
                  />
                  <text
                    x={paddingX - 8}
                    y={getY(val) + 3}
                    textAnchor="end"
                    className="text-[10px] fill-slate-400 font-mono"
                  >
                    {val}
                  </text>
                </g>
              ))}

              {/* Curve Lines */}
              <path
                d={systolicPath}
                fill="none"
                stroke="#e11d48"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={diastolicPath}
                fill="none"
                stroke="#0d9488"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={pulsePath}
                fill="none"
                stroke="#d97706"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive Points */}
              {chartReadings.map((r, i) => {
                const cx = getX(i, chartReadings.length);
                const cySys = getY(r.systolic);
                const cyDia = getY(r.diastolic);
                const isHovered = hoveredPointIndex === i;

                return (
                  <g key={r.id} className="cursor-pointer">
                    {/* Vertical hover guide */}
                    {isHovered && (
                      <line
                        x1={cx}
                        y1={paddingY}
                        x2={cx}
                        y2={chartHeight - paddingY}
                        stroke="#94a3b8"
                        strokeWidth={1}
                        strokeDasharray="2 2"
                      />
                    )}

                    {/* Systolic dot */}
                    <circle
                      cx={cx}
                      cy={cySys}
                      r={isHovered ? 6 : 4}
                      fill="#e11d48"
                      stroke="#ffffff"
                      strokeWidth={2}
                      className="transition-all"
                      onMouseEnter={() => setHoveredPointIndex(i)}
                      onMouseLeave={() => setHoveredPointIndex(null)}
                    />

                    {/* Diastolic dot */}
                    <circle
                      cx={cx}
                      cy={cyDia}
                      r={isHovered ? 6 : 4}
                      fill="#0d9488"
                      stroke="#ffffff"
                      strokeWidth={2}
                      className="transition-all"
                      onMouseEnter={() => setHoveredPointIndex(i)}
                      onMouseLeave={() => setHoveredPointIndex(null)}
                    />

                    {/* X-axis date labels */}
                    <text
                      x={cx}
                      y={chartHeight - 6}
                      textAnchor="middle"
                      className="text-[9px] fill-slate-400 font-mono"
                    >
                      {r.date.slice(5)}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Card */}
            {hoveredPointIndex !== null && chartReadings[hoveredPointIndex] && (
              <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {chartReadings[hoveredPointIndex].date} ({chartReadings[hoveredPointIndex].time})
                  </span>
                  <span className="font-mono tabular-nums text-rose-600 dark:text-rose-400 font-bold">
                    {chartReadings[hoveredPointIndex].systolic}/{chartReadings[hoveredPointIndex].diastolic} mmHg
                  </span>
                  <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400">
                    {chartReadings[hoveredPointIndex].pulse} bpm
                  </span>
                  <span className="text-slate-500">
                    {chartReadings[hoveredPointIndex].moment} · Brazo {chartReadings[hoveredPointIndex].arm}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {chartReadings[hoveredPointIndex].notes || 'Sin notas especiales'}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* OMS / WHO Classification Guide Legend */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm min-w-0">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Semáforo de Referencia Clínica OMS / Guía ESH
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(Object.keys(OMS_STANDARDS) as Array<keyof typeof OMS_STANDARDS>).map(catKey => {
            const item = OMS_STANDARDS[catKey];
            return (
              <div
                key={catKey}
                className={`p-3 rounded-2xl border ${item.bgLightClass} ${item.borderColorClass} text-xs min-w-0`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-bold ${item.colorClass}`}>{item.label}</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Table of Records with CRUD */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm min-w-0 overflow-hidden">
        
        {/* Table Filters & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-5">
          <div className="relative flex-1 md:max-w-sm min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchNotes}
              onChange={(e) => setSearchNotes(e.target.value)}
              placeholder="Buscar por notas o cuidador..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={momentFilter}
              onChange={(e) => setMomentFilter(e.target.value)}
              className="flex-1 md:flex-none text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none min-w-0"
            >
              <option value="all">Todos los momentos del día</option>
              <option value="En ayunas / Mañana">En ayunas / Mañana</option>
              <option value="Mediodía / Comida">Mediodía / Comida</option>
              <option value="Tarde / Merienda">Tarde / Merienda</option>
              <option value="Noche / Cena">Noche / Cena</option>
            </select>
          </div>
        </div>

        {/* Mobile Card View (< md) */}
        <div className="md:hidden space-y-3">
          {filteredReadings.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No hay mediciones que coincidan con los filtros aplicados.
            </div>
          ) : (
            filteredReadings.map(reading => {
              const meta = getOMSMeta(reading.classification);
              return (
                <div
                  key={reading.id}
                  className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5 min-w-0"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-extrabold text-base text-slate-900 dark:text-white tabular-nums">
                          {reading.systolic}/{reading.diastolic} <span className="text-[11px] font-normal text-slate-500">mmHg</span>
                        </span>
                        <span className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                          {reading.pulse} ppm
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        {reading.date} · {reading.time}
                      </div>
                    </div>

                    <span className={`text-[10px] font-semibold py-0.5 px-2 rounded-md shrink-0 ${meta.badgeClass}`}>
                      {meta.label}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <div className="break-words">
                      <span className="text-slate-400">Momento:</span> {reading.moment} · Brazo {reading.arm}
                    </div>
                    {reading.notes && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 break-words italic">
                        &quot;{reading.notes}&quot;
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 min-w-0">
                      <span className="truncate">Por: {reading.takenBy}</span>
                      {canModifyReadingOrDose(reading.takenBy) ? (
                        <span className="text-[9px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-1.5 py-0.5 rounded border border-teal-200 dark:border-teal-800 shrink-0">
                          {activeCaregiver?.role === 'admin' || config.isAdminUnlocked ? 'Admin' : 'Tú'}
                        </span>
                      ) : (
                        <span className="text-[9px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 flex items-center gap-0.5 shrink-0">
                          <Lock className="w-2.5 h-2.5" />
                          PIN
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(reading)}
                        className="p-1.5 text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors"
                        title="Editar lectura"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePrompt(reading)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors"
                        title="Eliminar lectura"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Data Table (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="pb-3 px-3">Fecha y Hora</th>
                <th className="pb-3 px-3">Tensión (mmHg)</th>
                <th className="pb-3 px-3">Pulso</th>
                <th className="pb-3 px-3">Semáforo OMS</th>
                <th className="pb-3 px-3">Momento / Brazo</th>
                <th className="pb-3 px-3">Notas y Síntomas</th>
                <th className="pb-3 px-3">Registrado por</th>
                <th className="pb-3 px-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredReadings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No hay mediciones que coincidan con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredReadings.map(reading => {
                  const meta = getOMSMeta(reading.classification);
                  return (
                    <tr 
                      key={reading.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-3 font-medium whitespace-nowrap">
                        <div className="text-slate-900 dark:text-slate-100">{reading.date}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{reading.time}</div>
                      </td>

                      <td className="py-3 px-3 font-extrabold text-slate-900 dark:text-white tabular-nums text-sm whitespace-nowrap">
                        {reading.systolic} / {reading.diastolic}
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300 tabular-nums whitespace-nowrap">
                        {reading.pulse} ppm
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`text-[11px] font-semibold py-0.5 px-2 rounded-md ${meta.badgeClass}`}>
                          {meta.label}
                        </span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                        <div>{reading.moment}</div>
                        <div className="text-[10px] text-slate-400">Brazo {reading.arm}</div>
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-xs">
                        <span className="line-clamp-2">{reading.notes || '—'}</span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <span>{reading.takenBy}</span>
                          {canModifyReadingOrDose(reading.takenBy) ? (
                            <span className="text-[9px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-1.5 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                              {activeCaregiver?.role === 'admin' || config.isAdminUnlocked ? 'Admin' : 'Tú'}
                            </span>
                          ) : (
                            <span className="text-[9px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 flex items-center gap-0.5" title="Protegida: requiere PIN de Administrador para modificar">
                              <Lock className="w-2.5 h-2.5" />
                              PIN
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(reading)}
                            className="p-1.5 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title={canModifyReadingOrDose(reading.takenBy) ? 'Editar lectura' : 'Editar lectura (requiere PIN de Admin)'}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePrompt(reading)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title={canModifyReadingOrDose(reading.takenBy) ? 'Eliminar lectura' : 'Eliminar lectura (requiere PIN de Admin)'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Add / Edit Reading Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-base truncate">
                    {editingReading ? 'Editar Lectura' : 'Anotar Nueva Tensión'}
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

            <form onSubmit={handleSubmitForm} className="space-y-4">
              
              {/* Date and Time */}
              <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hora
                  </label>
                  <input
                    type="time"
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Systolic, Diastolic, Pulse */}
              <div className="grid grid-cols-3 gap-2">
                <div className="min-w-0">
                  <label className="block text-[11px] sm:text-xs font-semibold text-rose-700 dark:text-rose-400 mb-1 leading-tight">
                    Sistólica <span className="hidden sm:inline">(Alta)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={60}
                      max={260}
                      value={formSystolic}
                      onChange={(e) => setFormSystolic(Number(e.target.value))}
                      className="w-full text-center text-sm sm:text-base font-extrabold p-2 sm:p-2.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20 tabular-nums focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <span className="block text-[10px] text-center text-slate-400 mt-0.5">mmHg</span>
                </div>

                <div className="min-w-0">
                  <label className="block text-[11px] sm:text-xs font-semibold text-teal-700 dark:text-teal-400 mb-1 leading-tight">
                    Diastólica <span className="hidden sm:inline">(Baja)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={40}
                      max={160}
                      value={formDiastolic}
                      onChange={(e) => setFormDiastolic(Number(e.target.value))}
                      className="w-full text-center text-sm sm:text-base font-extrabold p-2 sm:p-2.5 rounded-xl border border-teal-300 dark:border-teal-800 bg-teal-50/40 dark:bg-teal-950/20 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <span className="block text-[10px] text-center text-slate-400 mt-0.5">mmHg</span>
                </div>

                <div className="min-w-0">
                  <label className="block text-[11px] sm:text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1 leading-tight">
                    Pulso
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={30}
                      max={220}
                      value={formPulse}
                      onChange={(e) => setFormPulse(Number(e.target.value))}
                      className="w-full text-center text-sm sm:text-base font-extrabold p-2 sm:p-2.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <span className="block text-[10px] text-center text-slate-400 mt-0.5">ppm</span>
                </div>
              </div>

              {/* Live OMS Classification Preview */}
              <div className={`p-3 rounded-xl border ${liveMeta.bgLightClass} ${liveMeta.borderColorClass} text-xs transition-colors`}>
                <div className="flex items-center justify-between font-semibold mb-0.5">
                  <span className={liveMeta.colorClass}>Semáforo OMS: {liveMeta.label}</span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  {liveMeta.description}
                </div>
              </div>

              {/* Moment and Arm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Momento del Día
                  </label>
                  <select
                    value={formMoment}
                    onChange={(e) => setFormMoment(e.target.value as MomentOfDay)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="En ayunas / Mañana">En ayunas / Mañana</option>
                    <option value="Mediodía / Comida">Mediodía / Comida</option>
                    <option value="Tarde / Merienda">Tarde / Merienda</option>
                    <option value="Noche / Cena">Noche / Cena</option>
                    <option value="Antes de acostarse">Antes de acostarse</option>
                    <option value="Post-ejercicio">Post-ejercicio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Brazo de Medición
                  </label>
                  <select
                    value={formArm}
                    onChange={(e) => setFormArm(e.target.value as 'Izquierdo' | 'Derecho')}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Izquierdo">Brazo Izquierdo</option>
                    <option value="Derecho">Brazo Derecho</option>
                  </select>
                </div>
              </div>

              {/* Registered By */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tomada por (Cuidador / Personal registrado)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {caregivers.map(cg => (
                    <button
                      key={cg.id}
                      type="button"
                      onClick={() => setFormTakenBy(cg.name)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        formTakenBy === cg.name
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${formTakenBy === cg.name ? 'bg-white' : 'bg-rose-500'}`} />
                      <span>{cg.name}</span>
                      <span className="text-[10px] opacity-80 font-normal">({cg.relation})</span>
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={formTakenBy}
                  onChange={(e) => setFormTakenBy(e.target.value)}
                  placeholder="O escribe otro cuidador o enfermero..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              {/* Notes / Symptoms */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notas adicionales o síntomas observados
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ej: En reposo 5 minutos. Sin mareos. Antes de la pastilla de la mañana."
                  rows={2}
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
                  className="px-5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors"
                >
                  {editingReading ? 'Guardar Cambios' : 'Registrar Medición'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {readingToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-rose-200 dark:border-rose-900 text-slate-900 dark:text-slate-100">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base">¿Eliminar registro de tensión?</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
              Esta acción borrará la medición del historial médico del paciente. Esta operación no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setReadingToDelete(null)}
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

      {/* Admin Unlock Modal for Protected Actions */}
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
