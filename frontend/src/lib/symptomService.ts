// Symptom log data service.
//
// Currently backed by localStorage + seeded demo data so the UI is fully
// usable before the backend exists. All functions are async with REST-shaped
// signatures — swap the implementations for fetch() calls later without
// touching the UI.
//
// TODO(backend): replace localStorage internals with:
//   GET  /api/symptom-logs
//   POST /api/symptom-logs
//   GET  /api/symptom-logs/summary

import { CONDITIONS, SYMPTOMS } from './symptoms';
import { apiFetch, withApiFallback } from './apiClient';

export interface SymptomLogEntry {
  id: string;
  /** ISO date YYYY-MM-DD */
  date: string;
  /** ISO timestamp */
  loggedAt: string;
  /** symptomId -> intensity 0-10 (only symptoms the user rated) */
  values: Record<string, number>;
}

export interface ConditionSummary {
  conditionId: string;
  /** latest burden score 0-10 (avg of its symptoms on the most recent entry) */
  latestBurden: number | null;
  latestDate: string | null;
  /** burden 7 days ago for delta, if available */
  previousBurden: number | null;
  /** 14-day daily burden series (null = no data that day) */
  series: { date: string; value: number | null }[];
  entryCount: number;
  /** true when the condition's red-flag symptom crossed its threshold */
  redFlag: boolean;
}

const STORAGE_KEY = 'aimher-symptom-logs-v1';
const SEED_KEY = 'aimher-symptom-logs-seeded-v1';

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

function readStore(): SymptomLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SymptomLogEntry[]) : [];
  } catch {
    return [];
  }
}

function writeStore(entries: SymptomLogEntry[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dateKey(d);
}

function toIntensity(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.min(10, value));
  if (value && typeof value === 'object' && 'intensity' in value) {
    return toIntensity((value as { intensity: unknown }).intensity);
  }
  return null;
}

function normalizeRemoteEntry(raw: any): SymptomLogEntry | null {
  if (!raw) return null;
  const values: Record<string, number> = {};
  const source = raw.values ?? raw.symptoms ?? raw.entries ?? {};

  if (Array.isArray(source)) {
    source.forEach((item: any) => {
      const id = item?.symptomId ?? item?.symptom_id ?? item?.id;
      const intensity = toIntensity(item?.intensity ?? item?.value ?? item?.score);
      if (id && intensity !== null) values[String(id)] = intensity;
    });
  } else if (source && typeof source === 'object') {
    Object.entries(source).forEach(([id, value]) => {
      const intensity = toIntensity(value);
      if (intensity !== null) values[id] = intensity;
    });
  }

  const stamp = raw.date ?? raw.loggedAt ?? raw.createdAt ?? raw.created_at;
  const date = stamp ? String(stamp).slice(0, 10) : dateKey(new Date());

  return {
    id: String(raw.id ?? crypto.randomUUID()),
    date,
    loggedAt: String(raw.loggedAt ?? raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
    values,
  };
}

// Deterministic pseudo-random so seeded demo data is stable per day
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999 + 7) * 10000;
  return x - Math.floor(x);
}

function generateSeedEntries(): SymptomLogEntry[] {
  const entries: SymptomLogEntry[] = [];
  for (let i = 13; i >= 0; i--) {
    // skip ~20% of days to make the chart look realistic
    if (seededRandom(i * 31 + 3) < 0.2 && i !== 0) continue;
    const values: Record<string, number> = {};
    SYMPTOMS.forEach((s, idx) => {
      // some symptoms are consistently low, others trend upward over time
      const trend = i < 4 ? (4 - i) * 0.15 : 0; // worsening recently
      const base = seededRandom(i * 97 + idx * 13);
      let v = Math.round(base * 10);
      // keep a few symptoms near zero most days
      if (['abnormal_bleeding', 'chest_discomfort', 'shortness_of_breath'].includes(s.id) && base < 0.6) {
        v = Math.round(base * 3);
      }
      v = Math.min(10, Math.max(0, v + Math.round(trend)));
      if (seededRandom(i * 57 + idx) > 0.15) values[s.id] = v;
    });
    entries.push({
      id: `seed-${i}`,
      date: daysAgo(i),
      loggedAt: `${daysAgo(i)}T08:30:00.000Z`,
      values,
    });
  }
  return entries;
}

async function ensureSeeded() {
  if (typeof window === 'undefined') return;
  if (!window.localStorage.getItem(SEED_KEY)) {
    writeStore(generateSeedEntries());
    window.localStorage.setItem(SEED_KEY, '1');
  }
}

export async function getSymptomLogs(): Promise<SymptomLogEntry[]> {
  return withApiFallback(
    async () => {
      const raw = await apiFetch<any>('/symptoms/history?limit=100');
      const list = Array.isArray(raw) ? raw : (raw?.entries ?? raw?.logs ?? []);
      return list
        .map(normalizeRemoteEntry)
        .filter((entry: SymptomLogEntry | null): entry is SymptomLogEntry => entry !== null)
        .sort((a: SymptomLogEntry, b: SymptomLogEntry) => (a.date < b.date ? 1 : -1));
    },
    async () => {
      await ensureSeeded();
      await delay();
      return readStore().sort((a, b) => (a.date < b.date ? 1 : -1));
    }
  );
}

export async function saveSymptomLog(values: Record<string, number>): Promise<SymptomLogEntry> {
  const today = dateKey(new Date());
  return withApiFallback(
    async () => {
      const raw = await apiFetch<any>('/symptoms', {
        method: 'POST',
        body: JSON.stringify({
          date: today,
          values,
          symptoms: Object.entries(values).map(([symptomId, intensity]) => ({ symptomId, intensity })),
        }),
      });
      const entry = normalizeRemoteEntry(raw) ?? {
        id: crypto.randomUUID(),
        date: today,
        loggedAt: new Date().toISOString(),
        values,
      };
      writeStore([entry, ...readStore().filter((e) => e.date !== today)]);
      return entry;
    },
    async () => {
      await ensureSeeded();
      const entries = readStore();
      // one entry per day — merge into today's entry if it exists
      const existing = entries.find((e) => e.date === today);
      const entry: SymptomLogEntry = existing ?? {
        id: crypto.randomUUID(),
        date: today,
        loggedAt: new Date().toISOString(),
        values: {},
      };
      entry.values = { ...entry.values, ...values };
      entry.loggedAt = new Date().toISOString();
      const next = existing ? entries.map((e) => (e.id === entry.id ? entry : e)) : [...entries, entry];
      writeStore(next);
      await delay(200);
      return entry;
    }
  );
}

function burdenForEntry(entry: SymptomLogEntry, symptomIds: string[]): number | null {
  const vals = symptomIds
    .map((id) => entry.values[id])
    .filter((v): v is number => typeof v === 'number');
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export async function getConditionSummaries(days = 14): Promise<ConditionSummary[]> {
  await ensureSeeded();
  const entries = readStore().sort((a, b) => (a.date < b.date ? -1 : 1));
  const today = new Date();

  return CONDITIONS.map((cond) => {
    const series: { date: string; value: number | null }[] = [];
    const byDate = new Map<string, SymptomLogEntry>();
    entries.forEach((e) => byDate.set(e.date, e));

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = dateKey(d);
      const entry = byDate.get(key);
      series.push({ date: key, value: entry ? burdenForEntry(entry, cond.symptomIds) : null });
    }

    const withData = series.filter((p) => p.value !== null);
    const latest = [...withData].reverse()[0] ?? null;
    const previous = withData.length > 1 ? withData[withData.length - 2] : null;

    // red flag: latest logged value of the flag symptom crossed threshold
    let redFlag = false;
    if (cond.redFlagSymptomId && cond.redFlagThreshold !== undefined) {
      const flagEntry = [...entries].reverse().find(
        (e) => typeof e.values[cond.redFlagSymptomId!] === 'number'
      );
      redFlag =
        flagEntry !== undefined &&
        flagEntry.values[cond.redFlagSymptomId] >= cond.redFlagThreshold;
    }

    return {
      conditionId: cond.id,
      latestBurden: latest?.value ?? null,
      latestDate: latest?.date ?? null,
      previousBurden: previous?.value ?? null,
      series,
      entryCount: entries.filter((e) =>
        cond.symptomIds.some((id) => typeof e.values[id] === 'number')
      ).length,
      redFlag,
    };
  });
}

export interface ConditionDetail {
  summary: ConditionSummary;
  /** per-symptom latest values + averages for the condition */
  symptoms: {
    symptomId: string;
    latest: number | null;
    average: number | null;
  }[];
  /** raw entries that contain at least one of this condition's symptoms */
  entries: SymptomLogEntry[];
}

export async function getConditionDetail(conditionId: string, days = 30): Promise<ConditionDetail | null> {
  const cond = CONDITIONS.find((c) => c.id === conditionId);
  if (!cond) return null;
  const summaries = await getConditionSummaries(days);
  const summary = summaries.find((s) => s.conditionId === conditionId);
  if (!summary) return null;

  const entries = (await getSymptomLogs()).filter((e) =>
    cond.symptomIds.some((id) => typeof e.values[id] === 'number')
  );

  const symptoms = cond.symptomIds.map((sid) => {
    const vals = entries
      .map((e) => e.values[sid])
      .filter((v): v is number => typeof v === 'number');
    return {
      symptomId: sid,
      latest: vals.length ? vals[0] : null, // entries sorted newest-first
      average: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null,
    };
  });

  return { summary: summary!, symptoms, entries };
}
