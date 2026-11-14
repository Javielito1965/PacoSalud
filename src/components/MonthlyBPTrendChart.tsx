import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Area, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine 
} from 'recharts';
import { useApp } from '../context/AppContext';
import { BloodPressureReading } from '../types';
import { getOMSMeta } from '../utils/omsBloodPressure';
import { 
  Activity, 
  Heart, 
  TrendingDown, 
  TrendingUp, 
  Calendar, 
  ChevronRight, 
  Info, 
  Sparkles,
  BarChart3,
  Layers,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';

interface Props {
  onNavigateToTension?: () => void;
  className?: string;
}

interface MonthlyDataPoint {
  monthKey: string;      // "2026-06"
  label: string;         // "Jun 2026"
  monthName: string;     // "Junio"
  avgSys: number;
  avgDia: number;
  avgPulse: number;
  minSys: number;
  maxSys: number;
  minDia: number;
  maxDia: number;
  count: number;
  controlledRate: number; // % below 130/85
}

interface DailyDataPoint {
  dateKey: string;       // "2026-11-09"
  label: string;         // "09 Nov"
  day: number;
  avgSys: number;
  avgDia: number;
  avgPulse: number;
  count: number;
  classification: string;
}

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MONTH_SHORT_ES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

export const MonthlyBPTrendChart: React.FC<Props> = ({ 
  onNavigateToTension,
  className = '' 
}) => {
  const { activePatient, patientReadings } = useApp();

  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [viewScope, setViewScope] = useState<'monthly' | 'daily'>('monthly');

  // 1. Group readings by month
  const monthlyData = useMemo<MonthlyDataPoint[]>(() => {
    if (!patientReadings || patientReadings.length === 0) return [];

    const map = new Map<string, BloodPressureReading[]>();

    patientReadings.forEach(r => {
      if (!r.date) return;
      const monthKey = r.date.slice(0, 7); // "YYYY-MM"
      if (!map.has(monthKey)) {
        map.set(monthKey, []);
      }
      map.get(monthKey)!.push(r);
    });

    // If there's only 1 month of historical data, we can also generate monthly points from the readings
    const sortedKeys = Array.from(map.keys()).sort();

    return sortedKeys.map(key => {
      const readings = map.get(key)!;
      const [yearStr, monthStr] = key.split('-');
      const monthIdx = parseInt(monthStr, 10) - 1;
      const monthName = MONTH_NAMES_ES[monthIdx] || key;
      const shortName = MONTH_SHORT_ES[monthIdx] || key;
      const label = `${shortName} ${yearStr.slice(2)}`;

      const totalSys = readings.reduce((acc, r) => acc + (r.systolic || 0), 0);
      const totalDia = readings.reduce((acc, r) => acc + (r.diastolic || 0), 0);
      const totalPulse = readings.reduce((acc, r) => acc + (r.pulse || 0), 0);

      const sysValues = readings.map(r => r.systolic || 0);
      const diaValues = readings.map(r => r.diastolic || 0);

      const avgSys = Math.round(totalSys / readings.length);
      const avgDia = Math.round(totalDia / readings.length);
      const avgPulse = Math.round(totalPulse / readings.length);

      const minSys = Math.min(...sysValues);
      const maxSys = Math.max(...sysValues);
      const minDia = Math.min(...diaValues);
      const maxDia = Math.max(...diaValues);

      // Controlled = Systolic < 135 and Diastolic < 85
      const controlledCount = readings.filter(r => r.systolic < 135 && r.diastolic < 85).length;
      const controlledRate = Math.round((controlledCount / readings.length) * 100);

      return {
        monthKey: key,
        label,
        monthName,
        avgSys,
        avgDia,
        avgPulse,
        minSys,
        maxSys,
        minDia,
        maxDia,
        count: readings.length,
        controlledRate,
      };
    });
  }, [patientReadings]);

  // 2. Group current month readings by day
  const dailyData = useMemo<DailyDataPoint[]>(() => {
    if (!patientReadings || patientReadings.length === 0) return [];

    // Latest month
    const latestMonth = monthlyData[monthlyData.length - 1]?.monthKey || new Date().toISOString().slice(0, 7);
    const monthReadings = patientReadings.filter(r => r.date && r.date.startsWith(latestMonth));

    const map = new Map<string, BloodPressureReading[]>();
    monthReadings.forEach(r => {
      if (!map.has(r.date)) {
        map.set(r.date, []);
      }
      map.get(r.date)!.push(r);
    });

    const sortedDates = Array.from(map.keys()).sort();

    return sortedDates.map(dateKey => {
      const readings = map.get(dateKey)!;
      const day = parseInt(dateKey.slice(8, 10), 10);
      const monthIdx = parseInt(dateKey.slice(5, 7), 10) - 1;
      const label = `${day} ${MONTH_SHORT_ES[monthIdx]}`;

      const totalSys = readings.reduce((acc, r) => acc + (r.systolic || 0), 0);
      const totalDia = readings.reduce((acc, r) => acc + (r.diastolic || 0), 0);
      const totalPulse = readings.reduce((acc, r) => acc + (r.pulse || 0), 0);

      const avgSys = Math.round(totalSys / readings.length);
      const avgDia = Math.round(totalDia / readings.length);
      const avgPulse = Math.round(totalPulse / readings.length);

      const lastReading = readings[readings.length - 1];
      const meta = getOMSMeta(lastReading.classification);

      return {
        dateKey,
        label,
        day,
        avgSys,
        avgDia,
        avgPulse,
        count: readings.length,
        classification: meta.label,
      };
    });
  }, [patientReadings, monthlyData]);

  // Calculate comparison between last 2 months
  const monthlyComparison = useMemo(() => {
    if (monthlyData.length < 2) return null;
    const current = monthlyData[monthlyData.length - 1];
    const previous = monthlyData[monthlyData.length - 2];

    const diffSys = current.avgSys - previous.avgSys;
    const diffDia = current.avgDia - previous.avgDia;

    return {
      current,
      previous,
      diffSys,
      diffDia,
      isBetter: diffSys <= 0 && diffDia <= 0,
    };
  }, [monthlyData]);

  const latestMonth = monthlyData[monthlyData.length - 1];

  // Custom Recharts Tooltip for Monthly view
  const CustomMonthlyTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data: MonthlyDataPoint = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-slate-900/95 text-white p-3 sm:p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs backdrop-blur-md min-w-[165px] max-w-[calc(100vw-3rem)]">
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2 font-bold text-xs sm:text-sm">
          <span>{data.monthName} {data.monthKey.slice(0, 4)}</span>
          <span className="text-[10px] text-teal-400 font-semibold shrink-0">{data.count} tomas</span>
        </div>

        <div className="space-y-1.5 font-mono">
          <div className="flex items-center justify-between gap-2 text-rose-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shrink-0" />
              <span>Sistólica media:</span>
            </span>
            <strong className="text-xs sm:text-sm shrink-0">{data.avgSys} mmHg</strong>
          </div>

          <div className="flex items-center justify-between gap-2 text-blue-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block shrink-0" />
              <span>Diastólica media:</span>
            </span>
            <strong className="text-xs sm:text-sm shrink-0">{data.avgDia} mmHg</strong>
          </div>

          <div className="flex items-center justify-between gap-2 text-amber-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shrink-0" />
              <span>Pulso medio:</span>
            </span>
            <strong className="text-xs sm:text-sm shrink-0">{data.avgPulse} ppm</strong>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] flex items-center justify-between gap-2 text-slate-300">
          <span>Rango sistólico:</span>
          <span>{data.minSys} - {data.maxSys} mmHg</span>
        </div>

        <div className="mt-1 text-[10px] flex items-center justify-between gap-2 text-emerald-400 font-semibold">
          <span>Controlado:</span>
          <span>{data.controlledRate}% de tomas</span>
        </div>
      </div>
    );
  };

  // Custom Recharts Tooltip for Daily view
  const CustomDailyTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data: DailyDataPoint = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-slate-900/95 text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs backdrop-blur-md min-w-[160px] max-w-[calc(100vw-3rem)]">
        <div className="font-bold border-b border-slate-800 pb-1.5 mb-2 flex items-center justify-between gap-2">
          <span>Día {data.dateKey}</span>
          <span className="text-[10px] text-teal-400 shrink-0">{data.count} tomas</span>
        </div>

        <div className="space-y-1 font-mono">
          <div className="flex justify-between gap-2 text-rose-400">
            <span>Sistólica:</span>
            <strong>{data.avgSys} mmHg</strong>
          </div>
          <div className="flex justify-between gap-2 text-blue-400">
            <span>Diastólica:</span>
            <strong>{data.avgDia} mmHg</strong>
          </div>
          <div className="flex justify-between gap-2 text-amber-400">
            <span>Pulso:</span>
            <strong>{data.avgPulse} ppm</strong>
          </div>
        </div>

        <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-slate-300 font-semibold">
          OMS: {data.classification}
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-3xl p-3.5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm min-w-0 overflow-hidden ${className}`}>
      
      {/* 1. Header with Title and Scope Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 sm:mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-2xs">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                Tendencia Mensual de Tensión Arterial
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 truncate max-w-full">
                {activePatient?.nickname || activePatient?.name}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              Evolución clínica continua · Sistólica, diastólica y pulso
            </p>
          </div>
        </div>

        {/* View Controls & Chart Switcher */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-center w-full lg:w-auto">
          
          {/* Switch: Mensual vs Diario */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setViewScope('monthly')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
                viewScope === 'monthly'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Mes a Mes ({monthlyData.length})
            </button>
            <button
              type="button"
              onClick={() => setViewScope('daily')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
                viewScope === 'daily'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Este mes
            </button>
          </div>

          {/* Switch: Area vs Bar */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs shrink-0">
            <button
              type="button"
              onClick={() => setChartType('area')}
              className={`p-1.5 rounded-lg transition-all ${
                chartType === 'area'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Gráfica continua de área"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded-lg transition-all ${
                chartType === 'bar'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Comparativa en barras"
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
          </div>

          {onNavigateToTension && (
            <button
              type="button"
              onClick={onNavigateToTension}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 flex items-center gap-1 px-1.5 py-1 ml-auto lg:ml-0 shrink-0"
            >
              <span>Ver tomas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

        </div>
      </div>

      {/* 2. Key Metrics Summary Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-5">
        
        {/* Metric 1: Media Sistólica Actual */}
        <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 sm:p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 mb-1">
            <span className="font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1 truncate">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span className="truncate">Sistólica Media</span>
            </span>
          </div>
          <div className="text-lg sm:text-2xl font-black font-mono text-slate-900 dark:text-white leading-tight">
            {latestMonth ? `${latestMonth.avgSys}` : '--'} <span className="text-[10px] sm:text-xs font-normal text-slate-400">mmHg</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 leading-tight break-words">
            {latestMonth ? `${latestMonth.monthName} (${latestMonth.minSys}-${latestMonth.maxSys})` : 'Sin tomas'}
          </div>
        </div>

        {/* Metric 2: Media Diastólica Actual */}
        <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 sm:p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 mb-1">
            <span className="font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1 truncate">
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              <span className="truncate">Diastólica Media</span>
            </span>
          </div>
          <div className="text-lg sm:text-2xl font-black font-mono text-slate-900 dark:text-white leading-tight">
            {latestMonth ? `${latestMonth.avgDia}` : '--'} <span className="text-[10px] sm:text-xs font-normal text-slate-400">mmHg</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 leading-tight break-words">
            {latestMonth ? `Pulso: ${latestMonth.avgPulse} ppm` : 'Sin tomas'}
          </div>
        </div>

        {/* Metric 3: Variación Intermensual */}
        <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 sm:p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 mb-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">Variación Mes</span>
          </div>
          {monthlyComparison ? (
            <div>
              <div className="flex flex-wrap items-center gap-1 font-mono text-lg sm:text-2xl font-black leading-tight">
                {monthlyComparison.diffSys <= 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5] shrink-0" />
                    {monthlyComparison.diffSys}
                  </span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5] shrink-0" />
                    +{monthlyComparison.diffSys}
                  </span>
                )}
                <span className="text-[10px] sm:text-xs font-normal text-slate-400">mmHg</span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 leading-tight break-words">
                vs {monthlyComparison.previous.monthName} ({monthlyComparison.previous.avgSys}/{monthlyComparison.previous.avgDia})
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 py-1">En seguimiento</div>
          )}
        </div>

        {/* Metric 4: Tasa de Control Óptimo */}
        <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 sm:p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 mb-1">
            <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 truncate">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Control Óptimo</span>
            </span>
          </div>
          <div className="text-lg sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 leading-tight">
            {latestMonth ? `${latestMonth.controlledRate}%` : '--'}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 leading-tight break-words">
            Tomas &lt; 135/85 mmHg
          </div>
        </div>

      </div>

      {/* 3. Recharts Container */}
      <div className="w-full min-w-0 h-60 sm:h-72 md:h-80 select-none">
        {viewScope === 'monthly' ? (
          
          /* Monthly Trend Recharts */
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <ComposedChart
              data={monthlyData}
              margin={{ top: 10, right: 8, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorSys" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorDia" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
              
              <XAxis 
                dataKey="label" 
                stroke="#94a3b8" 
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: '#cbd5e1', opacity: 0.3 }} 
              />
              
              <YAxis 
                domain={[50, 160]} 
                ticks={[60, 80, 90, 120, 140, 160]} 
                stroke="#94a3b8" 
                fontSize={10} 
                width={34}
                tickLine={false} 
                axisLine={false}
                unit=""
              />

              <Tooltip content={<CustomMonthlyTooltip />} />

              <Legend 
                verticalAlign="top" 
                align="right" 
                height={32}
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', paddingBottom: '6px' }}
                formatter={(value) => {
                  if (value === 'avgSys') return 'Sistólica (mmHg)';
                  if (value === 'avgDia') return 'Diastólica (mmHg)';
                  if (value === 'avgPulse') return 'Pulso (ppm)';
                  return value;
                }}
              />

              {/* OMS Reference Lines */}
              <ReferenceLine 
                y={140} 
                stroke="#ef4444" 
                strokeDasharray="4 4" 
                label={{ value: 'Límite HTA (140)', position: 'insideTopRight', fill: '#ef4444', fontSize: 10 }} 
              />
              <ReferenceLine 
                y={90} 
                stroke="#f97316" 
                strokeDasharray="4 4" 
                label={{ value: 'Límite Dia (90)', position: 'insideTopRight', fill: '#f97316', fontSize: 10 }} 
              />
              <ReferenceLine 
                y={120} 
                stroke="#10b981" 
                strokeDasharray="2 2" 
                label={{ value: 'Óptima (120)', position: 'insideBottomRight', fill: '#10b981', fontSize: 10 }} 
              />

              {chartType === 'area' ? (
                <>
                  <Area
                    type="monotone"
                    dataKey="avgSys"
                    name="avgSys"
                    stroke="#f43f5e"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSys)"
                    activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="avgDia"
                    name="avgDia"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorDia)"
                    activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgPulse"
                    name="avgPulse"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#f59e0b' }}
                  />
                </>
              ) : (
                <>
                  <Bar
                    dataKey="avgSys"
                    name="avgSys"
                    fill="#f43f5e"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={28}
                  />
                  <Bar
                    dataKey="avgDia"
                    name="avgDia"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={28}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgPulse"
                    name="avgPulse"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#f59e0b' }}
                  />
                </>
              )}

            </ComposedChart>
          </ResponsiveContainer>

        ) : (

          /* Daily Breakdown of Current Month */
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <ComposedChart
              data={dailyData}
              margin={{ top: 10, right: 8, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorSysDaily" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
              
              <XAxis 
                dataKey="label" 
                stroke="#94a3b8" 
                fontSize={10} 
                tickLine={false} 
              />
              
              <YAxis 
                domain={[50, 160]} 
                ticks={[60, 80, 90, 120, 140]} 
                stroke="#94a3b8" 
                fontSize={10} 
                width={34}
                tickLine={false} 
                axisLine={false} 
              />

              <Tooltip content={<CustomDailyTooltip />} />

              <ReferenceLine 
                y={140} 
                stroke="#ef4444" 
                strokeDasharray="3 3" 
                label={{ value: 'Alerta (140)', position: 'insideTopRight', fill: '#ef4444', fontSize: 9 }} 
              />
              <ReferenceLine 
                y={120} 
                stroke="#10b981" 
                strokeDasharray="2 2" 
                label={{ value: 'Óptima (120)', position: 'insideBottomRight', fill: '#10b981', fontSize: 9 }} 
              />

              <Area
                type="monotone"
                dataKey="avgSys"
                name="avgSys"
                stroke="#f43f5e"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorSysDaily)"
                dot={{ r: 4, fill: '#f43f5e', stroke: '#fff', strokeWidth: 1.5 }}
              />

              <Line
                type="monotone"
                dataKey="avgDia"
                name="avgDia"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3, fill: '#3b82f6' }}
              />
              
              <Line
                type="monotone"
                dataKey="avgPulse"
                name="avgPulse"
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="2 2"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>

        )}
      </div>

      {/* 4. Clinical interpretation footnote */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-start gap-1.5 min-w-0">
          <Info className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
          <span className="break-words">
            Clasificación OMS / ESC-ESH: Óptima (&lt;120/80), Normal (120-129/80-84), Límite HTA (&gt;140/90 mmHg).
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1 bg-rose-500 rounded-full" />
            <span>Sistólica</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1 bg-blue-500 rounded-full" />
            <span>Diastólica</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1 bg-amber-500 rounded-full" />
            <span>Pulso (ppm)</span>
          </span>
        </div>
      </div>

    </div>
  );
};
