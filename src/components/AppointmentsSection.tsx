import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MedicalAppointment } from '../types';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  PhoneCall, 
  FileText, 
  AlertCircle, 
  X, 
  Check, 
  ShieldAlert,
  CalendarDays,
  UserCheck
} from 'lucide-react';
import { AdminPinModal } from './AdminPinModal';

export const AppointmentsSection: React.FC = () => {
  const { 
    activePatient, 
    patientAppointments, 
    addAppointment, 
    updateAppointment, 
    deleteAppointment, 
    config 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingApt, setEditingApt] = useState<MedicalAppointment | null>(null);
  const [completingApt, setCompletingApt] = useState<MedicalAppointment | null>(null);
  const [postConsultationNotes, setPostConsultationNotes] = useState('');
  const [aptToDelete, setAptToDelete] = useState<string | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Form state
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 7);
  const defaultDateStr = defaultDate.toISOString().split('T')[0];

  const [formSpecialty, setFormSpecialty] = useState('Cardiología');
  const [formDoctor, setFormDoctor] = useState('');
  const [formFacility, setFormFacility] = useState('Hospital General Universitario');
  const [formDate, setFormDate] = useState(defaultDateStr);
  const [formTime, setFormTime] = useState('10:30');
  const [formReason, setFormReason] = useState('');
  const [formPreparations, setFormPreparations] = useState('Llevar tarjeta sanitaria SIP, Llevar informe de tensión');
  const [formPhone, setFormPhone] = useState('+34 965 14 00 00');

  // Segregate upcoming vs completed
  const upcomingList = useMemo(() => {
    return patientAppointments
      .filter(a => a.status === 'pendiente')
      .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  }, [patientAppointments]);

  const historyList = useMemo(() => {
    return patientAppointments
      .filter(a => a.status === 'completada' || a.status === 'cancelada')
      .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));
  }, [patientAppointments]);

  const getDaysDiff = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return 0;
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleOpenAdd = () => {
    setEditingApt(null);
    setFormSpecialty('Cardiología');
    setFormDoctor('');
    setFormFacility(activePatient.healthCenter || 'Hospital General');
    setFormDate(defaultDateStr);
    setFormTime('10:00');
    setFormReason('');
    setFormPreparations('Llevar tarjeta sanitaria SIP y DNI');
    setFormPhone(activePatient.healthCenterPhone || '+34 965 14 00 00');
    setShowAddModal(true);
  };

  const handleOpenEdit = (apt: MedicalAppointment) => {
    if (!config.isAdminUnlocked && config.strictSafetyLock) {
      setPendingAction(() => () => openEditDirect(apt));
      setShowPinModal(true);
      return;
    }
    openEditDirect(apt);
  };

  const openEditDirect = (apt: MedicalAppointment) => {
    setEditingApt(apt);
    setFormSpecialty(apt.specialty);
    setFormDoctor(apt.doctor);
    setFormFacility(apt.facility);
    setFormDate(apt.date);
    setFormTime(apt.time);
    setFormReason(apt.reason);
    setFormPreparations((apt.preparations || []).join(', '));
    setFormPhone(apt.phone);
    setShowAddModal(true);
  };

  const handleDeletePrompt = (id: string) => {
    if (!config.isAdminUnlocked && config.strictSafetyLock) {
      setPendingAction(() => () => setAptToDelete(id));
      setShowPinModal(true);
      return;
    }
    setAptToDelete(id);
  };

  const confirmDelete = () => {
    if (aptToDelete) {
      deleteAppointment(aptToDelete);
      setAptToDelete(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prepArray = formPreparations
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);

    if (editingApt) {
      updateAppointment(editingApt.id, {
        specialty: formSpecialty,
        doctor: formDoctor,
        facility: formFacility,
        date: formDate,
        time: formTime,
        reason: formReason,
        preparations: prepArray,
        phone: formPhone,
      });
    } else {
      addAppointment({
        specialty: formSpecialty,
        doctor: formDoctor,
        facility: formFacility,
        date: formDate,
        time: formTime,
        reason: formReason,
        preparations: prepArray,
        status: 'pendiente',
        postNotes: '',
        phone: formPhone,
      });
    }
    setShowAddModal(false);
  };

  const handleCompletePrompt = (apt: MedicalAppointment) => {
    setCompletingApt(apt);
    setPostConsultationNotes(apt.postNotes || '');
  };

  const handleSaveCompleted = () => {
    if (completingApt) {
      updateAppointment(completingApt.id, {
        status: 'completada',
        postNotes: postConsultationNotes,
      });
      setCompletingApt(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Agenda Médica y Especialistas
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight break-words">
            Citas Médicas y Revisiones
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Especialistas, preparación de pruebas, cuenta atrás y notas post-consulta
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Segmented control */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'upcoming'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>Próximas ({upcomingList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Historial ({historyList.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Agendar Cita</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'upcoming' ? (
        
        <div className="space-y-4">
          {upcomingList.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-800 text-slate-500 text-xs">
              No hay citas médicas próximas pendientes.
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="px-4 py-2 rounded-xl bg-amber-600 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Programar una cita médica</span>
                </button>
              </div>
            </div>
          ) : (
            upcomingList.map(apt => {
              const daysDiff = getDaysDiff(apt.date);

              return (
                <div
                  key={apt.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all min-w-0 overflow-hidden break-words"
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    
                    {/* Left: Specialty & Doctor */}
                    <div className="flex items-start gap-3 sm:gap-4 min-w-0 w-full lg:w-auto">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-900/60">
                        <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white break-words">
                            {apt.specialty}
                          </h3>
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shrink-0">
                            {daysDiff === 0 
                              ? '¡Hoy!' 
                              : daysDiff === 1 
                                ? 'Mañana' 
                                : `En ${daysDiff} días`}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5 break-words">
                          {apt.doctor ? `Dr/a. ${apt.doctor}` : 'Especialista asignado'}
                        </div>
                      </div>
                    </div>

                    {/* Date and time badges */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        <span>{apt.date}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 font-mono tabular-nums">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>{apt.time} h</span>
                      </div>

                      {apt.phone && (
                        <a
                          href={`tel:${apt.phone}`}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                          title="Llamar al centro médico"
                        >
                          <PhoneCall className="w-3.5 h-3.5 text-teal-600" />
                          <span className="hidden sm:inline">Llamar centro</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Body details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-900 dark:text-slate-100">Lugar y Consulta:</strong>{' '}
                          <span>{apt.facility}</span>
                        </div>
                      </div>

                      {apt.reason && (
                        <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                          <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-slate-900 dark:text-slate-100">Motivo:</strong>{' '}
                            <span>{apt.reason}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Preparations checklist */}
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Preparación y documentos necesarios:</span>
                      </div>
                      <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                        {(apt.preparations || []).map((prep, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-amber-600 font-bold">•</span>
                            <span className="break-words">{prep}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                  </div>

                  {/* Actions bar */}
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => handleCompletePrompt(apt)}
                      className="w-full sm:w-auto px-3.5 py-2 sm:py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors text-center"
                    >
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Marcar realizada y añadir notas</span>
                    </button>

                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(apt)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Modificar cita"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePrompt(apt.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Eliminar cita (requiere Admin)"
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

      ) : (

        /* Past Appointments / History View */
        <div className="space-y-4">
          {historyList.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-800 text-slate-500 text-xs">
              No hay historial de citas anteriores registradas aún.
            </div>
          ) : (
            historyList.map(apt => (
              <div
                key={apt.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm min-w-0 overflow-hidden break-words"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                        Completada
                      </span>
                      <h4 className="font-bold text-base text-slate-900 dark:text-white break-words">
                        {apt.specialty}
                      </h4>
                      <span className="text-xs text-slate-500 break-words">
                        {apt.doctor ? `(${apt.doctor})` : ''}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 break-words">
                      Fecha de consulta: {apt.date} · {apt.facility}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeletePrompt(apt.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                    title="Eliminar del historial"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Doctor's Post Consultation Notes */}
                <div className="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-900/60 text-xs">
                  <div className="font-semibold text-teal-900 dark:text-teal-200 mb-1 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                    <span>Informe y recomendaciones del médico para la familia:</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {apt.postNotes || 'Sin notas añadidas al finalizar la consulta.'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

      )}

      {/* Add / Edit Appointment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-base truncate">
                    {editingApt ? 'Modificar Cita Médica' : 'Agendar Nueva Cita'}
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
              
              {/* Specialty & Doctor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Especialidad Médica *
                  </label>
                  <input
                    type="text"
                    required
                    value={formSpecialty}
                    onChange={(e) => setFormSpecialty(e.target.value)}
                    placeholder="Ej: Cardiología, Traumatología..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Doctor / Especialista
                  </label>
                  <input
                    type="text"
                    value={formDoctor}
                    onChange={(e) => setFormDoctor(e.target.value)}
                    placeholder="Ej: Dr. Vicens, Dra. Ramos..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Facility & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hospital / Centro de Salud y Consulta *
                  </label>
                  <input
                    type="text"
                    required
                    value={formFacility}
                    onChange={(e) => setFormFacility(e.target.value)}
                    placeholder="Ej: Hospital General, Consulta 304"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono del Centro
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+34 965 14 00 00"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fecha de la cita *
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
                    Hora *
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

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Motivo de la consulta
                </label>
                <input
                  type="text"
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="Ej: Revisión semestral de tensión arterial"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              {/* Preparations */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Preparativos previos (separados por coma)
                </label>
                <textarea
                  value={formPreparations}
                  onChange={(e) => setFormPreparations(e.target.value)}
                  placeholder="Ej: Ir en ayunas de 8h, Llevar informe de tensión, Llevar radiografía"
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
                  className="px-5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition-colors"
                >
                  {editingApt ? 'Guardar Cambios' : 'Agendar Cita'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Complete Appointment Modal (with Doctor Notes) */}
      {completingApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-2xl border border-teal-200 dark:border-teal-900 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 text-teal-600 mb-3">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="font-bold text-base">Completar Consulta Médica</h3>
                <p className="text-xs text-slate-500">{completingApt.specialty} con {completingApt.doctor}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              Registra un resumen de lo que ha indicado el especialista para que los demás familiares y cuidadores estén al tanto.
            </p>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Conclusiones, cambios de dosis o próxima revisión:
              </label>
              <textarea
                value={postConsultationNotes}
                onChange={(e) => setPostConsultationNotes(e.target.value)}
                placeholder="Ej: Mantiene Enalapril. Tensión controlada. Pide analítica de control dentro de 3 meses."
                rows={4}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCompletingApt(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveCompleted}
                className="px-4 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs"
              >
                Guardar y Marcar Completada
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {aptToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-rose-200 dark:border-rose-900 text-slate-900 dark:text-slate-100">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base">¿Eliminar esta cita?</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
              Esta acción borrará la cita de la agenda familiar de salud.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setAptToDelete(null)}
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
        title="Acceso de Administrador"
        description="Se requiere el PIN de administración familiar para modificar o cancelar citas médicas programadas."
      />

    </div>
  );
};
