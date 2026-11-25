// Symptom intensity logging — domain definitions.
// UI-only for now: the service layer (symptomService.ts) is async so it can
// be swapped for real API calls once the backend is ready.

export interface Symptom {
  id: string;
  label: string;
  description: string;
  lowLabel: string;
  highLabel: string;
  /** lucide-react icon name key used by the UI */
  icon: string;
}

export interface Condition {
  id: string;
  name: string;
  fullName: string;
  description: string;
  /** clinical disclaimer shown on the card */
  disclaimer: string;
  /** icon key */
  icon: string;
  /** tailwind-friendly accent hex */
  color: string;
  symptomIds: string[];
  /** symptom id that acts as a red flag when intensity >= redFlagThreshold */
  redFlagSymptomId?: string;
  redFlagThreshold?: number;
  redFlagMessage?: string;
}

export const SYMPTOMS: Symptom[] = [
  // Infertility
  { id: 'cycle_irregularity', label: 'Cycle Irregularity', description: 'How irregular have your periods been?', lowLabel: 'Very regular', highLabel: 'Very irregular', icon: 'Calendar' },
  { id: 'pelvic_pain', label: 'Pelvic Pain', description: 'Lower abdominal or pelvic discomfort', lowLabel: 'No pain', highLabel: 'Severe', icon: 'Activity' },
  { id: 'low_libido', label: 'Low Libido', description: 'Reduced sexual desire', lowLabel: 'Normal', highLabel: 'Very low', icon: 'Heart' },
  // Dysmenorrhea
  { id: 'period_cramps', label: 'Period Cramps', description: 'Painful uterine cramping during your period', lowLabel: 'None', highLabel: 'Severe', icon: 'Thermometer' },
  { id: 'back_pain', label: 'Lower Back Pain', description: 'Lower back pain around your period', lowLabel: 'None', highLabel: 'Severe', icon: 'Bone' },
  { id: 'pain_interference', label: 'Pain Interference', description: 'How much does period pain disrupt daily activities?', lowLabel: 'Not at all', highLabel: 'Unable to function', icon: 'AlertCircle' },
  // PMDD
  { id: 'mood_swings', label: 'Mood Swings', description: 'Rapid or intense mood changes before your period', lowLabel: 'Stable', highLabel: 'Extreme', icon: 'Smile' },
  { id: 'irritability', label: 'Irritability', description: 'Feeling on edge or easily angered', lowLabel: 'Calm', highLabel: 'Very irritable', icon: 'Frown' },
  { id: 'sleep_disruption', label: 'Sleep Disruption', description: 'Trouble sleeping in the week before your period', lowLabel: 'Sleeping well', highLabel: 'Severe insomnia', icon: 'Moon' },
  // T2D
  { id: 'fatigue', label: 'Fatigue', description: 'Unexplained tiredness or low energy', lowLabel: 'Energized', highLabel: 'Exhausted', icon: 'Zap' },
  { id: 'thirst_hunger', label: 'Thirst / Hunger', description: 'Excessive thirst or increased appetite', lowLabel: 'Normal', highLabel: 'Very high', icon: 'Droplets' },
  { id: 'energy_crashes', label: 'Energy Crashes', description: 'Sudden drops in energy after meals', lowLabel: 'Stable', highLabel: 'Frequent crashes', icon: 'BatteryLow' },
  // CVD
  { id: 'chest_discomfort', label: 'Chest Discomfort', description: 'Pressure, tightness, or pain in the chest', lowLabel: 'None', highLabel: 'Severe', icon: 'HeartPulse' },
  { id: 'shortness_of_breath', label: 'Shortness of Breath', description: 'Breathlessness during light activity or at rest', lowLabel: 'None', highLabel: 'Severe', icon: 'Wind' },
  { id: 'palpitations', label: 'Palpitations', description: 'Noticeable irregular or racing heartbeat', lowLabel: 'None', highLabel: 'Frequent', icon: 'Activity' },
  // Endometrial Cancer
  { id: 'abnormal_bleeding', label: 'Abnormal Bleeding', description: 'Bleeding between periods or after menopause', lowLabel: 'None', highLabel: 'Heavy', icon: 'Droplet' },
  { id: 'pelvic_pressure_mass', label: 'Pelvic Pressure / Mass', description: 'Feeling of fullness or pressure in the pelvis', lowLabel: 'None', highLabel: 'Severe', icon: 'CircleDot' },
  { id: 'pelvic_pain_ec', label: 'Pelvic / Lower Abdominal Pain', description: 'Persistent pain in the pelvis or lower abdomen', lowLabel: 'None', highLabel: 'Severe', icon: 'Stethoscope' },
];

export const CONDITIONS: Condition[] = [
  {
    id: 'infertility',
    name: 'Infertility',
    fullName: 'Infertility Risk',
    description: 'Indicators associated with reduced fertility',
    disclaimer: 'Symptom burden only — not a fertility diagnosis. Cycle tracking and clinical evaluation are needed.',
    icon: 'Target',
    color: '#8B5CF6',
    symptomIds: ['cycle_irregularity', 'pelvic_pain', 'low_libido'],
  },
  {
    id: 'dysmenorrhea',
    name: 'Dysmenorrhea',
    fullName: 'Dysmenorrhea (Painful Periods)',
    description: 'Severity of menstrual pain and its impact',
    disclaimer: 'Symptom burden only — severe or worsening pain warrants clinical review.',
    icon: 'Thermometer',
    color: '#F97316',
    symptomIds: ['period_cramps', 'back_pain', 'pain_interference'],
  },
  {
    id: 'pmdd',
    name: 'PMDD',
    fullName: 'Premenstrual Dysphoric Disorder',
    description: 'Luteal-phase mood and sleep disturbance',
    disclaimer: 'Symptom burden only — PMDD requires clinical assessment across at least two cycles.',
    icon: 'Moon',
    color: '#6366F1',
    symptomIds: ['mood_swings', 'irritability', 'sleep_disruption'],
  },
  {
    id: 't2d',
    name: 'T2D',
    fullName: 'Type 2 Diabetes',
    description: 'Metabolic symptom indicators',
    disclaimer: 'Symptom burden only — diabetes diagnosis requires blood tests (e.g. HbA1c).',
    icon: 'Droplets',
    color: '#0EA5E9',
    symptomIds: ['fatigue', 'thirst_hunger', 'energy_crashes'],
  },
  {
    id: 'cvd',
    name: 'CVD',
    fullName: 'Cardiovascular Disease',
    description: 'Cardiac symptom indicators',
    disclaimer: 'Symptom burden only — chest symptoms require urgent medical evaluation.',
    icon: 'HeartPulse',
    color: '#EF4444',
    symptomIds: ['chest_discomfort', 'shortness_of_breath', 'palpitations'],
    redFlagSymptomId: 'chest_discomfort',
    redFlagThreshold: 7,
    redFlagMessage: 'High chest discomfort reported — if this is happening now, seek emergency care.',
  },
  {
    id: 'endometrial',
    name: 'Endometrial Cancer',
    fullName: 'Endometrial Cancer',
    description: 'Bleeding and pelvic symptom indicators',
    disclaimer: 'Abnormal bleeding is a red flag — consult a clinician promptly. Symptom logging cannot screen for cancer.',
    icon: 'Stethoscope',
    color: '#DC2626',
    symptomIds: ['abnormal_bleeding', 'pelvic_pressure_mass', 'pelvic_pain_ec'],
    redFlagSymptomId: 'abnormal_bleeding',
    redFlagThreshold: 4,
    redFlagMessage: 'Abnormal bleeding reported — please consult a clinician.',
  },
];

export const SYMPTOM_MAP: Record<string, Symptom> = Object.fromEntries(
  SYMPTOMS.map((s) => [s.id, s])
);

export const CONDITION_MAP: Record<string, Condition> = Object.fromEntries(
  CONDITIONS.map((c) => [c.id, c])
);

export interface Severity {
  label: string;
  color: string;
  bg: string;
}

/** 0–10 intensity → severity band (matches Aimher check-in thresholds) */
export function getSeverity(value: number): Severity {
  const pct = (value / 10) * 100;
  if (pct <= 20) return { label: 'None', color: '#27AE60', bg: '#ECFDF5' };
  if (pct <= 40) return { label: 'Mild', color: '#F39C12', bg: '#FFFBEB' };
  if (pct <= 60) return { label: 'Moderate', color: '#E67E22', bg: '#FFF7ED' };
  if (pct <= 80) return { label: 'Severe', color: '#E74C3C', bg: '#FEF2F2' };
  return { label: 'Extreme', color: '#922B21', bg: '#FEE2E2' };
}

export function getConditionSymptoms(condition: Condition): Symptom[] {
  return condition.symptomIds
    .map((id) => SYMPTOM_MAP[id])
    .filter((s): s is Symptom => Boolean(s));
}

/** Aggregate a condition's burden from a flat symptom->value map (0–10 scale) */
export function computeConditionBurden(
  condition: Condition,
  values: Record<string, number>
): number | null {
  const present = condition.symptomIds
    .map((id) => values[id])
    .filter((v): v is number => typeof v === 'number');
  if (present.length === 0) return null;
  return present.reduce((a, b) => a + b, 0) / present.length;
}

// ─── API spec model (backend contract) ─────────────────────────────────────
// POST /symptoms and POST /predictions/from-symptoms use these 9 fields.

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

/** Disease keys returned by POST /predictions/from-symptoms */
export const API_DISEASE_KEYS = [
  'Infertility',
  'Dysmenorrhea',
  'PMDD',
  'T2D',
  'CVD',
  'Endometrial',
] as const;

export type ApiDiseaseKey = (typeof API_DISEASE_KEYS)[number];

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

/** symptomBurdenScore is on a 0–10 scale — reuse VAS bands */
export function burdenSeverity(score: number): Severity {
  return getSeverity(score);
}

/** Map an API disease key to the UI condition id used in /conditions/[id] */
export function diseaseRouteId(key: string): string {
  const map: Record<string, string> = {
    Infertility: 'infertility',
    Dysmenorrhea: 'dysmenorrhea',
    PMDD: 'pmdd',
    T2D: 't2d',
    CVD: 'cvd',
    Endometrial: 'endometrial',
  };
  return map[key] ?? key.toLowerCase();
}

// ─── Disease view-models for prediction UI ─────────────────────────────────

export interface DiseaseInfo extends Condition {
  /** API prediction key, e.g. "Infertility", "Endometrial" */
  key: string;
}

const API_KEY_BY_CONDITION: Record<string, string> = {
  infertility: 'Infertility',
  dysmenorrhea: 'Dysmenorrhea',
  pmdd: 'PMDD',
  t2d: 'T2D',
  cvd: 'CVD',
  endometrial: 'Endometrial',
};

export const DISEASES: DiseaseInfo[] = CONDITIONS.map((c) => ({
  ...c,
  key: API_KEY_BY_CONDITION[c.id] ?? c.id,
}));

export function diseaseByRouteId(id: string): DiseaseInfo | undefined {
  return DISEASES.find((d) => diseaseRouteId(d.key) === id || d.key.toLowerCase() === id);
}
