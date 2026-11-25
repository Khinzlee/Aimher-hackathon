'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity, Camera, ChevronRight, ClipboardList, Droplets,
  HeartPulse, Moon, Stethoscope, Target, Thermometer,
} from 'lucide-react';
import { getConditionSummaries } from '@/lib/symptomService';
import { useNow } from '@/hooks/useNow';
import { useProfile } from '@/hooks/useProfile';

/* ---------- helpers ---------- */
// Deterministic fallback during prerender; the real date arrives after mount via useNow().
const PRERENDER_DATE = new Date(0);

function greeting(d: Date) {
  const h = d.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function severity(score: number) {
  if (score < 1) return { label: 'None', fg: '#1f7a45', bg: '#e3f4ea' };
  if (score < 4) return { label: 'Mild', fg: '#b86e12', bg: '#fdf0dc' };
  if (score < 6.5) return { label: 'Moderate', fg: '#c2570c', bg: '#fde8d6' };
  if (score < 8) return { label: 'Severe', fg: '#c62f3a', bg: '#fde3e5' };
  return { label: 'Extreme', fg: '#8c1d1d', bg: '#f8d7d7' };
}

const ICONS: Record<string, { Icon: any; color: string; bg: string }> = {
  infertility: { Icon: Target, color: '#7c5ce6', bg: '#efeafd' },
  dysmenorrhea: { Icon: Thermometer, color: '#e8742a', bg: '#fdeee2' },
  pmdd: { Icon: Moon, color: '#5b6ee6', bg: '#e9ecfd' },
  t2d: { Icon: Droplets, color: '#2f8fd8', bg: '#e1f0fb' },
  cvd: { Icon: HeartPulse, color: '#e2475a', bg: '#fde6e9' },
  endometrial: { Icon: Stethoscope, color: '#d13a3a', bg: '#fbe4e4' },
};

function iconFor(title: string) {
  const t = title.toLowerCase();
  const key = Object.keys(ICONS).find((k) => t.includes(k));
  return key ? ICONS[key] : { Icon: Activity, color: '#3a8a7b', bg: '#e3f1ee' };
}

/* Reads a condition summary using several likely field names. */
function adapt(s: any) {
  const series: number[] = (s.history ?? s.series ?? s.trend ?? s.scores ?? [])
    .map((v: any) => (typeof v === 'number' ? v : Number(v?.score ?? v?.value ?? 0)));
  const score = Number(s.score ?? s.latest ?? s.current ?? series[series.length - 1] ?? 0);
  const delta =
    s.delta ?? s.change ??
    (series.length > 1 ? series[series.length - 1] - series[series.length - 2] : 0);
  return {
    id: String(s.id ?? s.conditionId ?? s.key ?? s.slug ?? s.name),
    title: String(s.shortName ?? s.name ?? s.label ?? s.title ?? 'Condition'),
    subtitle: String(s.fullName ?? s.subtitle ?? s.description ?? ''),
    score,
    delta: Number(delta) || 0,
    series,
  };
}

function Spark({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return <div style={{ width: 96 }} />;
  const w = 96, h = 34;
  const min = Math.min(...data), max = Math.max(...data), r = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - 3 - ((v - min) / r) * (h - 6)}`)
    .join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------- page ---------- */
export default function DashboardPage() {
  const [summaries, setSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const now = useNow() ?? PRERENDER_DATE;
  const profileData: any = useProfile();
  const profile = profileData?.profile ?? profileData ?? {};

  useEffect(() => {
    let alive = true;
    Promise.resolve(getConditionSummaries())
      .then((r: any) => alive && setSummaries(Array.isArray(r) ? r : []))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const fullName: string = profile.fullName ?? profile.name ?? profile.full_name ?? '';
  const first = fullName.split(' ')[0];
  const patientId = profile.patientId ?? profile.patient_id ?? '';
  const h = Number(profile.height ?? profile.heightCm ?? 0);
  const w = Number(profile.weight ?? profile.weightKg ?? 0);
  const bmi = h && w ? w / Math.pow(h / 100, 2) : 0;

  const dateText = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const items = summaries.map(adapt);

  return (
    <div className="app-wrap">
      <header className="d-top">
        <div className="d-brand">
          <img src="/logo.png" alt="" />
          AIMHER
        </div>
        <Link href="/profile" className="d-avatar" aria-label="Profile">
          {(first || 'U').charAt(0).toUpperCase()}
        </Link>
      </header>

      <section className="d-hero">
        <div className="date">{dateText}</div>
        <h1>{greeting(now)}{first ? `, ${first}` : ''}</h1>
        <p>Symptom burden across {items.length || 6} tracked conditions</p>
        <Link href="/log" className="d-btn">
          <ClipboardList size={18} /> Log today&apos;s symptoms
        </Link>
      </section>

      <div className="d-grid2">
        <Link href="/log" className="d-card d-tile">
          <div className="ico" style={{ background: '#e3f1ee', color: '#3a8a7b' }}><ClipboardList size={22} /></div>
          <b>Log Symptoms</b>
          <span>Rate intensity for your tracked conditions</span>
        </Link>
        <Link href="/rppg" className="d-card d-tile">
          <div className="ico" style={{ background: '#e1f4ea', color: '#2f9e63' }}><Camera size={22} /></div>
          <b>rPPG Sensing</b>
          <span>Capture HR, HRV &amp; SpO₂ with your camera</span>
        </Link>
      </div>

      <div className="d-label">Your profile</div>
      <Link href="/profile" className="d-card d-profile">
        <div className="big">{(first || 'U').charAt(0).toUpperCase()}</div>
        <div className="info">
          <div className="name">{fullName || 'Complete your profile'}</div>
          {patientId && <div className="pid">{patientId}</div>}
          {bmi > 0 && (
            <span className="d-chip" style={{ background: '#eef2f4', color: '#4a5666', marginTop: 6 }}>
              BMI {bmi.toFixed(1)}
            </span>
          )}
        </div>
        <ChevronRight size={20} color="#9aa5b1" />
      </Link>

      <div className="d-label">Your conditions</div>

      {loading && <div className="d-card d-empty">Loading your health summary…</div>}
      {!loading && items.length === 0 && (
        <div className="d-card d-empty">No entries yet. Log your first symptoms to see trends here.</div>
      )}

      {items.map((c) => {
        const sev = severity(c.score);
        const ic = iconFor(c.title);
        const down = c.delta < 0;
        return (
          <Link key={c.id} href={`/conditions/${c.id}`} className="d-card d-cond">
            <div className="ico" style={{ background: ic.bg, color: ic.color }}>
              <ic.Icon size={22} />
            </div>
            <div className="mid">
              <div className="title">{c.title}</div>
              {c.subtitle && <div className="sub">{c.subtitle}</div>}
              <div className="score">
                <strong style={{ color: sev.fg }}>{c.score.toFixed(1)}</strong>
                <small>/10</small>
                <span className="d-chip" style={{ background: sev.bg, color: sev.fg }}>{sev.label}</span>
              </div>
              {c.delta !== 0 && (
                <div className="delta" style={{ color: down ? '#1f7a45' : '#c62f3a' }}>
                  {down ? '▼' : '▲'} {Math.abs(c.delta).toFixed(1)} vs previous entry
                </div>
              )}
            </div>
            <Spark data={c.series} color={ic.color} />
          </Link>
        );
      })}
    </div>
  );
}
