import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getOMSMeta } from '../utils/omsBloodPressure';
import { safeCopyText } from '../utils/safeStorage';
import { 
  Printer, 
  X, 
  Heart, 
  Pill, 
  Calendar, 
  ArrowLeft, 
  Copy, 
  Check, 
  RotateCcw, 
  FileText, 
  Share2,
  AlertCircle
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToDashboard?: () => void;
}

export const MedicalReportModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  onNavigateToDashboard 
}) => {
  const { 
    activePatient, 
    patientReadings, 
    patientMedications, 
    patientAppointments,
    patientPathologies,
    patientAllergies,
    patientAntecedents 
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [printNotice, setPrintNotice] = useState<string | null>(null);

  // Keyboard Escape, Browser Back gesture, and body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    // Push dummy history entry so native mobile back button closes modal instead of navigating away
    try {
      window.history.pushState({ modal: 'medical-report' }, '');
    } catch {
      // Ignore if pushState is restricted
    }

    const handlePopState = () => {
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    // Prevent background scrolling while modal is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSafeClose = () => {
    onClose();
  };

  const handleBackToDashboard = () => {
    if (onNavigateToDashboard) {
      onNavigateToDashboard();
    } else {
      onClose();
    }
  };

  const handlePrint = () => {
    setPrintNotice(null);
    try {
      window.print();
    } catch {
      setPrintNotice('Tu navegador no permite la impresión directa. Puedes pulsar "Copiar Resumen" para compartir el informe.');
    }
  };

  // Recent 14 readings
  const recentReadings = (patientReadings || []).slice(0, 14);

  // Safe averages
  const avgSys = recentReadings.length > 0 
    ? Math.round(recentReadings.reduce((acc, r) => acc + (r.systolic || 0), 0) / recentReadings.length) 
    : 0;
  const avgDia = recentReadings.length > 0 
    ? Math.round(recentReadings.reduce((acc, r) => acc + (r.diastolic || 0), 0) / recentReadings.length) 
    : 0;
  const avgPulse = recentReadings.length > 0 
    ? Math.round(recentReadings.reduce((acc, r) => acc + (r.pulse || 0), 0) / recentReadings.length) 
    : 0;

  const upcomingApts = (patientAppointments || []).filter(a => a.status === 'pendiente');
  const activeMeds = (patientMedications || []).filter(m => m.active);

  // Copy full readable report for WhatsApp / Doctor
  const handleCopyText = async () => {
    const lines = [
      `📋 INFORME CLÍNICO DE SALUD · CUIDAFAM PRO`,
      `Fecha: ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
      `----------------------------------------`,
      `👤 PACIENTE: ${activePatient?.name || 'Paciente'} (${activePatient?.age || '--'} años)`,
      `DNI / SIP: ${activePatient?.dniSip || 'No indicado'} · Grupo: ${activePatient?.bloodType || '--'}`,
      `Centro de Salud: ${activePatient?.healthCenter || 'No indicado'} · Médico: ${activePatient?.primaryCareDoctor || 'No indicado'}`,
      `Contacto emergencia: ${activePatient?.emergencyContactName || ''} (${activePatient?.emergencyContactPhone || ''})`,
      ``,
      `🩺 ANTECEDENTES Y PATOLOGÍAS CRÓNICAS:`,
      ...(patientPathologies && patientPathologies.length > 0
        ? patientPathologies.map(p => `- ${p.name} [${p.status.toUpperCase()}]${p.diagnosedYear ? ` (Diag: ${p.diagnosedYear})` : ''}${p.treatmentSummary ? ` · Tto: ${p.treatmentSummary}` : ''}${p.doctorNotes ? ` · Nota: ${p.doctorNotes}` : ''}`)
        : ['- Sin patologías registradas']),
      ``,
      `⚠️ ALERGIAS Y REACCIONES ADVERSAS:`,
      ...(patientAllergies && patientAllergies.length > 0
        ? patientAllergies.map(a => `- ${a.substance} (Gravedad: ${a.severity.toUpperCase()}${a.reaction ? ` · Síntomas: ${a.reaction}` : ''}${a.diagnosedYear ? ` · Año: ${a.diagnosedYear}` : ''})`)
        : ['- Sin alergias conocidas registradas']),
      ``,
      `🏥 ANTECEDENTES RELEVANTES / QUIRÚRGICOS / IMPLANTES:`,
      ...(patientAntecedents && patientAntecedents.length > 0
        ? patientAntecedents.map(ant => `- [${ant.category.toUpperCase()}] ${ant.yearOrDate ? `${ant.yearOrDate}: ` : ''}${ant.title}${ant.facilityOrHospital ? ` (${ant.facilityOrHospital})` : ''}${ant.details ? ` · ${ant.details}` : ''}`)
        : ['- Sin antecedentes adicionales']),
      ``,
      `❤️ REGISTRO DE TENSIÓN ARTERIAL (Últimas tomas):`,
      `Media reciente: ${avgSys}/${avgDia} mmHg · Pulso medio: ${avgPulse} ppm`,
      ...recentReadings.map(r => `- ${r.date} ${r.time}: ${r.systolic}/${r.diastolic} mmHg · ${r.pulse} ppm (${r.moment}) [Por: ${r.takenBy || 'Familiar'}] ${r.notes ? `[${r.notes}]` : ''}`),
      ``,
      `💊 MEDICACIÓN ACTIVA:`,
      ...activeMeds.map(m => `- ${m.name} ${m.dose} (${m.form}): ${(m.scheduleTimes || []).join(', ')} [${m.withFood}]`),
      ``,
      `📅 PRÓXIMAS CITAS:`,
      ...(upcomingApts.length > 0 
        ? upcomingApts.map(a => `- ${a.date} ${a.time} h: ${a.specialty} (${a.facility}) ${a.doctor ? `Dr. ${a.doctor}` : ''}`) 
        : ['- Sin citas pendientes programadas']),
    ];

    const ok = await safeCopyText(lines.join('\n'));
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-start p-2 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleSafeClose();
      }}
    >
      {/* Container card */}
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col my-2 sm:my-6 overflow-hidden">
        
        {/* ALWAYS-VISIBLE STICKY APP BAR (Ensures user can ALWAYS go back or exit) */}
        <div className="no-print sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shadow-xs">
          
          {/* Prominent Back Button */}
          <button
            type="button"
            onClick={handleSafeClose}
            className="px-3.5 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center gap-1.5 transition-transform active:scale-95 border border-teal-200 dark:border-teal-800 shrink-0"
            title="Volver a la pantalla anterior"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver atrás</span>
          </button>

          {/* Title & Patient context */}
          <div className="text-center truncate hidden md:block">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              Informe Clínico de Salud
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {activePatient?.name || 'Paciente'} ({activePatient?.age || '--'} años)
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                copied 
                  ? 'bg-emerald-600 text-white border-emerald-600' 
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
              title="Copiar texto resumen para WhatsApp o consulta"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? '¡Copiado!' : 'Copiar Resumen'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
              title="Imprimir informe en papel o guardar en PDF"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>

            <button
              type="button"
              onClick={handleSafeClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              title="Cerrar informe"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Notice (if direct print is unsupported in current frame) */}
        {printNotice && (
          <div className="no-print mx-4 sm:mx-8 mt-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>{printNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setPrintNotice(null)}
              className="text-amber-600 dark:text-amber-400 font-bold hover:underline"
            >
              Entendido
            </button>
          </div>
        )}

        {/* Printable Document Body */}
        <div className="p-3.5 sm:p-10 space-y-6 text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 min-w-0 break-words">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-slate-900 dark:border-slate-700 pb-4 gap-2">
            <div>
              <div className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                INFORME DE SALUD FAMILIAR · CUIDAFAM PRO
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Generado el {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="font-bold text-sm text-slate-900 dark:text-white">{activePatient?.healthCenter || 'Centro de Salud'}</div>
              <div className="text-slate-500 dark:text-slate-400">Médico: {activePatient?.primaryCareDoctor || 'No indicado'}</div>
            </div>
          </div>

          {/* Patient Details Box */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {activePatient?.avatar ? (
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 shrink-0">
                <img 
                  src={activePatient.avatar} 
                  alt={activePatient.name} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer" 
                />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-xl bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 shrink-0 flex items-center justify-center font-bold text-slate-600 dark:text-slate-200 text-lg">
                {activePatient?.name?.charAt(0) || 'P'}
              </div>
            )}
            <div className="flex-1 grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full min-w-0">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Paciente</span>
                <strong className="text-sm text-slate-900 dark:text-white">{activePatient?.name || 'Paciente'}</strong>
                <div className="text-slate-500 dark:text-slate-400">{activePatient?.nickname} ({activePatient?.age} años)</div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Identificador SIP / DNI</span>
                <strong className="font-mono text-slate-900 dark:text-white">{activePatient?.dniSip || '—'}</strong>
                <div className="text-slate-500 dark:text-slate-400">Grupo: {activePatient?.bloodType || '—'}</div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Contacto Familiar</span>
                <div className="font-medium text-slate-800 dark:text-slate-200">{activePatient?.emergencyContactName || '—'}</div>
                <div className="font-mono text-slate-500 dark:text-slate-400">{activePatient?.emergencyContactPhone || '—'}</div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Alergias Conocidas</span>
                <strong className="text-rose-600 dark:text-rose-400 font-bold">
                  {(activePatient?.allergies?.length ?? 0) > 0 ? activePatient?.allergies?.join(', ') : 'Sin alergias conocidas'}
                </strong>
              </div>
            </div>
          </div>

          {/* Historial Clínico Estructurado: Patologías, Alergias y Antecedentes */}
          <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-teal-600" />
              <span>Historial Médico Clínico Básico</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Patologías Crónicas */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 block mb-2">
                  Patologías Crónicas ({patientPathologies.length})
                </span>
                {patientPathologies.length === 0 ? (
                  <p className="text-slate-400 italic text-[11px]">Sin patologías registradas</p>
                ) : (
                  <ul className="space-y-1.5">
                    {patientPathologies.map(p => (
                      <li key={p.id} className="text-[11px]">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                          <span>{p.name}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            p.status === 'activa' 
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' 
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}>
                            {p.status}
                          </span>
                        </div>
                        {p.diagnosedYear && <div className="text-[10px] text-slate-500">Desde: {p.diagnosedYear}</div>}
                        {p.treatmentSummary && <div className="text-[10px] text-slate-600 dark:text-slate-400">Tto: {p.treatmentSummary}</div>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Alergias y Reacciones */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block mb-2">
                  Alergias y Reacciones ({patientAllergies.length})
                </span>
                {patientAllergies.length === 0 ? (
                  <p className="text-slate-400 italic text-[11px]">Sin alergias conocidas</p>
                ) : (
                  <ul className="space-y-1.5">
                    {patientAllergies.map(a => (
                      <li key={a.id} className="text-[11px]">
                        <div className="font-bold text-rose-700 dark:text-rose-400 flex items-center justify-between">
                          <span>{a.substance}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            a.severity === 'grave' || a.severity === 'anafilaxia'
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {a.severity}
                          </span>
                        </div>
                        {a.reaction && <div className="text-[10px] text-slate-600 dark:text-slate-400">Reacción: {a.reaction}</div>}
                        {a.diagnosedYear && <div className="text-[10px] text-slate-500">Detectada: {a.diagnosedYear}</div>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Antecedentes Relevantes */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 block mb-2">
                  Antecedentes / Cirugías ({patientAntecedents.length})
                </span>
                {patientAntecedents.length === 0 ? (
                  <p className="text-slate-400 italic text-[11px]">Sin antecedentes adicionales</p>
                ) : (
                  <ul className="space-y-1.5">
                    {patientAntecedents.map(ant => (
                      <li key={ant.id} className="text-[11px]">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 mr-1 uppercase">
                            {ant.category}
                          </span>
                          <span>{ant.title}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {ant.yearOrDate ? `Año ${ant.yearOrDate}` : ''}{ant.facilityOrHospital ? ` · ${ant.facilityOrHospital}` : ''}
                        </div>
                        {ant.details && <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">{ant.details}</div>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Blood Pressure Summary & Table */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-600" />
                <span>Registro Ambulatorio de Tensión Arterial (Últimas Tomas)</span>
              </h4>
              <div className="text-slate-600 dark:text-slate-300 font-medium text-xs">
                Medias: <strong className="text-rose-600 dark:text-rose-400">{avgSys}/{avgDia} mmHg</strong> · Pulso medio: <strong className="text-amber-600 dark:text-amber-400">{avgPulse} ppm</strong>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                  <tr>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700">Fecha / Hora</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700">Tensión (mmHg)</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700">Pulso</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700">Momento / Brazo</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700">Clasificación OMS</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700">Notas / Síntomas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {recentReadings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-slate-400">
                        No hay tomas de tensión registradas aún.
                      </td>
                    </tr>
                  ) : (
                    recentReadings.map(r => {
                      const meta = getOMSMeta(r.classification);
                      return (
                        <tr key={r.id}>
                          <td className="p-2 font-mono whitespace-nowrap">{r.date} {r.time}</td>
                          <td className="p-2 font-bold font-mono whitespace-nowrap text-slate-900 dark:text-white">{r.systolic} / {r.diastolic}</td>
                          <td className="p-2 font-mono text-amber-600 dark:text-amber-400">{r.pulse} ppm</td>
                          <td className="p-2 whitespace-nowrap">{r.moment} ({r.arm})</td>
                          <td className="p-2 whitespace-nowrap">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{meta.label}</span>
                          </td>
                          <td className="p-2 text-slate-600 dark:text-slate-400">{r.notes || '—'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Current Medications List */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-blue-600" />
              <span>Tratamiento Farmacológico Activo y Pauta Diaria</span>
            </h4>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                  <tr>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700">Medicamento</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700">Dosis / Forma</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700">Horario / Pauta</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700">Alimentos</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700">Instrucciones / Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {activeMeds.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400">
                        No hay medicaciones activas configuradas.
                      </td>
                    </tr>
                  ) : (
                    activeMeds.map(m => (
                      <tr key={m.id}>
                        <td className="p-2 font-bold text-slate-900 dark:text-white">
                          {m.name}
                          <span className="block text-[10px] text-slate-500 font-normal">{m.activeSubstance}</span>
                        </td>
                        <td className="p-2">{m.dose} ({m.form})</td>
                        <td className="p-2 font-medium">
                          {m.scheduleTimes && m.scheduleTimes.length > 0 
                            ? `${m.scheduleTimes.join(', ')} (${(m.scheduleLabels || []).join(', ')})`
                            : 'Si precisa por dolor'}
                        </td>
                        <td className="p-2">{m.withFood}</td>
                        <td className="p-2 text-slate-600 dark:text-slate-400">{m.instructions || m.prescriptionRef || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Upcoming Appointments */}
          {upcomingApts.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>Próximas Citas y Revisiones Programadas</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {upcomingApts.map(a => (
                  <div key={a.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="font-bold text-slate-900 dark:text-white">{a.specialty} ({a.date} a las {a.time} h)</div>
                    <div className="text-slate-600 dark:text-slate-400">{a.doctor ? `Dr. ${a.doctor}` : 'Especialista'} · {a.facility}</div>
                    {a.reason && <div className="text-[10px] text-slate-500 mt-1">Motivo: {a.reason}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer for physician notes */}
          <div className="pt-6 border-t-2 border-slate-300 dark:border-slate-700 mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-[11px] text-slate-500">
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-300 mb-6">Observaciones y ajustes del Facultativo:</p>
              <div className="border-b border-dashed border-slate-400 h-6"></div>
              <div className="border-b border-dashed border-slate-400 h-6 mt-3"></div>
            </div>
            <div className="sm:text-right">
              <p className="font-semibold text-slate-700 dark:text-slate-300 mb-8 sm:mb-10">Firma y Sello Médico:</p>
              <div className="border-t border-slate-400 w-full sm:w-48 sm:ml-auto text-center pt-1 text-[10px]">
                Firma facultativo / Fecha
              </div>
            </div>
          </div>

        </div>

        {/* ALWAYS-ACCESSIBLE BOTTOM EXIT BAR (Guarantees user never feels trapped at the bottom) */}
        <div className="no-print bg-slate-100 dark:bg-slate-800/90 px-4 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
            ¿Has terminado de consultar el informe? Puedes volver en cualquier momento.
          </div>
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleBackToDashboard}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar e ir al Inicio</span>
            </button>
            <button
              type="button"
              onClick={handleSafeClose}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver atrás</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
