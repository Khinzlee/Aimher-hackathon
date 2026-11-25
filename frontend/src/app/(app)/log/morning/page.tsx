'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronLeft } from 'lucide-react';
import VASSlider from '@/components/VASSlider';

const QUESTIONS = {
  fatigue: { label: 'Physical Fatigue', desc: 'How tired or physically drained do you feel?', low: 'Energized', high: 'Exhausted' },
  pelvic: { label: 'Pelvic Pressure', desc: 'Any lower abdominal pressure or discomfort?', low: 'No pressure', high: 'Intense' },
};

const PSQ = [
  { id: 'skin', label: 'Skin Sensitivity', desc: 'How sensitive is your skin to light touch today?' },
  { id: 'muscle', label: 'Muscle Pressure Pain', desc: 'Does pressure on your muscles feel painful today?' },
  { id: 'tenderness', label: 'Overall Body Tenderness', desc: 'How would you rate your overall body tenderness?' },
];

export default function MorningCheckinPage() {
  const router = useRouter();
  const [fatigue, setFatigue] = useState(0);
  const [pelvic, setPelvic] = useState(0);
  const [psq, setPsq] = useState<Record<string, number>>({ skin: 0, muscle: 0, tenderness: 0 });
  const [done, setDone] = useState(false);

  const psqValues = PSQ.map((q) => psq[q.id] ?? 0);
  const hyperalgesia = psqValues.reduce((a, b) => a + b, 0) / psqValues.length;

  function complete() {
    try {
      localStorage.setItem('morning_checkin', JSON.stringify({
        date: new Date().toISOString().slice(0, 10),
        fatigue, pelvic, psq,
        hyperalgesia_index: hyperalgesia,
      }));
    } catch {}
    setDone(true);
    setTimeout(() => router.push('/dashboard'), 1200);
  }

  if (done) {
    return (
      <div className="app-wrap" style={{ textAlign: 'center', paddingTop: 80 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#e3f4ea', color: '#1f7a45', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
          <Check size={36} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Morning Check-In Complete!</h2>
        <p style={{ color: 'var(--muted)', marginTop: 8 }}>Your health data has been saved.</p>
      </div>
    );
  }

  return (
    <div className="app-wrap" style={{ paddingTop: 8 }}>
      <button onClick={() => router.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--muted)', font: 'inherit', cursor: 'pointer', padding: '8px 0' }}>
        <ChevronLeft size={18} /> Back
      </button>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 8 }}>Symptom Intensity Logging</h1>
      <p style={{ color: 'var(--muted)', marginTop: 4, marginBottom: 24 }}>How are you feeling this morning?</p>

      <div className="d-card" style={{ padding: '18px 16px' }}>
        <VASSlider label={QUESTIONS.fatigue.label} description={QUESTIONS.fatigue.desc}
          value={fatigue} onChange={setFatigue} lowLabel={QUESTIONS.fatigue.low} highLabel={QUESTIONS.fatigue.high} />
        <div style={{ height: 1, background: 'var(--line)', margin: '8px 0 20px' }} />
        <VASSlider label={QUESTIONS.pelvic.label} description={QUESTIONS.pelvic.desc}
          value={pelvic} onChange={setPelvic} lowLabel={QUESTIONS.pelvic.low} highLabel={QUESTIONS.pelvic.high} />
      </div>

      <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '28px 0 4px' }}>Painful Touch / Hyperalgesia</h2>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 12 }}>Pain Sensitivity Questionnaire (PSQ-3)</p>

      <div className="d-card" style={{ padding: '18px 16px' }}>
        {PSQ.map((q, i) => (
          <div key={q.id}>
            {i > 0 && <div style={{ height: 1, background: 'var(--line)', margin: '8px 0 20px' }} />}
            <VASSlider label={q.label} description={q.desc}
              value={psq[q.id] ?? 0}
              onChange={(v) => setPsq((p) => ({ ...p, [q.id]: v }))} />
          </div>
        ))}
      </div>

      <div className="d-card" style={{ padding: '18px 16px', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 700 }}>Hyperalgesia Index</div>
          <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
            {hyperalgesia < 3 ? 'None' : hyperalgesia < 6 ? 'Mild' : hyperalgesia < 8 ? 'Moderate' : 'Severe'}
          </div>
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--teal)' }}>
          {hyperalgesia.toFixed(1)}<span style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 500 }}> /10</span>
        </div>
      </div>

      <button className="d-btn" style={{ marginTop: 24, background: 'var(--teal)', color: '#fff' }} onClick={complete}>
        <Check size={18} /> Complete Morning Check-In
      </button>
    </div>
  );
}
