// Symptom intensity data service — Aimher API spec.
//   POST /symptoms                      → log entry + symptomBurdenScore
//   GET  /symptoms/history?limit&offset → paginated history
//   POST /predictions/from-symptoms     → 6-disease risk prediction
//
// Falls back to localStorage when the API is unreachable so the UI works
// before the backend is deployed.

import { apiFetch } from './api';
import type { SymptomPayload } from './symptoms';

// ─── API response types ─────────────────────────────────────────────────────

export interface DiseasePrediction {
  probability: number;
  predicted: 0 | 1;
  severity: 'Low' | 'Moderate' | 'High';
  riskScore: number;
  riskSeverity: 'Minimal' | 'Mild' | 'Moderate' | 'Severe';
}

export interface SymptomLogEntry {
  id: string;
  userId?: string;
  loggedAt: string;
  data: SymptomPayload;
  symptomBurdenScore: number;
  /** present when a prediction was run for this entry (local cache) */
  prediction?: DiseasePredictionMap | null;
}

export type DiseasePredictionMap = Record<string, DiseasePrediction>;

export interface HistoryResponse {
  data: SymptomLogEntry[];
  total: number;
  limit: number;
  offset: number;
}

export interface PredictResponse {
  diseases: DiseasePredictionMap;
  symptomBurdenScore: number;
  pcosLabel: number;
}

// ─── localStorage fallback ──────────────────────────────────────────────────

const STORE_KEY = 'aimher-symptom-logs-v2';
const PREDICTION_KEY = 'aimher-latest-prediction';

function readLocal(): SymptomLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(STORE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function writeLocal(entries: SymptomLogEntry[]) {
  window.localStorage.setItem(STORE_KEY, JSON.stringify(entries));
}

function seedIfEmpty() {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(STORE_KEY)) return;
  // 14 days of plausible demo data
  const phases = ['Menstrual', 'Follicular', 'Ovulatory', 'Luteal'] as const;
  const entries: SymptomLogEntry[] = [];
  for (let i = 13; i >= 0; i--) {
    if (i !== 0 && Math.random() < 0.2) continue;
    const d = new Date();
    d.setDate(d.getDate() - i);
    const day = ((d.getDate() - 1) % 28) + 1;
    const phase = phases[Math.min(3, Math.floor((day - 1) / 7))];
    const entries_vas = () => Math.round(Math.random() * 10 * 2) / 2;
    entries.push({
      id: `seed-${i}`,
      loggedAt: d.toISOString(),
      symptomBurdenScore: 0,
      data: {
        day_of_cycle: day,
        cycle_phase: phase,
        breast_soreness_vas: entries_vas(),
        painful_touch_vas: entries_vas(),
        pelvic_pressure_vas: entries_vas(),
        bloating_delta_cm: Math.round(Math.random() * 30) / 10,
        fatigue_mfi5_vas: entries_vas(),
        acne_severity_likert: Math.floor(Math.random() * 5),
        hirsutism_mfg_score: Math.floor(Math.random() * 36),
      },
    });
  }
  // compute burden scores deterministically-ish
  entries.forEach((e) => {
    const d = e.data;
    e.symptomBurdenScore =
      Math.round(
        ((d.breast_soreness_vas + d.painful_touch_vas + d.pelvic_pressure_vas +
          d.fatigue_mfi5_vas + d.acne_severity_likert * 2.5 +
          d.hirsutism_mfg_score / 3.6 + d.bloating_delta_cm * 0.2) / 7) * 10
      ) / 10;
  });
  writeLocal(entries);
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function logSymptoms(payload: SymptomPayload): Promise<SymptomLogEntry> {
  try {
    return await apiFetch<SymptomLogEntry>('/symptoms', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch {
    // offline/dev fallback
    seedIfEmpty();
    const entries = readLocal();
    const entry: SymptomLogEntry = {
      id: crypto.randomUUID(),
      loggedAt: new Date().toISOString(),
      data: payload,
      symptomBurdenScore: computeBurden(payload),
    };
    writeLocal([entry, ...entries]);
    return entry;
  }
}

export async function getSymptomHistory(
  limit = 50,
  offset = 0
): Promise<HistoryResponse> {
  try {
    return await apiFetch<HistoryResponse>(
      `/symptoms/history?limit=${limit}&offset=${offset}`
    );
  } catch {
    seedIfEmpty();
    const entries = readLocal().sort((a, b) =>
      a.loggedAt < b.loggedAt ? 1 : -1
    );
    return {
      data: entries.slice(offset, offset + limit),
      total: entries.length,
      limit,
      offset,
    };
  }
}

export async function predictFromSymptoms(
  payload: SymptomPayload
): Promise<PredictResponse> {
  try {
    const res = await apiFetch<PredictResponse>('/predictions/from-symptoms', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PREDICTION_KEY, JSON.stringify(res));
    }
    return res;
  } catch {
    // fallback: deterministic pseudo-prediction from payload values
    const diseases: DiseasePredictionMap = {};
    const keys = ['Infertility', 'Dysmenorrhea', 'PMDD', 'T2D', 'CVD', 'Endometrial'];
    keys.forEach((k, i) => {
      const base =
        (payload.breast_soreness_vas + payload.painful_touch_vas +
          payload.pelvic_pressure_vas + payload.fatigue_mfi5_vas) /
        40;
      const p = Math.min(0.95, Math.max(0.05, base * (0.7 + i * 0.08) + payload.acne_severity_likert * 0.01));
      diseases[k] = {
        probability: p,
        predicted: p >= 0.5 ? 1 : 0,
        severity: p < 0.33 ? 'Low' : p < 0.66 ? 'Moderate' : 'High',
        riskScore: Math.min(0.99, p * 0.85),
        riskSeverity: 'Mild',
      };
    });
    const res: PredictResponse = {
      diseases,
      symptomBurdenScore: computeBurden(payload),
      pcosLabel: 0,
    };
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PREDICTION_KEY, JSON.stringify(res));
    }
    return res;
  }
}

/** Latest cached prediction (from API or fallback) */
export function getCachedPrediction(): PredictResponse | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PREDICTION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Attach a prediction to the most recent local entry (fallback mode only) */
export function attachPredictionToLatest(pred: PredictResponse) {
  if (typeof window === 'undefined') return;
  const entries = readLocal();
  if (entries.length) {
    entries[0] = { ...entries[0], prediction: pred.diseases };
    writeLocal(entries);
  }
}

function computeBurden(p: SymptomPayload): number {
  const raw =
    p.breast_soreness_vas +
    p.painful_touch_vas +
    p.pelvic_pressure_vas +
    p.fatigue_mfi5_vas +
    p.acne_severity_likert * 2.5 +
    p.hirsutism_mfg_score / 3.6 +
    p.bloating_delta_cm * 0.2;
  return Math.round((raw / 7) * 10) / 10;
}

export { computeBurden };
