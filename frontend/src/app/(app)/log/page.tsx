'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Check, ChevronRight } from 'lucide-react';
import {
  CONDITIONS,
  SYMPTOM_MAP,
  getConditionSymptoms,
  getSeverity,
  computeConditionBurden,
  type Condition,
} from '@/lib/symptoms';
import { getSymptomLogs, saveSymptomLog, type SymptomLogEntry } from '@/lib/symptomService';
import VASSlider from '@/components/VASSlider';
import SeverityBadge from '@/components/SeverityBadge';
import { SymptomIcon } from '@/components/SymptomIcon';
import { useNow } from '@/hooks/useNow';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function LogPage() {
  const [activeId, setActiveId] = useState(CONDITIONS[0].id);
  const [values, setValues] = useState<Record<string, number>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [todayEntry, setTodayEntry] = useState<SymptomLogEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const now = useNow();

  useEffect(() => {
    getSymptomLogs().then((logs) => {
      const today = logs.find((l) => l.date === todayKey()) ?? null;
      setTodayEntry(today);
      if (today) {
        setValues({ ...today.values });
        setTouched(new Set(Object.keys(today.values)));
      }
      setLoaded(true);
    });
  }, []);

  const active: Condition = CONDITIONS.find((c) => c.id === activeId)!;
  const symptoms = getConditionSymptoms(active);

  const burden = computeConditionBurden(active, values);
  const sev = burden !== null ? getSeverity(burden) : null;

  const flagValue =
    active.redFlagSymptomId && typeof values[active.redFlagSymptomId] === 'number'
      ? values[active.redFlagSymptomId]
      : null;
  const isRedFlag =
    flagValue !== null && flagValue >= (active.redFlagThreshold ?? 99);

  const dirtyCount = symptoms.filter((s) => touched.has(s.id)).length;

  const handleChange = (symptomId: string, v: number) => {
    setValues((prev) => ({ ...prev, [symptomId]: v }));
    setTouched((prev) => new Set(prev).add(symptomId));
    setSavedAt(null);
  };

  const handleSave = async () => {
    const payload: Record<string, number> = {};
    symptoms.forEach((s) => {
      if (touched.has(s.id) && typeof values[s.id] === 'number') {
        payload[s.id] = values[s.id];
      }
    });
    if (Object.keys(payload).length === 0) return;
    setSaving(true);
    const entry = await saveSymptomLog(payload);
    setTodayEntry(entry);
    setSaving(false);
    setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  if (!loaded) {
    return <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse h-64" />;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Log Symptoms</h1>
        <p className="text-sm text-gray-500 mt-1">
          {now?.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          {todayEntry && ' · entry saved'}
        </p>
      </div>

      <Link href="/log/morning" className="d-card d-cond" style={{ marginBottom: 8 }}>
        <div className="ico" style={{ background: '#e3f1ee', color: '#3a8a7b' }}>☀️</div>
        <div className="mid">
          <div className="title">Morning Check-In</div>
          <div className="sub">Fatigue, pelvic pressure &amp; pain sensitivity</div>
        </div>
        <ChevronRight size={20} color="#9aa5b1" />
      </Link>

      {/* condition selector */}
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
        {CONDITIONS.map((c) => {
          const isActive = c.id === activeId;
          return (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors shrink-0 ${
                isActive
                  ? 'text-white border-transparent'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
              style={isActive ? { backgroundColor: c.color } : {}}
            >
              <SymptomIcon name={c.icon} className="h-3.5 w-3.5" />
              {c.name}
            </button>
          );
        })}
      </div>

      {/* active condition panel */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-start gap-3 mb-1">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${active.color}1A` }}
          >
            <SymptomIcon name={active.icon} className="h-5 w-5" style={{ color: active.color }} />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">{active.fullName}</h2>
            <p className="text-xs text-gray-500">{active.description}</p>
          </div>
        </div>

        {isRedFlag && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 flex gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-800">{active.redFlagMessage}</p>
          </div>
        )}

        <div className="mt-5 space-y-6">
          {symptoms.map((s) => (
            <VASSlider
              key={s.id}
              label={s.label}
              description={SYMPTOM_MAP[s.id]?.description}
              value={values[s.id] ?? 0}
              onChange={(v) => handleChange(s.id, v)}
              lowLabel={SYMPTOM_MAP[s.id]?.lowLabel}
              highLabel={SYMPTOM_MAP[s.id]?.highLabel}
            />
          ))}
        </div>

        {/* live burden preview */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Condition burden (this entry)</p>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold tabular-nums" style={{ color: sev?.color ?? '#9CA3AF' }}>
                {burden !== null ? burden.toFixed(1) : '—'}
              </span>
              <span className="text-xs text-gray-400">/10</span>
              {burden !== null && <SeverityBadge value={burden} />}
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || dirtyCount === 0}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            style={{ backgroundColor: active.color }}
          >
            {saving ? 'Saving…' : dirtyCount > 0 ? `Save ${dirtyCount} rating${dirtyCount > 1 ? 's' : ''}` : 'Saved'}
          </button>
        </div>

        {savedAt && (
          <p className="mt-3 text-xs text-green-700 flex items-center gap-1">
            <Check className="h-3.5 w-3.5" /> Saved at {savedAt}
          </p>
        )}
      </div>

      <p className="text-[11px] text-gray-400 leading-relaxed">
        {active.disclaimer}
      </p>

      <Link
        href="/dashboard"
        className="flex items-center justify-center gap-1 text-sm font-medium text-teal-700"
      >
        Back to dashboard <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
