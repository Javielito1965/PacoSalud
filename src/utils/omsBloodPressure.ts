import { OMSCategory, OMSClassification } from '../types';

export const OMS_STANDARDS: Record<OMSCategory, OMSClassification> = {
  optima: {
    category: 'optima',
    label: 'Tensión Óptima',
    description: 'Valores ideales (< 120 / < 80 mmHg). Excelente control cardiovascular.',
    colorClass: 'text-emerald-700 dark:text-emerald-300',
    bgLightClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderColorClass: 'border-emerald-300 dark:border-emerald-800',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700',
  },
  normal: {
    category: 'normal',
    label: 'Tensión Normal',
    description: 'Valores normales (120-129 / 80-84 mmHg). Dentro de los parámetros estándar.',
    colorClass: 'text-teal-700 dark:text-teal-300',
    bgLightClass: 'bg-teal-50 dark:bg-teal-950/40',
    borderColorClass: 'border-teal-300 dark:border-teal-800',
    badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200 border border-teal-300 dark:border-teal-700',
  },
  normal_alta: {
    category: 'normal_alta',
    label: 'Normal - Elevada',
    description: 'Valores fronterizos (130-139 / 85-89 mmHg). Conviene vigilar sal y estrés.',
    colorClass: 'text-amber-700 dark:text-amber-300',
    bgLightClass: 'bg-amber-50 dark:bg-amber-950/40',
    borderColorClass: 'border-amber-300 dark:border-amber-800',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 border border-amber-300 dark:border-amber-700',
  },
  hipertension_1: {
    category: 'hipertension_1',
    label: 'Hipertensión Grado 1',
    description: 'Elevada leve (140-159 / 90-99 mmHg). Comprobar toma de medicación.',
    colorClass: 'text-orange-700 dark:text-orange-300',
    bgLightClass: 'bg-orange-50 dark:bg-orange-950/40',
    borderColorClass: 'border-orange-300 dark:border-orange-800',
    badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200 border border-orange-300 dark:border-orange-700',
  },
  hipertension_2: {
    category: 'hipertension_2',
    label: 'Hipertensión Grado 2',
    description: 'Elevada moderada (160-179 / 100-109 mmHg). Repetir tras 15 min de reposo.',
    colorClass: 'text-rose-700 dark:text-rose-300',
    bgLightClass: 'bg-rose-50 dark:bg-rose-950/40',
    borderColorClass: 'border-rose-300 dark:border-rose-800',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200 border border-rose-300 dark:border-rose-700',
  },
  crisis: {
    category: 'crisis',
    label: 'Crisis Hipertensiva',
    description: 'Peligro (≥ 180 / ≥ 120 mmHg). Avisar al médico o llamar a emergencias.',
    colorClass: 'text-red-700 dark:text-red-300',
    bgLightClass: 'bg-red-50 dark:bg-red-950/50',
    borderColorClass: 'border-red-400 dark:border-red-800',
    badgeClass: 'bg-red-600 text-white dark:bg-red-700 font-bold border border-red-700',
  },
  hipotension: {
    category: 'hipotension',
    label: 'Tensión Baja (Hipotensión)',
    description: 'Valores bajos (< 90 / < 60 mmHg). Cuidado con posibles mareos al incorporarse.',
    colorClass: 'text-blue-700 dark:text-blue-300',
    bgLightClass: 'bg-blue-50 dark:bg-blue-950/40',
    borderColorClass: 'border-blue-300 dark:border-blue-800',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border border-blue-300 dark:border-blue-700',
  },
};

export function classifyBloodPressure(systolic: number, diastolic: number): OMSCategory {
  if (systolic < 90 || diastolic < 60) {
    return 'hipotension';
  }
  if (systolic >= 180 || diastolic >= 120) {
    return 'crisis';
  }
  if (systolic >= 160 || diastolic >= 100) {
    return 'hipertension_2';
  }
  if (systolic >= 140 || diastolic >= 90) {
    return 'hipertension_1';
  }
  if ((systolic >= 130 && systolic <= 139) || (diastolic >= 85 && diastolic <= 89)) {
    return 'normal_alta';
  }
  if ((systolic >= 120 && systolic <= 129) || (diastolic >= 80 && diastolic <= 84)) {
    return 'normal';
  }
  return 'optima';
}

export function getOMSMeta(category: OMSCategory): OMSClassification {
  return OMS_STANDARDS[category] || OMS_STANDARDS.normal;
}
