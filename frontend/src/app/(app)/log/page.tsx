'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowLeft, CalendarDays, Check, ChevronRight, ClipboardList, Sparkles,
} from 'lucide-react';
import {
  CYCLE_PHASES, cyclePhaseForDay, getSeverity, type CyclePhase,
} from '@/lib/symptoms';
import {
  getSymptomLogs, saveSymptomLog,
  type SymptomApiPayload, type SymptomLogEntry,
} from '@/lib/symptomService';
import VASSlider from '@/components/VASSlider';

const DEFAULT_METRICS: SymptomApiPayload = {
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

type MetricKey = keyof SymptomApiPayload;

export default function LogPage() {
  const [metrics, setMetrics] = useState<SymptomApiPayload>(DEFAULT_METRICS);
  const [todayEntry, setTodayEntry] = useState<SymptomLogEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getSymptomLogs()
      .then((logs) => {
        if (!alive) return;
        const today = new Date().toISOString().slice(0, 10);
        const entry = logs.find((item) => item.date === today) ?? null;
        setTodayEntry(entry);
        if (entry?.metrics) setMetrics(entry.metrics);
        setLoading(false);
      })
      .catch(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const setMetric = (field: MetricKey, value: number) => {
    setMetrics((prev) => ({ ...prev, [field]: value }));
    setSavedAt(null);
  };

  const setDay = (raw: number) => {
    const day = Math.max(1, Math.min(28, Math.round(raw || 1)));
    setMetrics((prev) => ({
      ...prev,
      day_of_cycle: day,
      cycle_phase: cyclePhaseForDay(day),
    }));
    setSavedAt(null);
  };

  const burden = (
    metrics.breast_soreness_vas +
    metrics.painful_touch_vas +
    metrics.pelvic_pressure_vas +
    Math.min(10, metrics.bloating_delta_cm) +
    metrics.fatigue_mfi5_vas +
    (metrics.acne_severity_likert / 4) * 10 +
    (metrics.hirsutism_mfg_score / 36) * 10
  ) / 7;
  const tone = getSeverity(burden);

  const handleSave = async () => {
    setSaving(true);
    try {
      const entry = await saveSymptomLog(metrics);
      setTodayEntry(entry);
      setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="clin-page">
      <div className="clin-wrap">
        <div className="clin-top">
          <Link href="/dashboard" className="clin-back">
            <ArrowLeft size={17} /> Back to dashboard
          </Link>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="clin-mark" />
        </div>

        <section className="clin-hero">
          <span className="clin-kicker">Daily symptom intensity</span>
          <h1>Check in with your body.</h1>
          <p>
            Seven clinical measures used by the AIMHER prediction model.
            Adjust the sliders and save your entry once a day.
          </p>
        </section>

        {savedAt && (
          <div className="clin-success" style={{ marginTop: 14 }}>
            <Check size={18} /> Saved at {savedAt} — ready for your next prediction.
          </div>
        )}

        <div className="clin-section">
          <div className="clin-section-label">Cycle context</div>
          <div className="clin-card">
            <div className="clin-card-head">
              <div>
                <h2>Where are you in your cycle?</h2>
                <p>The phase updates from your day, but you can change it.</p>
              </div>
              <div className="clin-card-ico"><CalendarDays size={19} /></div>
            </div>
            <div className="clin-two">
              <div className="ob-field">
                <label htmlFor="cycle-day">Day of cycle</label>
                <input
                  id="cycle-day"
                  className="ob-input"
                  type="number"
                  min={1}
                  max={28}
                  value={metrics.day_of_cycle}
                  onChange={(e) => setDay(Number(e.target.value))}
                />
              </div>
              <div className="ob-field">
                <label>Cycle phase</label>
                <div className="clin-grid" style={{ gap: 6 }}>
                  {CYCLE_PHASES.map((phase: CyclePhase) => (
                    <button
                      key={phase}
                      type="button"
                      className={`clin-pill ${metrics.cycle_phase === phase ? 'active' : ''}`}
                      style={{ justifyContent: 'center', padding: '8px 6px', fontSize: '0.72rem' }}
                      onClick={() => setMetrics((prev) => ({ ...prev, cycle_phase: phase }))}
                    >
                      {phase}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="clin-section">
          <div className="clin-section-label">Symptom intensity</div>
          <div className="clin-card">
            <div className="clin-card-head">
              <div>
                <h2>How intense is it today?</h2>
                <p>Slide to the number that best matches how you feel right now.</p>
              </div>
              <div className="clin-card-ico"><ClipboardList size={19} /></div>
            </div>
            <VASSlider
              label="Breast soreness"
              description="Tenderness or aching in the breasts"
              value={metrics.breast_soreness_vas}
              onChange={(v) => setMetric('breast_soreness_vas', v)}
              lowLabel="None"
              highLabel="Severe"
            />
            <VASSlider
              label="Painful touch"
              description="Sensitivity to touch or pressure"
              value={metrics.painful_touch_vas}
              onChange={(v) => setMetric('painful_touch_vas', v)}
              lowLabel="None"
              highLabel="Severe"
            />
            <VASSlider
              label="Pelvic pressure"
              description="Heaviness, fullness or pressure in the pelvis"
              value={metrics.pelvic_pressure_vas}
              onChange={(v) => setMetric('pelvic_pressure_vas', v)}
              lowLabel="None"
              highLabel="Severe"
            />
            <VASSlider
              label="Bloating"
              description="Change in abdominal measurement"
              value={metrics.bloating_delta_cm}
              onChange={(v) => setMetric('bloating_delta_cm', v)}
              min={0}
              max={10}
              step={0.5}
              unit="cm"
              lowLabel="No change"
              highLabel="+10 cm"
            />
            <VASSlider
              label="Fatigue"
              description="MFI-5 fatigue score"
              value={metrics.fatigue_mfi5_vas}
              onChange={(v) => setMetric('fatigue_mfi5_vas', v)}
              lowLabel="Energized"
              highLabel="Exhausted"
            />
          </div>

          <div className="clin-card">
            <div className="clin-card-head">
              <div>
                <h2>Visible signs</h2>
                <p>Recorded on their clinical scales, then normalized for your trend view.</p>
              </div>
              <div className="clin-card-ico"><Sparkles size={19} /></div>
            </div>
            <VASSlider
              label="Acne severity"
              description="Likert score from 0 (clear) to 4 (severe)"
              value={metrics.acne_severity_likert}
              onChange={(v) => setMetric('acne_severity_likert', v)}
              min={0}
              max={4}
              lowLabel="Clear"
              highLabel="Severe"
            />
            <VASSlider
              label="Hirsutism (mFG)"
              description="Modified Ferriman-Gallwey score"
              value={metrics.hirsutism_mfg_score}
              onChange={(v) => setMetric('hirsutism_mfg_score', v)}
              min={0}
              max={36}
              lowLabel="0"
              highLabel="36"
            />
          </div>
        </div>

        {metrics.pelvic_pressure_vas >= 7 && (
          <div className="clin-alert" style={{ marginTop: 14 }}>
            <span>⚠️</span>
            <span>High pelvic pressure recorded. If pain is severe or sudden, please speak to a clinician.</span>
          </div>
        )}

        <div className="clin-section">
          <div className="clin-section-label">Today&apos;s summary</div>
          <div className="clin-card">
            <div className="clin-row" style={{ borderTop: 0 }}>
              <div className="clin-row-main">
                <strong>Overall symptom burden</strong>
                <small>Normalized across the seven clinical measures</small>
              </div>
              <div style={{ textAlign: 'right' }}>
                <b style={{ color: tone.color, fontSize: '1.45rem', letterSpacing: '-0.02em' }}>
                  {burden.toFixed(1)}
                </b>
                <span style={{ color: '#9aa6a3', fontSize: '0.72rem' }}> /10</span>
                <div className="clin-chip" style={{ background: tone.bg, color: tone.color }}>{tone.label}</div>
              </div>
            </div>
            <div className="clin-divider" />
            <button
              type="button"
              className="clin-btn"
              style={{ width: '100%' }}
              onClick={handleSave}
              disabled={saving || loading}
            >
              {saving ? 'Saving…' : todayEntry ? 'Update today’s entry' : 'Save today’s entry'}
              {!saving && <ChevronRight size={17} />}
            </button>
            <p className="clin-note">
              {todayEntry ? 'You can update this entry at any time today.' : 'One entry per day. Your values feed the next risk prediction.'}
            </p>
          </div>
        </div>

        <div className="clin-section">
          <Link
            href="/log/morning"
            className="clin-card"
            style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', color: 'inherit' }}
          >
            <div className="clin-card-ico">☀️</div>
            <div style={{ flex: 1 }}>
              <h2>Morning check-in</h2>
              <p>A quicker log for fatigue, pelvic pressure and pain sensitivity.</p>
            </div>
            <ChevronRight size={19} color="#9aa6a3" />
          </Link>
        </div>

        <p className="clin-note" style={{ textAlign: 'center', marginTop: 20 }}>
          Symptom logging supports monitoring and does not replace a clinical diagnosis.
        </p>
      </div>
    </div>
  );
}
