import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { NavTab } from './Header';
import { getOMSMeta } from '../utils/omsBloodPressure';
import { 
  Search, 
  X, 
  Heart, 
  Pill, 
  Calendar, 
  FileText, 
  ChevronRight, 
  Clock, 
  User, 
  Sparkles, 
  AlertTriangle,
  ArrowRight,
  SlidersHorizontal,
  History
} from 'lucide-react';

interface Props {
  onSelectTab: (tab: NavTab) => void;
  className?: string;
}

type SearchCategory = 'all' | 'tension' | 'medicacion' | 'citas' | 'historial';

interface SearchResultItem {
  id: string;
  category: 'tension' | 'medicacion' | 'citas' | 'historial';
  title: string;
  subtitle: string;
  dateOrBadge?: string;
  highlight?: string;
  meta?: string;
  targetTab: NavTab;
}

// Remove accents for natural Spanish matching (e.g. "medico" matches "médico", "tension" matches "tensión")
const normalize = (str: string): string => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

export const GlobalSearchBar: React.FC<Props> = ({ onSelectTab, className = '' }) => {
  const { 
    activePatient,
    patientReadings, 
    patientMedications, 
    patientAppointments,
    patientPathologies,
    patientAllergies,
    patientAntecedents 
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Global Keyboard Shortcut: Cmd+K / Ctrl+K or '/' to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input automatically when search is opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setSelectedCategory('all');
    }
  }, [isOpen]);

  // Search Results Computation
  const results = useMemo(() => {
    const q = normalize(query);
    if (!q) return [];

    const items: SearchResultItem[] = [];

    // 1. Tensión Arterial
    (patientReadings || []).forEach(r => {
      const dateParts = r.date.split('-');
      const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : r.date;
      const meta = getOMSMeta(r.classification);

      const matchDate = normalize(r.date).includes(q) || normalize(formattedDate).includes(q);
      const matchTime = normalize(r.time).includes(q);
      const matchValues = `${r.systolic}`.includes(q) || `${r.diastolic}`.includes(q) || `${r.pulse}`.includes(q) || `${r.systolic}/${r.diastolic}`.includes(q);
      const matchMoment = normalize(r.moment).includes(q);
      const matchTakenBy = normalize(r.takenBy).includes(q);
      const matchNotes = normalize(r.notes).includes(q);
      const matchClass = normalize(meta.label).includes(q);
      const matchKeyword = q === 'tension' || q === 'presion' || q === 'pulso' || q === 'ppm' || q === 'mmhg';

      if (matchDate || matchTime || matchValues || matchMoment || matchTakenBy || matchNotes || matchClass || matchKeyword) {
        items.push({
          id: `bp-${r.id}`,
          category: 'tension',
          title: `Tensión: ${r.systolic}/${r.diastolic} mmHg (Pulso: ${r.pulse} ppm)`,
          subtitle: `${formattedDate} · ${r.time} h · ${r.moment}${r.notes ? ` · "${r.notes}"` : ''}`,
          dateOrBadge: meta.label,
          highlight: r.takenBy ? `Registrado por ${r.takenBy}` : undefined,
          targetTab: 'tension'
        });
      }
    });

    // 2. Medicación
    (patientMedications || []).forEach(m => {
      const matchName = normalize(m.name).includes(q);
      const matchSubstance = normalize(m.activeSubstance).includes(q);
      const matchDose = normalize(m.dose).includes(q);
      const matchForm = normalize(m.form).includes(q);
      const matchFood = normalize(m.withFood).includes(q);
      const matchInstructions = normalize(m.instructions).includes(q);
      const matchTimes = (m.scheduleTimes || []).some(t => normalize(t).includes(q));
      const matchLabels = (m.scheduleLabels || []).some(l => normalize(l).includes(q));
      const matchKeyword = q === 'pastilla' || q === 'medicamento' || q === 'farmaco' || q === 'dosis' || q === 'receta';

      if (matchName || matchSubstance || matchDose || matchForm || matchFood || matchInstructions || matchTimes || matchLabels || matchKeyword) {
        items.push({
          id: `med-${m.id}`,
          category: 'medicacion',
          title: `${m.name} ${m.dose} (${m.form})`,
          subtitle: `${m.activeSubstance ? `Principio activo: ${m.activeSubstance} · ` : ''}Pauta: ${(m.scheduleTimes || []).join(', ')} (${(m.scheduleLabels || []).join(', ')})`,
          dateOrBadge: m.withFood,
          highlight: m.instructions || m.prescriptionRef || undefined,
          targetTab: 'medicacion'
        });
      }
    });

    // 3. Citas Médicas
    (patientAppointments || []).forEach(a => {
      const dateParts = a.date.split('-');
      const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : a.date;

      const matchSpecialty = normalize(a.specialty).includes(q);
      const matchDoctor = normalize(a.doctor).includes(q);
      const matchFacility = normalize(a.facility).includes(q);
      const matchReason = normalize(a.reason).includes(q);
      const matchDate = normalize(a.date).includes(q) || normalize(formattedDate).includes(q);
      const matchTime = normalize(a.time).includes(q);
      const matchStatus = normalize(a.status).includes(q);
      const matchKeyword = q === 'cita' || q === 'medico' || q === 'consulta' || q === 'hospital' || q === 'doctor';

      if (matchSpecialty || matchDoctor || matchFacility || matchReason || matchDate || matchTime || matchStatus || matchKeyword) {
        items.push({
          id: `apt-${a.id}`,
          category: 'citas',
          title: `Cita: ${a.specialty} ${a.doctor ? `(Dr/a. ${a.doctor})` : ''}`,
          subtitle: `${formattedDate} a las ${a.time} h · ${a.facility}${a.reason ? ` · Motivo: ${a.reason}` : ''}`,
          dateOrBadge: a.status === 'pendiente' ? 'Pendiente' : a.status === 'completada' ? 'Completada' : 'Cancelada',
          highlight: a.phone ? `Tel: ${a.phone}` : undefined,
          targetTab: 'citas'
        });
      }
    });

    // 4. Historial Clínico (Patologías, Alergias, Antecedentes)
    (patientPathologies || []).forEach(p => {
      const matchName = normalize(p.name).includes(q);
      const matchStatus = normalize(p.status).includes(q);
      const matchYear = p.diagnosedYear && normalize(p.diagnosedYear).includes(q);
      const matchTreatment = normalize(p.treatmentSummary).includes(q);
      const matchNotes = normalize(p.doctorNotes || '').includes(q);

      if (matchName || matchStatus || matchYear || matchTreatment || matchNotes || q === 'patologia' || q === 'enfermedad') {
        items.push({
          id: `path-${p.id}`,
          category: 'historial',
          title: `Patología: ${p.name}`,
          subtitle: `Estado: ${p.status.toUpperCase()}${p.diagnosedYear ? ` · Año: ${p.diagnosedYear}` : ''}${p.treatmentSummary ? ` · Tto: ${p.treatmentSummary}` : ''}`,
          dateOrBadge: p.status,
          highlight: p.doctorNotes || undefined,
          targetTab: 'admin'
        });
      }
    });

    (patientAllergies || []).forEach(alg => {
      const matchSubstance = normalize(alg.substance).includes(q);
      const matchSeverity = normalize(alg.severity).includes(q);
      const matchReaction = normalize(alg.reaction).includes(q);
      const matchYear = alg.diagnosedYear && normalize(alg.diagnosedYear).includes(q);

      if (matchSubstance || matchSeverity || matchReaction || matchYear || q === 'alergia' || q === 'reaccion') {
        items.push({
          id: `alg-${alg.id}`,
          category: 'historial',
          title: `Alergia: ${alg.substance}`,
          subtitle: `Gravedad: ${alg.severity.toUpperCase()}${alg.reaction ? ` · Reacción: ${alg.reaction}` : ''}`,
          dateOrBadge: `Alergia ${alg.severity}`,
          highlight: alg.notes || undefined,
          targetTab: 'admin'
        });
      }
    });

    (patientAntecedents || []).forEach(ant => {
      const matchTitle = normalize(ant.title).includes(q);
      const matchCat = normalize(ant.category).includes(q);
      const matchYear = normalize(ant.yearOrDate).includes(q);
      const matchFacility = normalize(ant.facilityOrHospital || '').includes(q);
      const matchDetails = normalize(ant.details).includes(q);

      if (matchTitle || matchCat || matchYear || matchFacility || matchDetails || q === 'antecedente' || q === 'cirugia' || q === 'operacion') {
        items.push({
          id: `ant-${ant.id}`,
          category: 'historial',
          title: `Antecedente [${ant.category.toUpperCase()}]: ${ant.title}`,
          subtitle: `${ant.yearOrDate ? `Año ${ant.yearOrDate} · ` : ''}${ant.facilityOrHospital ? `${ant.facilityOrHospital} · ` : ''}${ant.details}`,
          dateOrBadge: ant.category,
          targetTab: 'admin'
        });
      }
    });

    return items;
  }, [query, patientReadings, patientMedications, patientAppointments, patientPathologies, patientAllergies, patientAntecedents]);

  // Filtered by selected category tab
  const filteredResults = useMemo(() => {
    if (selectedCategory === 'all') return results;
    return results.filter(r => r.category === selectedCategory);
  }, [results, selectedCategory]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: results.length,
      tension: results.filter(r => r.category === 'tension').length,
      medicacion: results.filter(r => r.category === 'medicacion').length,
      citas: results.filter(r => r.category === 'citas').length,
      historial: results.filter(r => r.category === 'historial').length,
    };
  }, [results]);

  const handleSelectResult = (item: SearchResultItem) => {
    onSelectTab(item.targetTab);
    setIsOpen(false);
  };

  const handleQuickSuggestion = (text: string) => {
    setQuery(text);
  };

  return (
    <div className={`relative ${className}`}>
      
      {/* 1. Header Search Bar Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full min-w-0 max-w-full sm:max-w-xs md:max-w-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-1.5 sm:gap-2 text-xs transition-all shadow-2xs group focus:outline-none focus:ring-2 focus:ring-teal-500/40"
        title="Buscar registros de tensión, medicamentos o citas (Ctrl+K)"
      >
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 shrink-0 transition-colors" />
          <span className="truncate text-slate-600 dark:text-slate-300 font-medium hidden sm:inline">
            Buscar tensión, fármacos, citas...
          </span>
          <span className="truncate text-slate-600 dark:text-slate-300 font-medium sm:hidden">
            Buscar...
          </span>
        </div>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shrink-0 shadow-2xs">
          ⌘K
        </kbd>
      </button>

      {/* 2. Global Search Modal / Command Palette */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div 
            ref={modalRef}
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 mt-2 sm:mt-12 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
          >
            
            {/* Search Input Bar */}
            <div className="p-3 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 sm:gap-3 bg-slate-50/50 dark:bg-slate-900/50">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 dark:text-teal-400 shrink-0" />
              
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar tensión, fármaco, cita o fecha..."
                className="flex-1 min-w-0 bg-transparent border-none text-sm sm:text-base font-medium placeholder:text-slate-400 text-slate-900 dark:text-white focus:outline-none"
              />

              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shrink-0"
                  title="Borrar texto"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shrink-0"
              >
                Cerrar
              </button>
            </div>

            {/* Category Filter Chips */}
            {query.trim().length > 0 && (
              <div className="px-4 py-2.5 bg-slate-100/60 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs">
                <span className="text-[11px] font-semibold text-slate-400 mr-1 shrink-0">Filtrar:</span>
                
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 ${
                    selectedCategory === 'all'
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Todos ({counts.all})
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCategory('tension')}
                  className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all shrink-0 ${
                    selectedCategory === 'tension'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <Heart className="w-3 h-3 text-rose-400 fill-current" />
                  <span>Tensión ({counts.tension})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCategory('medicacion')}
                  className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all shrink-0 ${
                    selectedCategory === 'medicacion'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <Pill className="w-3 h-3 text-blue-400" />
                  <span>Fármacos ({counts.medicacion})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCategory('citas')}
                  className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all shrink-0 ${
                    selectedCategory === 'citas'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <Calendar className="w-3 h-3 text-amber-400" />
                  <span>Citas ({counts.citas})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCategory('historial')}
                  className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all shrink-0 ${
                    selectedCategory === 'historial'
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <FileText className="w-3 h-3 text-teal-400" />
                  <span>Historial ({counts.historial})</span>
                </button>
              </div>
            )}

            {/* Results Body */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 divide-y divide-slate-100 dark:divide-slate-800">
              
              {/* Empty search: Helpful quick shortcuts */}
              {!query.trim() && (
                <div className="py-6 px-2 space-y-4">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Sugerencias de búsqueda rápida
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleQuickSuggestion('tension')}
                      className="p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 hover:bg-rose-100/60 text-left border border-rose-200 dark:border-rose-900/40 flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Heart className="w-4 h-4 text-rose-600 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">Todas las tomas de tensión</div>
                          <div className="text-[11px] text-slate-500">Valores, pulso ppm y fechas</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickSuggestion('pastilla')}
                      className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 hover:bg-blue-100/60 text-left border border-blue-200 dark:border-blue-900/40 flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Pill className="w-4 h-4 text-blue-600 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">Tratamientos y pautas</div>
                          <div className="text-[11px] text-slate-500">Dosis, horarios y alimentos</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickSuggestion('cita')}
                      className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 hover:bg-amber-100/60 text-left border border-amber-200 dark:border-amber-900/40 flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">Próximas citas médicas</div>
                          <div className="text-[11px] text-slate-500">Especialistas y hospitales</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickSuggestion('alergia')}
                      className="p-3 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 hover:bg-teal-100/60 text-left border border-teal-200 dark:border-teal-900/40 flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-teal-600 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">Alergias y patologías</div>
                          <div className="text-[11px] text-slate-500">Historial clínico y antecedentes</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>
                      Puedes escribir fechas como <strong>&quot;14/11&quot;</strong>, medicamentos como <strong>&quot;Enalapril&quot;</strong>, valores como <strong>&quot;135&quot;</strong> o doctores como <strong>&quot;Gómez&quot;</strong>.
                    </span>
                  </div>
                </div>
              )}

              {/* No results state */}
              {query.trim() && filteredResults.length === 0 && (
                <div className="py-12 text-center text-slate-500">
                  <Search className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No se encontraron coincidencias para &quot;{query}&quot;
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Prueba buscando por una fecha (ej. &quot;11/11&quot;), nombre de fármaco, médico o síntoma.
                  </p>
                </div>
              )}

              {/* Matching results list */}
              {filteredResults.map(item => {
                const isTension = item.category === 'tension';
                const isMed = item.category === 'medicacion';
                const isApt = item.category === 'citas';
                const isHist = item.category === 'historial';

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectResult(item)}
                    className="w-full text-left p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all flex items-start justify-between gap-3 group focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      
                      {/* Icon badge */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isTension 
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400' 
                          : isMed 
                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                            : isApt
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                              : 'bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400'
                      }`}>
                        {isTension && <Heart className="w-4 h-4 fill-current" />}
                        {isMed && <Pill className="w-4 h-4" />}
                        {isApt && <Calendar className="w-4 h-4" />}
                        {isHist && <FileText className="w-4 h-4" />}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white break-words">
                            {item.title}
                          </span>
                          
                          {item.dateOrBadge && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md shrink-0 ${
                              isTension
                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                                : isMed
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                                  : isApt
                                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                                    : 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-900'
                            }`}>
                              {item.dateOrBadge}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 break-words">
                          {item.subtitle}
                        </p>

                        {item.highlight && (
                          <div className="text-[11px] text-teal-600 dark:text-teal-400 font-medium mt-1 break-words">
                            {item.highlight}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 shrink-0 text-xs font-semibold self-center">
                      <span className="hidden sm:inline">Ver sección</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                );
              })}

            </div>

            {/* Modal Footer info */}
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-1">
              <div className="truncate max-w-full">
                Paciente activo: <strong className="text-slate-700 dark:text-slate-300">{activePatient?.name}</strong>
              </div>
              <div className="flex items-center gap-2">
                <span>Pulsa sobre cualquier registro para abrirlo</span>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
