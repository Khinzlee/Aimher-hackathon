/* eslint-disable @typescript-eslint/no-explicit-any -- API payloads are loosely typed until backend DTOs are shared */
// Symptom intensity data service — Aimher API spec.
//   POST /symptoms                      → log entry + symptom_burden_score
//   GET  /symptoms/history?limit&offset → paginated history
//   POST /predictions/from-symptoms     → 6-disease risk prediction
//
// Falls back to localStorage when the API is unreachable or unauthenticated
// so the UI stays usable in demo/offline mode.

import { apiFetch, withApiFallback } from './apiClient';
import type { SymptomPayload } from './symptoms';

// ─── API response types ─────────────────────────────────────────────────────

export interface DiseasePrediction {
  probability: number;
  predicted: 0 | 1;
  severity: 'Low' | 'Moderate' | 'High';
  riskScore: number;
  riskSeverity: 'Minimal' | 'Mild' | 'Moderate' | 'Severe';
}

export type DiseasePredictionMap = Record<string, DiseasePrediction>;

export interface SymptomLogEntry {
  id: string;
  userId?: string;
  loggedAt: string;
  data: SymptomPayload;
  symptomBurdenScore: number;
  /** present when a prediction was run for this entry (local cache) */
  prediction?: DiseasePredictionMap | null;
}

export interface HistoryResponse {
  data: SymptomLogEntry[];
  total: number;
  limit: number;
  offset: number;
}

export interface PredictResponse {
  diseases: DiseasePredictionMap;
  symptomBurdenScore: number;
  pcosLabel?: number;
}

// ─── normalization ──────────────────────────────────────────────────────────

const PAYLOAD_KEYS: (keyof SymptomPayload)[] = [
  'day_of_cycle',
  'cycle_phase',
  'breast_soreness_vas',
  'painful_touch_vas',
  'pelvic_pressure_vas',
  'bloating_delta_cm',
  'fatigue_mfi5_vas',
  'acne_severity_likert',
  'hirsutism_mfg_score',
];

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeRemoteEntry(raw: any): SymptomLogEntry | null {
  if (!raw) return null;
  const src = raw.data && typeof raw.data === 'object' ? raw.data : raw;
  const data = {} as SymptomPayload;
  PAYLOAD_KEYS.forEach((k) => {
    (data as any)[k] = k === 'cycle_phase' ? String(src[k] ?? 'Follicular') : num(src[k]);
  });
  return {
    id: String(raw.id ?? crypto.randomUUID()),
    userId: raw.userId ?? raw.user_id,
    loggedAt: String(raw.loggedAt ?? raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
    data,
    symptomBurdenScore: num(raw.symptomBurdenScore ?? raw.symptom_burden_score),
  };
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

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999 + 7) * 10000;
  return x - Math.floor(x);
}

function computeBurden(p: SymptomPayload): number {
  const sum =
    p.breast_soreness_vas +
    p.painful_touch_vas +
    p.pelvic_pressure_vas +
    p.fatigue_mfi5_vas +
    (p.acne_severity_likert / 4) * 10 +
    (p.hirsutism_mfg_score / 36) * 10 +
    Math.min(p.bloating_delta_cm, 10);
  return Math.round((sum / 7) * 100) / 100;
}

function seedIfEmpty() {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(STORE_KEY)) return;
  const phases = ['Menstrual', 'Follicular', 'Ovulatory', 'Luteal'] as const;
  const entries: SymptomLogEntry[] = [];
  for (let i = 13; i >= 0; i--) {
    if (i !== 0 && seededRandom(i * 31 + 3) < 0.2) continue;
    const d = new Date();
    d.setDate(d.getDate() - i);
    const day = ((d.getDate() - 1) % 28) + 1;
    const phase = phases[Math.min(3, Math.floor((day - 1) / 7))];
    const vas = () => Math.round(seededRandom(i * 97) * 10 * 2) / 2;
    const data: SymptomPayload = {
      day_of_cycle: day,
      cycle_phase: phase,
      breast_soreness_vas: vas(),
      painful_touch_vas: vas(),
      pelvic_pressure_vas: vas(),
      bloating_delta_cm: Math.round(seededRandom(i * 57) * 30) / 10,
      fatigue_mfi5_vas: vas(),
      acne_severity_likert: Math.floor(seededRandom(i * 71) * 5),
      hirsutism_mfg_score: Math.floor(seededRandom(i * 83) * 36),
    };
    entries.push({
      id: `seed-${i}`,
      loggedAt: d.toISOString(),
      data,
      symptomBurdenScore: computeBurden(data),
    });
  }
  writeLocal(entries);
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function logSymptoms(payload: SymptomPayload): Promise<SymptomLogEntry> {
  return withApiFallback(
    async () => {
      const raw = await apiFetch<any>('/symptoms', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const entry = normalizeRemoteEntry(raw)!;
      // cache locally so history/predictions work offline afterwards
      const entries = readLocal().filter((e) => e.id !== entry.id);
      writeLocal([entry, ...entries].slice(0, 200));
      return entry;
    },
    async () => {
      seedIfEmpty();
      const entry: SymptomLogEntry = {
        id: crypto.randomUUID(),
        loggedAt: new Date().toISOString(),
        data: payload,
        symptomBurdenScore: computeBurden(payload),
      };
      writeLocal([entry, ...readLocal()].slice(0, 200));
      return entry;
    }
  );
}

export async function getSymptomHistory(
  limit = 50,
  offset = 0
): Promise<HistoryResponse> {
  return withApiFallback(
    async () => {
      const raw = await apiFetch<any>(
        `/symptoms/history?limit=${limit}&offset=${offset}`,
        {},
        { unwrapData: false }
      );
      const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
      return {
        data: list.map(normalizeRemoteEntry).filter(Boolean) as SymptomLogEntry[],
        total: num(raw?.total, list.length),
        limit: num(raw?.limit, limit),
        offset: num(raw?.offset, offset),
      };
    },
    async () => {
      seedIfEmpty();
      const entries = readLocal().sort((a, b) => (a.loggedAt < b.loggedAt ? 1 : -1));
      return {
        data: entries.slice(offset, offset + limit),
        total: entries.length,
        limit,
        offset,
      };
    }
  );
}

export async function predictFromSymptoms(
  payload: SymptomPayload
): Promise<PredictResponse> {
  return withApiFallback(
    async () => {
      const res = await apiFetch<any>('/predictions/from-symptoms', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const out: PredictResponse = {
        diseases: res?.diseases ?? {},
        symptomBurdenScore: num(res?.symptomBurdenScore ?? res?.symptom_burden_score),
        pcosLabel: res?.pcosLabel ?? res?.pcos_label,
      };
      cachePrediction(out);
      return out;
    },
    async () => {
      const diseases: DiseasePredictionMap = {};
      const keys = ['Infertility', 'Dysmenorrhea', 'PMDD', 'T2D', 'CVD', 'Endometrial'];
      const base =
        (payload.breast_soreness_vas + payload.painful_touch_vas +
          payload.pelvic_pressure_vas + payload.fatigue_mfi5_vas) / 40;
      keys.forEach((k, i) => {
        const p = Math.min(
          0.95,
          Math.max(0.05, base * (0.7 + i * 0.08) + payload.acne_severity_likert * 0.01)
        );
        const risk = Math.min(0.99, p * 0.85);
        diseases[k] = {
          probability: p,
          predicted: p >= 0.5 ? 1 : 0,
          severity: p < 0.33 ? 'Low' : p < 0.66 ? 'Moderate' : 'High',
          riskScore: risk,
          riskSeverity: risk < 0.2 ? 'Minimal' : risk < 0.4 ? 'Mild' : risk < 0.6 ? 'Moderate' : 'Severe',
        };
      });
      const out: PredictResponse = {
        diseases,
        symptomBurdenScore: computeBurden(payload),
        pcosLabel: 0,
      };
      cachePrediction(out);
      return out;
    }
  );
}

function cachePrediction(pred: PredictResponse) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PREDICTION_KEY, JSON.stringify(pred));
  const entries = readLocal();
  if (entries.length) {
    entries[0] = { ...entries[0], prediction: pred.diseases };
    writeLocal(entries);
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
