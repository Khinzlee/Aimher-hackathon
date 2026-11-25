// Disease definitions matching the Aimher symptom-intensity API.
// POST /predictions/from-symptoms returns risk for these 6 diseases.

export interface Disease {
  /** API key, e.g. "Infertility", "Endometrial" */
  key: string;
  name: string;
  fullName: string;
  description: string;
  disclaimer: string;
  icon: string;
  color: string;
}

export const DISEASES: Disease[] = [
  {
    key: 'Infertility',
    name: 'Infertility',
    fullName: 'Infertility Risk',
    description: 'Reproductive risk indicators from symptom intensity',
    disclaimer: 'Model output only — not a diagnosis. Consult a fertility specialist for evaluation.',
    icon: 'Target',
    color: '#8B5CF6',
  },
  {
    key: 'Dysmenorrhea',
    name: 'Dysmenorrhea',
    fullName: 'Dysmenorrhea (Painful Periods)',
    description: 'Menstrual pain severity indicators',
    disclaimer: 'Model output only — severe or worsening pain warrants clinical review.',
    icon: 'Thermometer',
    color: '#F97316',
  },
  {
    key: 'PMDD',
    name: 'PMDD',
    fullName: 'Premenstrual Dysphoric Disorder',
    description: 'Luteal-phase mood and physical symptom indicators',
    disclaimer: 'Model output only — PMDD requires clinical assessment across cycles.',
    icon: 'Moon',
    color: '#6366F1',
  },
  {
    key: 'T2D',
    name: 'T2D',
    fullName: 'Type 2 Diabetes',
    description: 'Metabolic symptom indicators',
    disclaimer: 'Model output only — diabetes diagnosis requires blood tests (e.g. HbA1c).',
    icon: 'Droplets',
    color: '#0EA5E9',
  },
  {
    key: 'CVD',
    name: 'CVD',
    fullName: 'Cardiovascular Disease',
    description: 'Cardiac and autonomic symptom indicators',
    disclaimer: 'Model output only — chest symptoms require urgent medical evaluation.',
    icon: 'HeartPulse',
    color: '#EF4444',
  },
  {
    key: 'Endometrial',
    name: 'Endometrial Cancer',
    fullName: 'Endometrial Cancer',
    description: 'Bleeding and pelvic symptom indicators',
    disclaimer: 'Abnormal bleeding is a red flag — consult a clinician promptly.',
    icon: 'Stethoscope',
    color: '#DC2626',
  },
];

export const DISEASE_MAP: Record<string, Disease> = Object.fromEntries(
  DISEASES.map((d) => [d.key, d])
);

/** Route id used in /conditions/[id] — lowercase disease key */
export function diseaseRouteId(key: string): string {
  return key.toLowerCase();
}

export function diseaseByRouteId(id: string): Disease | undefined {
  const key = id.charAt(0).toUpperCase() + id.slice(1);
  return DISEASES.find((d) => d.key === key);
}

// ─── API payload types (Aimher symptom intensity spec) ──────────────────────

export type CyclePhase = 'Menstrual' | 'Follicular' | 'Ovulatory' | 'Luteal';

export const CYCLE_PHASES: { value: CyclePhase; label: string; days: string }[] = [
  { value: 'Menstrual', label: 'Menstrual', days: 'Days 1–5' },
  { value: 'Follicular', label: 'Follicular', days: 'Days 6–13' },
  { value: 'Ovulatory', label: 'Ovulatory', days: 'Days 14–16' },
  { value: 'Luteal', label: 'Luteal', days: 'Days 17–28' },
];

export function cyclePhaseForDay(day: number): CyclePhase {
  if (day <= 5) return 'Menstrual';
  if (day <= 13) return 'Follicular';
  if (day <= 16) return 'Ovulatory';
  return 'Luteal';
}

export interface SymptomPayload {
  day_of_cycle: number;
  cycle_phase: CyclePhase;
  breast_soreness_vas: number;
  painful_touch_vas: number;
  pelvic_pressure_vas: number;
  bloating_delta_cm: number;
  fatigue_mfi5_vas: number;
  acne_severity_likert: number;
  hirsutism_mfg_score: number;
}

export const EMPTY_PAYLOAD: SymptomPayload = {
  day_of_cycle: 1,
  cycle_phase: 'Follicular',
  breast_soreness_vas: 0,
  painful_touch_vas: 0,
  pelvic_pressure_vas: 0,
  bloating_delta_cm: 0,
  fatigue_mfi5_vas: 0,
  acne_severity_likert: 0,
  hirsutism_mfg_score: 0,
};

// ─── Severity helpers (per API spec enums) ──────────────────────────────────

export interface Severity {
  label: string;
  color: string;
  bg: string;
}

/** probability → Low / Moderate / High (spec: <0.33, <0.66, ≥0.66) */
export function probabilitySeverity(p: number): Severity {
  if (p < 0.33) return { label: 'Low', color: '#16A34A', bg: '#F0FDF4' };
  if (p < 0.66) return { label: 'Moderate', color: '#D97706', bg: '#FFFBEB' };
  return { label: 'High', color: '#DC2626', bg: '#FEF2F2' };
}

/** riskScore → Minimal / Mild / Moderate / Severe (spec: <0.2, <0.4, <0.6, ≥0.6) */
export function riskScoreSeverity(s: number): Severity {
  if (s < 0.2) return { label: 'Minimal', color: '#16A34A', bg: '#F0FDF4' };
  if (s < 0.4) return { label: 'Mild', color: '#2563EB', bg: '#EFF6FF' };
  if (s < 0.6) return { label: 'Moderate', color: '#D97706', bg: '#FFFBEB' };
  return { label: 'Severe', color: '#DC2626', bg: '#FEF2F2' };
}

/** symptomBurdenScore is on a 0-10 scale — reuse VAS bands */
export function burdenSeverity(score: number): Severity {
  const pct = (score / 10) * 100;
  if (pct <= 20) return { label: 'None', color: '#27AE60', bg: '#ECFDF5' };
  if (pct <= 40) return { label: 'Mild', color: '#F39C12', bg: '#FFFBEB' };
  if (pct <= 60) return { label: 'Moderate', color: '#E67E22', bg: '#FFF7ED' };
  if (pct <= 80) return { label: 'Severe', color: '#E74C3C', bg: '#FEF2F2' };
  return { label: 'Extreme', color: '#922B21', bg: '#FEE2E2' };
}
