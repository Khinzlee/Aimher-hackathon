'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronRight } from 'lucide-react';
import {
  CYCLE_PHASES,
  EMPTY_PAYLOAD,
  cyclePhaseForDay,
  type CyclePhase,
  type SymptomPayload,
} from '@/lib/symptoms';
import { logSymptoms, predictFromSymptoms, attachPredictionToLatest } from '@/lib/symptomService';
import VASSlider from '@/components/VASSlider';
import { useNow } from '@/hooks/useNow';

const TEAL = '#00897B';

function NumberField({
  label,
  description,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
}: {
  label: string;
  description?: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900 text-sm">{label}</p>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-right text-lg font-bold tabular-nums outline-none focus:border-teal-500"
            style={{ color: TEAL }}
          />
          {unit && <span className="text-xs text-gray-400">{unit}</span>}
        </div>
      </div>
    </div>
  );
}

export default function LogPage() {
  const router = useRouter();
  const now = useNow();
  const [payload, setPayload] = useState<SymptomPayload>({ ...EMPTY_PAYLOAD });
  const [phaseTouched, setPhaseTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof SymptomPayload>(key: K, value: SymptomPayload[K]) => {
    setPayload((p) => ({ ...p, [key]: value }));
  };

  const handleDayChange = (day: number) => {
    setPayload((p) => ({
      ...p,
      day_of_cycle: Math.min(28, Math.max(1, day)),
      cycle_phase: phaseTouched ? p.cycle_phase : cyclePhaseForDay(day),
    }));
  };

  const handlePhase = (phase: CyclePhase) => {
    setPhaseTouched(true);
    set('cycle_phase', phase);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const entry = await logSymptoms(payload);
      const prediction = await predictFromSymptoms(entry.data ?? payload);
      attachPredictionToLatest(prediction);
      router.push('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Log Symptoms</h1>
        <p className="text-sm text-gray-500 mt-1">
          {now?.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Cycle context */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-5">
        <h2 className="font-bold text-sm text-gray-900">Cycle Context</h2>

        <NumberField
          label="Day of Cycle"
          description="Which day of your menstrual cycle is today?"
          value={payload.day_of_cycle}
          onChange={handleDayChange}
          min={1}
          max={28}
        />

        <div>
          <p className="font-semibold text-gray-900 text-sm mb-1.5">Cycle Phase</p>
          <p className="text-xs text-gray-500 mb-3">
            Auto-set from day of cycle — adjust if needed
          </p>
          <div className="grid grid-cols-2 gap-2">
            {CYCLE_PHASES.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => handlePhase(p.value)}
                className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  payload.cycle_phase === p.value
                    ? 'text-white border-transparent'
                    : 'border-gray-300 text-gray-600 bg-white hover:border-teal-300'
                }`}
                style={payload.cycle_phase === p.value ? { backgroundColor: TEAL } : {}}
              >
                <span className="block text-sm font-semibold">{p.label}</span>
                <span
                  className={`block text-[10px] ${payload.cycle_phase === p.value ? 'text-white/70' : 'text-gray-400'}`}
                >
                  {p.days}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Symptom intensities */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-6">
        <h2 className="font-bold text-sm text-gray-900">Symptom Intensity</h2>

        <VASSlider
          label="Breast Soreness"
          description="Visual analog scale"
          value={payload.breast_soreness_vas}
          onChange={(v) => set('breast_soreness_vas', v)}
          step={0.5}
          lowLabel="None"
          highLabel="Severe"
        />
        <VASSlider
          label="Painful Touch"
          description="Sensitivity to touch / pressure"
          value={payload.painful_touch_vas}
          onChange={(v) => set('painful_touch_vas', v)}
          step={0.5}
          lowLabel="None"
          highLabel="Severe"
        />
        <VASSlider
          label="Pelvic Pressure"
          description="Lower abdominal pressure or discomfort"
          value={payload.pelvic_pressure_vas}
          onChange={(v) => set('pelvic_pressure_vas', v)}
          step={0.5}
          lowLabel="None"
          highLabel="Intense"
        />

        <NumberField
          label="Bloating"
          description="Change in abdominal girth"
          value={payload.bloating_delta_cm}
          onChange={(v) => set('bloating_delta_cm', v)}
          min={0}
          max={50}
          step={0.5}
          unit="cm"
        />

        <VASSlider
          label="Fatigue (MFI-5)"
          description="Multidimensional Fatigue Inventory short form"
          value={payload.fatigue_mfi5_vas}
          onChange={(v) => set('fatigue_mfi5_vas', v)}
          step={0.5}
          lowLabel="Energetic"
          highLabel="Exhausted"
        />

        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-900 text-sm">Acne Severity</p>
              <p className="text-xs text-gray-500 mt-0.5">Likert scale 0–4</p>
            </div>
            <span className="text-2xl font-bold tabular-nums" style={{ color: TEAL }}>
              {payload.acne_severity_likert}
            </span>
          </div>
          <div className="flex gap-1.5 mt-3">
            {[0, 1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => set('acne_severity_likert', n)}
                className={`flex-1 h-9 rounded-lg text-sm font-semibold transition-all ${
                  payload.acne_severity_likert === n
                    ? 'text-white'
                    : 'border border-gray-300 text-gray-500 bg-white hover:border-teal-300'
                }`}
                style={payload.acne_severity_likert === n ? { backgroundColor: TEAL } : {}}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-right mt-1 text-xs text-gray-400">
            {['Clear', 'Comedones', 'Papules', 'Pustules', 'Nodules'][payload.acne_severity_likert]}
          </p>
        </div>

        <NumberField
          label="Hirsutism (mFG Score)"
          description="Modified Ferriman-Gallwey score"
          value={payload.hirsutism_mfg_score}
          onChange={(v) => set('hirsutism_mfg_score', Math.min(36, Math.max(0, v)))}
          min={0}
          max={36}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full h-12 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
        style={{ backgroundColor: TEAL }}
      >
        {saving ? 'Saving…' : 'Save & Predict'}
        {!saving && <ChevronRight className="h-4 w-4" />}
        {saving && <Check className="h-4 w-4 opacity-0" />}
      </button>

      <p className="text-[11px] text-gray-400 text-center leading-relaxed">
        Submitting logs your symptoms and runs disease-risk prediction for
        Infertility, Dysmenorrhea, PMDD, T2D, CVD and Endometrial cancer.
      </p>
    </div>
  );
}
