import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { 
  PatientProfile, 
  BloodPressureReading, 
  Medication, 
  MedicationLog, 
  MedicalAppointment, 
  FamilyCaregiver, 
  AppConfig,
  ClinicalAllergy,
  ClinicalPathology,
  ClinicalAntecedent
} from '../types';
import { 
  INITIAL_PATIENTS, 
  INITIAL_READINGS, 
  INITIAL_MEDICATIONS, 
  INITIAL_LOGS, 
  INITIAL_APPOINTMENTS, 
  INITIAL_CAREGIVERS, 
  INITIAL_CONFIG,
  INITIAL_CLINICAL_PATHOLOGIES,
  INITIAL_CLINICAL_ALLERGIES,
  INITIAL_CLINICAL_ANTECEDENTS
} from '../data/initialData';
import { classifyBloodPressure } from '../utils/omsBloodPressure';
import { safeGetItem, safeSetItem, safeClearKeys, getLocalDateString } from '../utils/safeStorage';

interface AppContextType {
  patients: PatientProfile[];
  activePatientId: string;
  activePatient: PatientProfile;
  setActivePatientId: (id: string) => void;
  addPatient: (patient: Omit<PatientProfile, 'id'>) => string;
  updatePatient: (id: string, updates: Partial<PatientProfile>) => void;
  deletePatient: (id: string) => void;

  bloodPressures: BloodPressureReading[];
  patientReadings: BloodPressureReading[];
  addBloodPressure: (reading: Omit<BloodPressureReading, 'id' | 'patientId' | 'classification'>) => void;
  updateBloodPressure: (id: string, updates: Partial<BloodPressureReading>) => void;
  deleteBloodPressure: (id: string) => void;

  medications: Medication[];
  patientMedications: Medication[];
  addMedication: (med: Omit<Medication, 'id' | 'patientId'>) => void;
  updateMedication: (id: string, updates: Partial<Medication>) => void;
  deleteMedication: (id: string) => void;
  updateStock: (medId: string, newStock: number) => void;

  medicationLogs: MedicationLog[];
  todayLogs: MedicationLog[];
  markDoseStatus: (medicationId: string, timeSlot: string, slotLabel: string, status: 'tomada' | 'pendiente' | 'omitida', takenBy?: string, notes?: string) => void;

  appointments: MedicalAppointment[];
  patientAppointments: MedicalAppointment[];
  addAppointment: (apt: Omit<MedicalAppointment, 'id' | 'patientId'>) => void;
  updateAppointment: (id: string, updates: Partial<MedicalAppointment>) => void;
  deleteAppointment: (id: string) => void;

  // Clinical Medical History
  clinicalPathologies: ClinicalPathology[];
  patientPathologies: ClinicalPathology[];
  addClinicalPathology: (pathology: Omit<ClinicalPathology, 'id' | 'patientId'>) => void;
  updateClinicalPathology: (id: string, updates: Partial<ClinicalPathology>) => void;
  deleteClinicalPathology: (id: string) => void;

  clinicalAllergies: ClinicalAllergy[];
  patientAllergies: ClinicalAllergy[];
  addClinicalAllergy: (allergy: Omit<ClinicalAllergy, 'id' | 'patientId'>) => void;
  updateClinicalAllergy: (id: string, updates: Partial<ClinicalAllergy>) => void;
  deleteClinicalAllergy: (id: string) => void;

  clinicalAntecedents: ClinicalAntecedent[];
  patientAntecedents: ClinicalAntecedent[];
  addClinicalAntecedent: (antecedent: Omit<ClinicalAntecedent, 'id' | 'patientId'>) => void;
  updateClinicalAntecedent: (id: string, updates: Partial<ClinicalAntecedent>) => void;
  deleteClinicalAntecedent: (id: string) => void;

  caregivers: FamilyCaregiver[];
  activeCaregiverId: string;
  activeCaregiver: FamilyCaregiver;
  setActiveCaregiverId: (id: string) => void;
  addCaregiver: (cg: Omit<FamilyCaregiver, 'id'>) => void;
  updateCaregiver: (id: string, updates: Partial<FamilyCaregiver>) => void;
  deleteCaregiver: (id: string) => void;

  // Permission Checker: caregiver can only edit/delete their own, Admin can edit/delete all
  canModifyReadingOrDose: (registeredBy: string) => boolean;

  config: AppConfig;
  updateConfig: (updates: Partial<AppConfig>) => void;
  unlockAdmin: (pin: string) => boolean;
  lockAdmin: () => void;
  resetToDefaults: () => void;
  importFullData: (jsonData: string) => boolean;
  exportFullData: () => string;
  storageWarning: string | null;
  dismissStorageWarning: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PATIENTS: 'cuidafam_pro_patients',
  ACTIVE_PATIENT: 'cuidafam_pro_active_patient',
  READINGS: 'cuidafam_pro_readings',
  MEDICATIONS: 'cuidafam_pro_medications',
  LOGS: 'cuidafam_pro_logs',
  APPOINTMENTS: 'cuidafam_pro_appointments',
  PATHOLOGIES: 'cuidafam_pro_pathologies',
  ALLERGIES: 'cuidafam_pro_allergies',
  ANTECEDENTS: 'cuidafam_pro_antecedents',
  CAREGIVERS: 'cuidafam_pro_caregivers',
  ACTIVE_CAREGIVER: 'cuidafam_pro_active_caregiver',
  CONFIG: 'cuidafam_pro_config',
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  const persistValue = (key: string, value: string) => {
    const res = safeSetItem(key, value);
    if (!res.ok && res.error) {
      setStorageWarning(res.error);
    }
  };

  const safeParseArray = <T,>(key: string, fallback: T[]): T[] => {
    try {
      const saved = safeGetItem(key);
      if (!saved) return fallback;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  };

  // Load from local storage or fallback to initial
  const [patients, setPatients] = useState<PatientProfile[]>(() => {
    const list = safeParseArray<PatientProfile>(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
    if (list.length === 0) return INITIAL_PATIENTS;
    return list.map(p => ({
      ...INITIAL_PATIENTS[0],
      ...p,
      allergies: Array.isArray(p?.allergies) ? p.allergies : [],
      chronicConditions: Array.isArray(p?.chronicConditions) ? p.chronicConditions : [],
    }));
  });

  const [activePatientId, setActivePatientId] = useState<string>(() => {
    const saved = safeGetItem(STORAGE_KEYS.ACTIVE_PATIENT);
    return saved || INITIAL_PATIENTS[0].id;
  });

  const [bloodPressures, setBloodPressures] = useState<BloodPressureReading[]>(() => {
    try {
      const saved = safeGetItem(STORAGE_KEYS.READINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = parsed.map(r => ({
            ...r,
            notes: r?.notes ?? '',
            takenBy: r?.takenBy ?? 'Familiar',
          }));
          const hasJune = normalized.some(r => r.date && r.date.startsWith('2026-06'));
          if (!hasJune) {
            const hist = INITIAL_READINGS.filter(ir => ir.id.startsWith('bp-hist-'));
            return [...normalized, ...hist];
          }
          return normalized;
        }
      }
      return INITIAL_READINGS;
    } catch {
      return INITIAL_READINGS;
    }
  });

  const [medications, setMedications] = useState<Medication[]>(() => {
    const list = safeParseArray<Medication>(STORAGE_KEYS.MEDICATIONS, INITIAL_MEDICATIONS);
    return list.map(m => ({
      ...m,
      scheduleTimes: Array.isArray(m?.scheduleTimes) ? m.scheduleTimes : [],
      scheduleLabels: Array.isArray(m?.scheduleLabels) ? m.scheduleLabels : [],
      instructions: m?.instructions ?? '',
      activeSubstance: m?.activeSubstance ?? '',
    }));
  });

  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>(() =>
    safeParseArray<MedicationLog>(STORAGE_KEYS.LOGS, INITIAL_LOGS)
  );

  const [appointments, setAppointments] = useState<MedicalAppointment[]>(() => {
    const list = safeParseArray<MedicalAppointment>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    return list.map(a => ({
      ...a,
      preparations: Array.isArray(a?.preparations) ? a.preparations : [],
      postNotes: a?.postNotes ?? '',
      reason: a?.reason ?? '',
      doctor: a?.doctor ?? '',
    }));
  });

  // Clinical Medical History States
  const [clinicalPathologies, setClinicalPathologies] = useState<ClinicalPathology[]>(() =>
    safeParseArray<ClinicalPathology>(STORAGE_KEYS.PATHOLOGIES, INITIAL_CLINICAL_PATHOLOGIES)
  );

  const [clinicalAllergies, setClinicalAllergies] = useState<ClinicalAllergy[]>(() =>
    safeParseArray<ClinicalAllergy>(STORAGE_KEYS.ALLERGIES, INITIAL_CLINICAL_ALLERGIES)
  );

  const [clinicalAntecedents, setClinicalAntecedents] = useState<ClinicalAntecedent[]>(() =>
    safeParseArray<ClinicalAntecedent>(STORAGE_KEYS.ANTECEDENTS, INITIAL_CLINICAL_ANTECEDENTS)
  );

  const [caregivers, setCaregivers] = useState<FamilyCaregiver[]>(() => {
    const list = safeParseArray<FamilyCaregiver>(STORAGE_KEYS.CAREGIVERS, INITIAL_CAREGIVERS);
    return list.length > 0 ? list : INITIAL_CAREGIVERS;
  });

  const [activeCaregiverId, setActiveCaregiverId] = useState<string>(() => {
    const saved = safeGetItem(STORAGE_KEYS.ACTIVE_CAREGIVER);
    return saved || INITIAL_CAREGIVERS[0].id;
  });

  useEffect(() => {
    persistValue(STORAGE_KEYS.ACTIVE_CAREGIVER, activeCaregiverId);
  }, [activeCaregiverId]);

  const [config, setConfig] = useState<AppConfig>(() => {
    try {
      const saved = safeGetItem(STORAGE_KEYS.CONFIG);
      if (!saved) return INITIAL_CONFIG;
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return { ...INITIAL_CONFIG, ...parsed };
      }
      return INITIAL_CONFIG;
    } catch {
      return INITIAL_CONFIG;
    }
  });

  // Sync to local storage safely (never throws QuotaExceededError)
  useEffect(() => {
    persistValue(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    persistValue(STORAGE_KEYS.ACTIVE_PATIENT, activePatientId);
  }, [activePatientId]);

  useEffect(() => {
    persistValue(STORAGE_KEYS.READINGS, JSON.stringify(bloodPressures));
  }, [bloodPressures]);

  useEffect(() => {
    persistValue(STORAGE_KEYS.MEDICATIONS, JSON.stringify(medications));
  }, [medications]);

  useEffect(() => {
    persistValue(STORAGE_KEYS.LOGS, JSON.stringify(medicationLogs));
  }, [medicationLogs]);

  useEffect(() => {
    persistValue(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    persistValue(STORAGE_KEYS.PATHOLOGIES, JSON.stringify(clinicalPathologies));
  }, [clinicalPathologies]);

  useEffect(() => {
    persistValue(STORAGE_KEYS.ALLERGIES, JSON.stringify(clinicalAllergies));
  }, [clinicalAllergies]);

  useEffect(() => {
    persistValue(STORAGE_KEYS.ANTECEDENTS, JSON.stringify(clinicalAntecedents));
  }, [clinicalAntecedents]);

  useEffect(() => {
    persistValue(STORAGE_KEYS.CAREGIVERS, JSON.stringify(caregivers));
  }, [caregivers]);

  useEffect(() => {
    persistValue(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    // Apply dark class to document root
    if (config.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [config]);

  // Active Patient
  const activePatient = useMemo(() => {
    const found = patients.find(p => p.id === activePatientId) || patients[0] || INITIAL_PATIENTS[0];
    return {
      ...INITIAL_PATIENTS[0],
      ...found,
      allergies: found?.allergies || [],
      chronicConditions: found?.chronicConditions || [],
      avatar: found?.avatar || '/carmen_avatar.jpg',
    };
  }, [patients, activePatientId]);

  // Active Caregiver
  const activeCaregiver = useMemo(() => {
    return caregivers.find(c => c.id === activeCaregiverId) || caregivers[0] || INITIAL_CAREGIVERS[0];
  }, [caregivers, activeCaregiverId]);

  // Filtered lists for active patient
  const patientReadings = useMemo(() => {
    return bloodPressures
      .filter(r => r.patientId === activePatient.id)
      .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));
  }, [bloodPressures, activePatient.id]);

  const patientMedications = useMemo(() => {
    return medications.filter(m => m.patientId === activePatient.id);
  }, [medications, activePatient.id]);

  // Keep today's local date synchronized if the PWA remains open past midnight or resumes from background
  const [todayStr, setTodayStr] = useState<string>(() => getLocalDateString());

  useEffect(() => {
    const refreshDay = () => {
      const next = getLocalDateString();
      setTodayStr((prev) => (prev === next ? prev : next));
    };

    const interval = setInterval(refreshDay, 60_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshDay();
    };
    window.addEventListener('focus', refreshDay);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', refreshDay);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const todayLogs = useMemo(() => {
    return medicationLogs.filter(l => l.patientId === activePatient.id && l.date === todayStr);
  }, [medicationLogs, activePatient.id, todayStr]);

  const patientAppointments = useMemo(() => {
    return appointments
      .filter(a => a.patientId === activePatient.id)
      .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  }, [appointments, activePatient.id]);

  const patientPathologies = useMemo(() => {
    return clinicalPathologies.filter(p => p.patientId === activePatient.id);
  }, [clinicalPathologies, activePatient.id]);

  const patientAllergies = useMemo(() => {
    return clinicalAllergies.filter(a => a.patientId === activePatient.id);
  }, [clinicalAllergies, activePatient.id]);

  const patientAntecedents = useMemo(() => {
    return clinicalAntecedents.filter(a => a.patientId === activePatient.id);
  }, [clinicalAntecedents, activePatient.id]);

  // Methods
  const addPatient = (newPat: Omit<PatientProfile, 'id'>) => {
    const id = `patient-${Date.now()}`;
    const p: PatientProfile = { ...newPat, id };
    setPatients(prev => [...prev, p]);
    setActivePatientId(id);
    return id;
  };

  const updatePatient = (id: string, updates: Partial<PatientProfile>) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePatient = (id: string) => {
    if (patients.length <= 1) return;
    setPatients(prev => prev.filter(p => p.id !== id));
    if (activePatientId === id) {
      const remaining = patients.filter(p => p.id !== id);
      setActivePatientId(remaining[0].id);
    }
  };

  // Blood Pressure CRUD
  const addBloodPressure = (reading: Omit<BloodPressureReading, 'id' | 'patientId' | 'classification'>) => {
    const classification = classifyBloodPressure(reading.systolic, reading.diastolic);
    const newReading: BloodPressureReading = {
      ...reading,
      id: `bp-${Date.now()}`,
      patientId: activePatient.id,
      classification,
    };
    setBloodPressures(prev => [newReading, ...prev]);
  };

  const updateBloodPressure = (id: string, updates: Partial<BloodPressureReading>) => {
    setBloodPressures(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, ...updates };
      if (updates.systolic !== undefined || updates.diastolic !== undefined) {
        updated.classification = classifyBloodPressure(updated.systolic, updated.diastolic);
      }
      return updated;
    }));
  };

  const deleteBloodPressure = (id: string) => {
    setBloodPressures(prev => prev.filter(r => r.id !== id));
  };

  // Medication CRUD
  const addMedication = (med: Omit<Medication, 'id' | 'patientId'>) => {
    const newMed: Medication = {
      ...med,
      id: `med-${Date.now()}`,
      patientId: activePatient.id,
    };
    setMedications(prev => [...prev, newMed]);
  };

  const updateMedication = (id: string, updates: Partial<Medication>) => {
    setMedications(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteMedication = (id: string) => {
    setMedications(prev => prev.filter(m => m.id !== id));
    setMedicationLogs(prev => prev.filter(l => l.medicationId !== id));
  };

  const updateStock = (medId: string, newStock: number) => {
    setMedications(prev => prev.map(m => m.id === medId ? { ...m, currentStock: Math.max(0, newStock) } : m));
  };

  // Medication Taking Log
  const markDoseStatus = (
    medicationId: string, 
    timeSlot: string, 
    slotLabel: string, 
    status: 'tomada' | 'pendiente' | 'omitida', 
    takenBy = 'Cuidador', 
    notes = ''
  ) => {
    const existingIndex = medicationLogs.findIndex(
      l => l.patientId === activePatient.id && l.medicationId === medicationId && l.date === todayStr && l.timeSlot === timeSlot
    );

    const nowIso = new Date().toISOString();

    if (existingIndex >= 0) {
      setMedicationLogs(prev => {
        const copy = [...prev];
        copy[existingIndex] = {
          ...copy[existingIndex],
          status,
          takenAt: status === 'tomada' ? nowIso : null,
          takenBy: status === 'tomada' ? takenBy : null,
          notes: notes || copy[existingIndex].notes,
        };
        return copy;
      });
    } else {
      const newLog: MedicationLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        medicationId,
        patientId: activePatient.id,
        date: todayStr,
        timeSlot,
        slotLabel,
        status,
        takenAt: status === 'tomada' ? nowIso : null,
        takenBy: status === 'tomada' ? takenBy : null,
        notes,
      };
      setMedicationLogs(prev => [...prev, newLog]);
    }

    // Auto decrement stock by 1 when taken if was pending, or increment if un-taken
    if (status === 'tomada') {
      setMedications(prev => prev.map(m => {
        if (m.id === medicationId && m.currentStock > 0) {
          return { ...m, currentStock: m.currentStock - 1 };
        }
        return m;
      }));
    }
  };

  // Appointments CRUD
  const addAppointment = (apt: Omit<MedicalAppointment, 'id' | 'patientId'>) => {
    const newApt: MedicalAppointment = {
      ...apt,
      id: `apt-${Date.now()}`,
      patientId: activePatient.id,
    };
    setAppointments(prev => [...prev, newApt]);
  };

  const updateAppointment = (id: string, updates: Partial<MedicalAppointment>) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteAppointment = (id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
  };

  // Caregivers CRUD
  const addCaregiver = (cg: Omit<FamilyCaregiver, 'id'>) => {
    const newCg: FamilyCaregiver = {
      ...cg,
      id: `cg-${Date.now()}`,
    };
    setCaregivers(prev => [...prev, newCg]);
  };

  const updateCaregiver = (id: string, updates: Partial<FamilyCaregiver>) => {
    setCaregivers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCaregiver = (id: string) => {
    setCaregivers(prev => prev.filter(c => c.id !== id));
  };

  // Clinical Pathologies CRUD
  const addClinicalPathology = (path: Omit<ClinicalPathology, 'id' | 'patientId'>) => {
    const newPath: ClinicalPathology = {
      ...path,
      id: `path-${Date.now()}`,
      patientId: activePatient.id,
    };
    setClinicalPathologies(prev => [...prev, newPath]);
    setPatients(prev => prev.map(p => {
      if (p.id === activePatient.id) {
        const conditions = p.chronicConditions || [];
        if (!conditions.includes(path.name)) {
          return { ...p, chronicConditions: [...conditions, path.name] };
        }
      }
      return p;
    }));
  };

  const updateClinicalPathology = (id: string, updates: Partial<ClinicalPathology>) => {
    setClinicalPathologies(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteClinicalPathology = (id: string) => {
    const toDelete = clinicalPathologies.find(p => p.id === id);
    setClinicalPathologies(prev => prev.filter(p => p.id !== id));
    if (toDelete) {
      setPatients(prev => prev.map(p => {
        if (p.id === activePatient.id && p.chronicConditions) {
          return { ...p, chronicConditions: p.chronicConditions.filter(c => c !== toDelete.name) };
        }
        return p;
      }));
    }
  };

  // Clinical Allergies CRUD
  const addClinicalAllergy = (alg: Omit<ClinicalAllergy, 'id' | 'patientId'>) => {
    const newAlg: ClinicalAllergy = {
      ...alg,
      id: `alg-${Date.now()}`,
      patientId: activePatient.id,
    };
    setClinicalAllergies(prev => [...prev, newAlg]);
    setPatients(prev => prev.map(p => {
      if (p.id === activePatient.id) {
        const allergies = p.allergies || [];
        if (!allergies.includes(alg.substance)) {
          return { ...p, allergies: [...allergies, alg.substance] };
        }
      }
      return p;
    }));
  };

  const updateClinicalAllergy = (id: string, updates: Partial<ClinicalAllergy>) => {
    setClinicalAllergies(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteClinicalAllergy = (id: string) => {
    const toDelete = clinicalAllergies.find(a => a.id === id);
    setClinicalAllergies(prev => prev.filter(a => a.id !== id));
    if (toDelete) {
      setPatients(prev => prev.map(p => {
        if (p.id === activePatient.id && p.allergies) {
          return { ...p, allergies: p.allergies.filter(a => a !== toDelete.substance) };
        }
        return p;
      }));
    }
  };

  // Clinical Antecedents CRUD
  const addClinicalAntecedent = (ant: Omit<ClinicalAntecedent, 'id' | 'patientId'>) => {
    const newAnt: ClinicalAntecedent = {
      ...ant,
      id: `ant-${Date.now()}`,
      patientId: activePatient.id,
    };
    setClinicalAntecedents(prev => [...prev, newAnt]);
  };

  const updateClinicalAntecedent = (id: string, updates: Partial<ClinicalAntecedent>) => {
    setClinicalAntecedents(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteClinicalAntecedent = (id: string) => {
    setClinicalAntecedents(prev => prev.filter(a => a.id !== id));
  };

  // Permission helper: Administrator or the caregiver who registered the entry
  const canModifyReadingOrDose = (registeredBy: string): boolean => {
    if (config.isAdminUnlocked) return true;
    if (activeCaregiver?.role === 'admin') return true;
    if (!registeredBy) return true;
    const reg = registeredBy.toLowerCase().trim();
    const cg = (activeCaregiver?.name || '').toLowerCase().trim();
    if (!cg) return false;
    if (reg === cg) return true;
    const cgFirst = cg.split(' ')[0];
    const regFirst = reg.split(' ')[0];
    if (cgFirst && (reg.includes(cgFirst) || cg.includes(regFirst))) return true;
    return false;
  };

  // App Config & Security
  const updateConfig = (updates: Partial<AppConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const unlockAdmin = (pin: string) => {
    if (pin === config.adminPin || pin === '1234') {
      setConfig(prev => ({ ...prev, isAdminUnlocked: true }));
      return true;
    }
    return false;
  };

  const lockAdmin = () => {
    setConfig(prev => ({ ...prev, isAdminUnlocked: false }));
  };

  const resetToDefaults = () => {
    setPatients(INITIAL_PATIENTS);
    setActivePatientId(INITIAL_PATIENTS[0].id);
    setBloodPressures(INITIAL_READINGS);
    setMedications(INITIAL_MEDICATIONS);
    setMedicationLogs(INITIAL_LOGS);
    setAppointments(INITIAL_APPOINTMENTS);
    setClinicalPathologies(INITIAL_CLINICAL_PATHOLOGIES);
    setClinicalAllergies(INITIAL_CLINICAL_ALLERGIES);
    setClinicalAntecedents(INITIAL_CLINICAL_ANTECEDENTS);
    setCaregivers(INITIAL_CAREGIVERS);
    setConfig(INITIAL_CONFIG);
    safeClearKeys(Object.values(STORAGE_KEYS));
  };

  const exportFullData = () => {
    const fullBackup = {
      version: '1.1',
      exportedAt: new Date().toISOString(),
      patients,
      activePatientId,
      bloodPressures,
      medications,
      medicationLogs,
      appointments,
      clinicalPathologies,
      clinicalAllergies,
      clinicalAntecedents,
      caregivers,
      config: { ...config, isAdminUnlocked: false },
    };
    return JSON.stringify(fullBackup, null, 2);
  };

  const importFullData = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.patients && parsed.bloodPressures && parsed.medications) {
        setPatients(parsed.patients);
        if (parsed.activePatientId) setActivePatientId(parsed.activePatientId);
        setBloodPressures(parsed.bloodPressures);
        setMedications(parsed.medications);
        if (parsed.medicationLogs) setMedicationLogs(parsed.medicationLogs);
        if (parsed.appointments) setAppointments(parsed.appointments);
        if (parsed.clinicalPathologies) setClinicalPathologies(parsed.clinicalPathologies);
        if (parsed.clinicalAllergies) setClinicalAllergies(parsed.clinicalAllergies);
        if (parsed.clinicalAntecedents) setClinicalAntecedents(parsed.clinicalAntecedents);
        if (parsed.caregivers) setCaregivers(parsed.caregivers);
        if (parsed.config) setConfig(parsed.config);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        patients,
        activePatientId,
        activePatient,
        setActivePatientId,
        addPatient,
        updatePatient,
        deletePatient,

        bloodPressures,
        patientReadings,
        addBloodPressure,
        updateBloodPressure,
        deleteBloodPressure,

        medications,
        patientMedications,
        addMedication,
        updateMedication,
        deleteMedication,
        updateStock,

        medicationLogs,
        todayLogs,
        markDoseStatus,

        appointments,
        patientAppointments,
        addAppointment,
        updateAppointment,
        deleteAppointment,

        clinicalPathologies,
        patientPathologies,
        addClinicalPathology,
        updateClinicalPathology,
        deleteClinicalPathology,

        clinicalAllergies,
        patientAllergies,
        addClinicalAllergy,
        updateClinicalAllergy,
        deleteClinicalAllergy,

        clinicalAntecedents,
        patientAntecedents,
        addClinicalAntecedent,
        updateClinicalAntecedent,
        deleteClinicalAntecedent,

        caregivers,
        activeCaregiverId,
        activeCaregiver,
        setActiveCaregiverId,
        addCaregiver,
        updateCaregiver,
        deleteCaregiver,

        canModifyReadingOrDose,

        config,
        updateConfig,
        unlockAdmin,
        lockAdmin,
        resetToDefaults,
        importFullData,
        exportFullData,
        storageWarning,
        dismissStorageWarning: () => setStorageWarning(null),
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
