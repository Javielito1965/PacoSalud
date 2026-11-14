export type OMSCategory = 
  | 'optima'
  | 'normal'
  | 'normal_alta'
  | 'hipertension_1'
  | 'hipertension_2'
  | 'crisis'
  | 'hipotension';

export interface OMSClassification {
  category: OMSCategory;
  label: string;
  description: string;
  colorClass: string;
  bgLightClass: string;
  borderColorClass: string;
  badgeClass: string;
}

export interface PatientProfile {
  id: string;
  name: string;
  nickname: string;
  age: number;
  birthDate: string;
  gender: 'F' | 'M' | 'Otro';
  dniSip: string;
  bloodType: string;
  avatar: string;
  primaryCareDoctor: string;
  healthCenter: string;
  healthCenterPhone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  allergies: string[];
  chronicConditions: string[];
  notes: string;
}

export type MomentOfDay = 
  | 'En ayunas / Mañana'
  | 'Mediodía / Comida'
  | 'Tarde / Merienda'
  | 'Noche / Cena'
  | 'Antes de acostarse'
  | 'Post-ejercicio';

export interface BloodPressureReading {
  id: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  systolic: number; // mmHg
  diastolic: number; // mmHg
  pulse: number; // bpm
  arm: 'Izquierdo' | 'Derecho';
  moment: MomentOfDay;
  notes: string;
  takenBy: string; // e.g. "María (Hija)"
  classification: OMSCategory;
}

export type MedicationForm = 
  | 'Comprimido'
  | 'Cápsula'
  | 'Gotas'
  | 'Inhalador'
  | 'Parche'
  | 'Inyectable'
  | 'Sobres'
  | 'Jarabe';

export type FoodInstruction = 
  | 'En ayunas'
  | 'Con alimentos'
  | 'Después de comer'
  | 'Indiferente';

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  activeSubstance: string;
  dose: string;
  form: MedicationForm;
  scheduleTimes: string[]; // e.g. ["08:30", "20:30"]
  scheduleLabels: string[]; // e.g. ["Desayuno", "Cena"]
  instructions: string;
  withFood: FoodInstruction;
  currentStock: number;
  lowStockThreshold: number;
  prescriptionRef: string;
  active: boolean;
  colorTheme: string; // e.g. "blue", "emerald", "amber", "violet"
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // "08:30"
  slotLabel: string; // "Desayuno"
  status: 'tomada' | 'pendiente' | 'omitida' | 'pospuesta';
  takenAt: string | null; // ISO timestamp
  takenBy: string | null;
  notes: string;
}

export interface MedicalAppointment {
  id: string;
  patientId: string;
  specialty: string;
  doctor: string;
  facility: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  reason: string;
  preparations: string[];
  status: 'pendiente' | 'completada' | 'cancelada';
  postNotes: string;
  phone: string;
}

export interface FamilyCaregiver {
  id: string;
  name: string;
  relation: string;
  phone: string;
  role: 'admin' | 'cuidador';
  isEmergencyContact: boolean;
  notes: string;
}

export interface AppConfig {
  adminPin: string;
  isAdminUnlocked: boolean;
  strictSafetyLock: boolean;
  fontSize: 'normal' | 'large' | 'xlarge';
  theme: 'light' | 'dark';
  emergencyCallNumber: string;
  lastBackupDate: string;
}

export type AllergySeverity = 'leve' | 'moderada' | 'grave' | 'anafilaxia';

export interface ClinicalAllergy {
  id: string;
  patientId: string;
  substance: string; // Fármaco, alimento o sustancia
  severity: AllergySeverity;
  reaction: string; // Síntomas experimentados
  diagnosedYear?: string;
  notes?: string;
}

export type PathologyStatus = 'activa' | 'controlada' | 'en_remision' | 'resuelta';

export interface ClinicalPathology {
  id: string;
  patientId: string;
  name: string; // Nombre de la enfermedad o patología
  status: PathologyStatus;
  diagnosedYear: string;
  treatmentSummary: string; // Tratamiento actual
  doctorNotes?: string;
}

export type AntecedentCategory = 
  | 'quirurgico' 
  | 'hospitalizacion' 
  | 'dispositivo_implante' 
  | 'familiar' 
  | 'habito' 
  | 'otro';

export interface ClinicalAntecedent {
  id: string;
  patientId: string;
  title: string;
  category: AntecedentCategory;
  yearOrDate: string;
  facilityOrHospital?: string;
  details: string;
}
