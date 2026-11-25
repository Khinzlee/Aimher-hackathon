/* eslint-disable @typescript-eslint/no-explicit-any -- AIMHER envelopes are normalized from loose API payloads */
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

function normalizeSession(raw: any): RppgV8Session {
  return {
    id: String(raw?.id ?? crypto.randomUUID()),
    userId: String(raw?.userId ?? raw?.user_id ?? 'local'),
    rmssd: Number(raw?.rmssd ?? 0),
    hf: Number(raw?.hf ?? 0),
    lfHfRatio: Number(raw?.lfHfRatio ?? raw?.lf_hf_ratio ?? 0),
    heartRate: Number(raw?.heartRate ?? raw?.heart_rate ?? 0),
    hrv: Number(raw?.hrv ?? 0),
    estimatedSpO2: Number(raw?.estimatedSpO2 ?? raw?.estimated_spo2 ?? 0),
    skinTemperature: Number(raw?.skinTemperature ?? raw?.skin_temperature ?? 0),
    hrTrend: raw?.hrTrend ?? raw?.hr_trend ?? null,
    meanEda: Number(raw?.meanEda ?? raw?.mean_eda ?? 0),
    meanTemp: Number(raw?.meanTemp ?? raw?.mean_temp ?? 0),
    asi: raw?.asi ?? null,
    rmssdTrend: raw?.rmssdTrend ?? raw?.rmssd_trend ?? null,
    ac: raw?.ac ?? null,
    dc: raw?.dc ?? null,
    acDcRatio: raw?.acDcRatio ?? raw?.ac_dc_ratio ?? null,
    pulseAmplitude: raw?.pulseAmplitude ?? raw?.pulse_amplitude ?? null,
    signalQuality: raw?.signalQuality ?? raw?.signal_quality ?? null,
    respiratoryRate: raw?.respiratoryRate ?? raw?.respiratory_rate ?? null,
    sessionType: String(raw?.sessionType ?? raw?.session_type ?? 'checkin'),
    sessionQuality: raw?.sessionQuality ?? raw?.session_quality ?? null,
    capturedAt: String(raw?.capturedAt ?? raw?.createdAt ?? new Date().toISOString()),
  };
}

function cachePrediction(data: RppgV8PredictAllResult) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PRED_KEY, JSON.stringify(data));
}

function emptyPrediction(): RppgV8PredictAllResult {
  return {
    regression: {},
    risk: {},
    mood_check: null,
    deep_learning: {},
    feature_vector: {},
    nSessions: readSessions().length,
  };
}

export const rppgV8Service = {
  logSession: async (payload: RppgV8SessionPayload) => withApiFallback(
    async () => {
      const raw = await apiFetch<any>('/rppg-v8/session', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const session = normalizeSession(raw?.session ?? raw);
      writeSessions([session, ...readSessions()]);
      return { success: true, data: session };
    },
    async () => {
      await delay();
      const session = normalizeSession({ ...payload, capturedAt: new Date().toISOString(), userId: 'local' });
      writeSessions([session, ...readSessions()]);
      return { success: true, data: session };
    }
  ),

  predictAll: async (): Promise<{ success: boolean; data: RppgV8PredictAllResult }> => withApiFallback(
    async () => {
      const raw = await apiFetch<any>('/rppg-v8/predict', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const data: RppgV8PredictAllResult = {
        regression: raw?.regression ?? {},
        risk: raw?.risk ?? {},
        mood_check: raw?.mood_check ?? null,
        deep_learning: raw?.deep_learning ?? {},
        feature_vector: raw?.feature_vector ?? {},
        nSessions: Number(raw?.nSessions ?? readSessions().length),
      };
      cachePrediction(data);
      return { success: true, data };
    },
    async () => {
      await delay(300);
      const cached = typeof window !== 'undefined' ? window.localStorage.getItem(PRED_KEY) : null;
      return { success: true, data: cached ? JSON.parse(cached) : emptyPrediction() };
    }
  ),

  predictRegression: async (target: string) => withApiFallback(
    async () => {
      const data = await apiFetch<any>('/rppg-v8/predict/regression', {
        method: 'POST',
        body: JSON.stringify({ target }),
      });
      return { success: true, data };
    },
    async () => {
      await delay();
      return { success: true, data: { target, predictions: {}, ensemble: null } };
    }
  ),

  predictRisk: async (domain: string) => {
    await delay();
    return { success: true, data: { domain, risk_score: null, risk_probability: null, risk_flag: 0, severity: null } };
  },

  predictMood: async () => withApiFallback(
    async () => {
      const data = await apiFetch<any>('/rppg-v8/predict/mood', { method: 'POST', body: JSON.stringify({}) });
      return { success: true, data };
    },
    async () => {
      await delay();
      return {
        success: true,
        data: { best_prediction: null, best_algorithm: '', all_predictions: {}, classes: [] },
      };
    }
  ),

  predictDL: async (target: string) => {
    await delay();
    return { success: true, data: { target, predictions: {}, ensemble: null, method: 'deep_learning' as const } };
  },

  getSessions: async () => withApiFallback(
    async () => {
      const raw = await apiFetch<any>('/rppg-v8/sessions?limit=50');
      const sessions: RppgV8Session[] = (raw?.sessions ?? []).map(normalizeSession);
      writeSessions(sessions);
      return { success: true, data: { sessions, count: Number(raw?.count ?? sessions.length) } };
    },
    async () => {
      await delay();
      const sessions = readSessions();
      return { success: true, data: { sessions, count: sessions.length } };
    }
  ),

  getPredictions: async () => withApiFallback(
    async () => {
      const raw = await apiFetch<any>('/rppg-v8/predictions');
      const predictions: RppgV8PredictionResult[] = raw?.predictions ?? [];
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('aimher-rppg-v8-pred-list', JSON.stringify(predictions));
      }
      return { success: true, data: { predictions, count: Number(raw?.count ?? predictions.length) } };
    },
    async () => {
      await delay();
      const raw =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('aimher-rppg-v8-pred-list')
          : null;
      const predictions: RppgV8PredictionResult[] = raw ? JSON.parse(raw) : [];
      return { success: true, data: { predictions, count: predictions.length } };
    }
  ),

  getMetadata: async () => withApiFallback(
    async () => {
      const data = await apiFetch<any>('/rppg-v8/metadata');
      return { success: true, data };
    },
    async () => {
      await delay();
      return { success: true, data: null };
    }
  ),
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
