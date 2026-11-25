// rPPG v8 service — same interface as Aimher's services/rppgV8Service.ts.
// Uses the NestJS API when NEXT_PUBLIC_API_URL is set, otherwise localStorage.

import { apiFetch, withApiFallback } from '@/lib/apiClient';

const BASE_KEY = 'aimher-rppg-v8-sessions';
const PRED_KEY = 'aimher-rppg-v8-predictions';

const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms));

export interface RppgV8SessionPayload {
  rmssd: number;
  hf: number;
  lf_hf_ratio: number;
  heart_rate: number;
  hrv: number;
  estimated_spo2: number;
  skin_temperature: number;
  hr_trend: number | null;
  mean_eda: number;
  mean_temp: number;
  asi: number | null;
  rmssd_trend: number | null;
  ac: number | null;
  dc: number | null;
  ac_dc_ratio: number | null;
  pulse_amplitude: number | null;
  signal_quality: number | null;
  respiratory_rate: number | null;
  session_type: 'morning' | 'evening' | 'baseline' | 'checkin';
  session_quality: 'good' | 'poor' | 'motion_artifact' | null;
}

export interface RppgV8RegressionResult {
  target: string;
  predictions: Record<string, number | null>;
  ensemble: number | null;
}

export interface RppgV8RiskResult {
  domain: string;
  risk_score: number | null;
  risk_probability: number | null;
  risk_flag: number;
  severity: string | null;
}

export interface RppgV8MoodResult {
  best_prediction: {
    label: string;
    confidence: number;
    probabilities: number[];
  } | null;
  best_algorithm: string;
  all_predictions: Record<string, { label: string; confidence: number }>;
  classes: string[];
}

export interface RppgV8DLResult {
  target: string;
  predictions: Record<string, number | null>;
  ensemble: number | null;
  method: 'deep_learning';
}

export interface RppgV8PredictAllResult {
  regression: Record<string, RppgV8RegressionResult>;
  risk: Record<string, RppgV8RiskResult>;
  mood_check: RppgV8MoodResult | null;
  deep_learning: Record<string, RppgV8DLResult>;
  feature_vector: Record<string, number>;
  nSessions: number;
}

export interface RppgV8Session {
  id: string;
  userId: string;
  rmssd: number;
  hf: number;
  lfHfRatio: number;
  heartRate: number;
  hrv: number;
  estimatedSpO2: number;
  skinTemperature: number;
  hrTrend: number | null;
  meanEda: number;
  meanTemp: number;
  asi: number | null;
  rmssdTrend: number | null;
  ac: number | null;
  dc: number | null;
  acDcRatio: number | null;
  pulseAmplitude: number | null;
  signalQuality: number | null;
  respiratoryRate: number | null;
  sessionType: string;
  sessionQuality: string | null;
  capturedAt: string;
}

export interface RppgV8PredictionResult {
  id: string;
  userId: string;
  predictedAt: string;
  nSessionsUsed: number;
  sleepQualityScore: number | null;
  focusMemoryScore: number | null;
  mentalWellnessScore: number | null;
  moodScoreScore: number | null;
  metabolicSyndromeScore: number | null;
  t2dScore: number | null;
  cardiovascularScore: number | null;
  heartFailureScore: number | null;
  chronicStressScore: number | null;
  infertilityScore: number | null;
  riskCvdScore: number | null;
  riskT2dScore: number | null;
  riskMetabolicScore: number | null;
  riskHeartFailureScore: number | null;
  riskChronicStressScore: number | null;
  riskInfertilityScore: number | null;
  moodCheckLabel: string | null;
  moodCheckConfidence: number | null;
}

function readSessions(): RppgV8Session[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(BASE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function writeSessions(sessions: RppgV8Session[]) {
  window.localStorage.setItem(BASE_KEY, JSON.stringify(sessions));
}

export const rppgV8Service = {
  logSession: async (payload: RppgV8SessionPayload) => {
    await delay();
    const session: RppgV8Session = {
      id: crypto.randomUUID(),
      userId: 'local',
      rmssd: payload.rmssd,
      hf: payload.hf,
      lfHfRatio: payload.lf_hf_ratio,
      heartRate: payload.heart_rate,
      hrv: payload.hrv,
      estimatedSpO2: payload.estimated_spo2,
      skinTemperature: payload.skin_temperature,
      hrTrend: payload.hr_trend,
      meanEda: payload.mean_eda,
      meanTemp: payload.mean_temp,
      asi: payload.asi,
      rmssdTrend: payload.rmssd_trend,
      ac: payload.ac,
      dc: payload.dc,
      acDcRatio: payload.ac_dc_ratio,
      pulseAmplitude: payload.pulse_amplitude,
      signalQuality: payload.signal_quality,
      respiratoryRate: payload.respiratory_rate,
      sessionType: payload.session_type,
      sessionQuality: payload.session_quality,
      capturedAt: new Date().toISOString(),
    };
    writeSessions([session, ...readSessions()]);
    return { success: true, data: session };
  },

  predictAll: async (_metrics?: RppgV8SessionPayload): Promise<{ success: boolean; data: RppgV8PredictAllResult }> => {
    await delay(300);
    // Return whatever was cached by a previous call, else empty result
    const cached =
      typeof window !== 'undefined'
        ? window.localStorage.getItem(PRED_KEY)
        : null;
    if (cached) return { success: true, data: JSON.parse(cached) };
    return {
      success: true,
      data: {
        regression: {},
        risk: {},
        mood_check: null,
        deep_learning: {},
        feature_vector: {},
        nSessions: readSessions().length,
      },
    };
  },

  predictRegression: async (target: string) => {
    await delay();
    return { success: true, data: { target, predictions: {}, ensemble: null } };
  },

  predictRisk: async (domain: string) => {
    await delay();
    return { success: true, data: { domain, risk_score: null, risk_probability: null, risk_flag: 0, severity: null } };
  },

  predictMood: async () => {
    await delay();
    return {
      success: true,
      data: { best_prediction: null, best_algorithm: '', all_predictions: {}, classes: [] },
    };
  },

  predictDL: async (target: string) => {
    await delay();
    return { success: true, data: { target, predictions: {}, ensemble: null, method: 'deep_learning' as const } };
  },

  getSessions: async () => {
    await delay();
    const sessions = readSessions();
    return { success: true, data: { sessions, count: sessions.length } };
  },

  getPredictions: async () => {
    await delay();
    const raw =
      typeof window !== 'undefined'
        ? window.localStorage.getItem('aimher-rppg-v8-pred-list')
        : null;
    const predictions: RppgV8PredictionResult[] = raw ? JSON.parse(raw) : [];
    return { success: true, data: { predictions, count: predictions.length } };
  },

  getMetadata: async () => {
    await delay();
    return { success: true, data: null };
  },
};

export const REGRESSION_TARGETS = [
  'Sleep_Quality', 'Focus_Memory', 'Mental_Wellness', 'Mood_Score',
  'Metabolic_Syndrome_Risk', 'T2D_Metabolic_Risk_Index', 'Cardiovascular_Risk_Score',
  'Heart_Failure_Alert_Score', 'Chronic_Stress_Severity', 'Infertility_Reproductive_Risk',
] as const;

export const RISK_DOMAINS = [
  'Sleep_Quality', 'Focus_Memory', 'Mental_Wellness', 'Mood_Check',
  'Metabolic_Syndrome', 'Type_2_Diabetes', 'Cardiovascular_Disease',
  'Heart_Failure', 'Chronic_Stress', 'Infertility',
] as const;

export const DL_TARGETS = ['Sleep_Quality', 'Focus_Memory', 'Mental_Wellness', 'Mood_Score'] as const;

export type RegressionTarget = typeof REGRESSION_TARGETS[number];
export type RiskDomain = typeof RISK_DOMAINS[number];
export type DLTarget = typeof DL_TARGETS[number];
