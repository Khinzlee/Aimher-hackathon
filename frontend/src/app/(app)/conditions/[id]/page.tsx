'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, ClipboardList } from 'lucide-react';
import { CONDITION_MAP, SYMPTOM_MAP, getConditionSymptoms, getSeverity } from '@/lib/symptoms';
import { getConditionDetail, type ConditionDetail } from '@/lib/symptomService';
import { SymptomIcon } from '@/components/SymptomIcon';

function Trend({ series, color }: { series: { date: string; value: number | null }[]; color: string }) {
  const pts = series.filter((p) => p.value !== null);
  if (pts.length < 2) return <p className="clin-note">Not enough data yet — log a few days to see a trend.</p>;
  const w = 600, h = 140, pad = 8;
  const vals = pts.map((p) => p.value as number);
  const min = Math.min(...vals), max = Math.max(...vals), r = max - min || 1;
  const xy = pts.map((p, i) => {
    const x = pad + (i / (pts.length - 1)) * (w - pad * 2);
    const y = h - pad - (((p.value as number) - min) / r) * (h - pad * 2);
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 140 }}>
      <polyline points={xy.join(' ')} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {xy.map((p, i) => {
        const [x, y] = p.split(',').map(Number);
        return <circle key={i} cx={x} cy={y} r="3.5" fill={color} />;
      })}
    </svg>
  );
}

function ConditionView() {
  const params = useParams<{ id: string }>();
  const conditionId = params.id;
  const [detail, setDetail] = useState<ConditionDetail | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');

  useEffect(() => {
    let alive = true;
    getConditionDetail(conditionId, 30).then((d) => {
      if (!alive) return;
      if (d) { setDetail(d); setState('ready'); }
      else setState('missing');
    });
    return () => { alive = false; };
  }, [conditionId]);

  const cond = CONDITION_MAP[conditionId];

  if (state === 'missing' || (!cond && state === 'ready')) {
    return (
      <div className="clin-page"><div className="clin-wrap">
        <div className="clin-empty">
          <div className="empty-ico"><AlertTriangle size={30} /></div>
          <h3>Condition not found</h3>
          <p>This tracking card doesn&apos;t exist.</p>
          <Link href="/dashboard" className="clin-btn">Back to dashboard</Link>
        </div>
      </div></div>
    );
  }

  if (state === 'loading' || !cond || !detail) {
    return <div className="clin-page"><div className="clin-wrap"><div className="clin-card" style={{ height: 320 }} /></div></div>;
  }

  const { summary, symptoms, entries } = detail;
  const burden = summary.latestBurden;
  const sev = burden != null ? getSeverity(burden) : null;
  const condSymptoms = getConditionSymptoms(cond);
  const symById = new Map(symptoms.map((s) => [s.symptomId, s]));

  return (
    <div className="clin-page">
      <div className="clin-wrap">
        <div className="clin-top">
          <Link href="/dashboard" className="clin-back"><ArrowLeft size={17} /> Dashboard</Link>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="clin-mark" />
        </div>

        <section className="clin-hero" style={{ background: `linear-gradient(135deg, ${cond.color}, ${cond.color}cc)` }}>
          <span className="clin-kicker">Tracked condition</span>
          <h1>{cond.fullName}</h1>
          <p>{cond.description}</p>
        </section>

        {summary.redFlag && cond.redFlagMessage && (
          <div className="clin-alert" style={{ marginTop: 14 }}>
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{cond.redFlagMessage}</span>
          </div>
        )}

        <div className="clin-section">
          <div className="clin-section-label">Latest burden</div>
          <div className="clin-card">
            <div className="clin-card-head">
              <div>
                <h2>Symptom burden score</h2>
                <p>Average intensity across this condition&apos;s tracked symptoms (0–10)</p>
              </div>
              <div className="clin-card-ico"><SymptomIcon name={cond.icon} className="h-5 w-5" /></div>
            </div>
            <div className="clin-grid four">
              <div className="clin-tile">
                <div className="t-label">Latest</div>
                <div className="t-value" style={{ color: sev?.color ?? '#9aa6a3' }}>
                  {burden != null ? burden.toFixed(1) : '—'}
                </div>
                <div className="t-unit">/ 10</div>
              </div>
              <div className="clin-tile">
                <div className="t-label">Severity</div>
                <div className="t-value" style={{ fontSize: '1.05rem' }}>
                  {sev ? (
                    <span className="clin-chip" style={{ background: sev.bg, color: sev.color }}>{sev.label}</span>
                  ) : '—'}
                </div>
              </div>
              <div className="clin-tile">
                <div className="t-label">Entries</div>
                <div className="t-value">{summary.entryCount}</div>
                <div className="t-unit">days logged</div>
              </div>
              <div className="clin-tile">
                <div className="t-label">Delta</div>
                <div className="t-value">
                  {summary.latestBurden != null && summary.previousBurden != null
                    ? `${(summary.latestBurden - summary.previousBurden) >= 0 ? '+' : ''}${(summary.latestBurden - summary.previousBurden).toFixed(1)}`
                    : '—'}
                </div>
                <div className="t-unit">vs previous</div>
              </div>
            </div>
          </div>
        </div>

        <div className="clin-section">
          <div className="clin-section-label">30-day trend</div>
          <div className="clin-card">
            <Trend series={summary.series} color={cond.color} />
          </div>
        </div>

        <div className="clin-section">
          <div className="clin-section-label">Symptom breakdown</div>
          <div className="clin-card">
            {condSymptoms.map((s) => {
              const stat = symById.get(s.id);
              const avgSev = stat?.average != null ? getSeverity(stat.average) : null;
              return (
                <div key={s.id} className="clin-row">
                  <div className="clin-row-main">
                    <strong>{s.label}</strong>
                    <small>{s.description}</small>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, color: cond.color }}>
                      {stat?.average != null ? stat.average.toFixed(1) : '—'}
                    </div>
                    {avgSev && (
                      <span className="clin-chip" style={{ background: avgSev.bg, color: avgSev.color, marginTop: 4 }}>
                        {avgSev.label}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="clin-note">{cond.disclaimer}</p>
        </div>

        <div className="clin-section">
          <div className="clin-section-label">Recent logs</div>
          <div className="clin-card">
            {entries.length === 0 ? (
              <p className="clin-note">No entries yet.</p>
            ) : (
              entries.slice(0, 10).map((e) => {
                const vals = cond.symptomIds
                  .map((id) => e.values[id])
                  .filter((v): v is number => typeof v === 'number');
                const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
                const es = avg != null ? getSeverity(avg) : null;
                return (
                  <div key={e.id} className="clin-row">
                    <div className="clin-row-main">
                      <strong>{new Date(e.loggedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</strong>
                      <small>
                        {e.metrics
                          ? `Day ${e.metrics.day_of_cycle} · ${e.metrics.cycle_phase}`
                          : `${vals.length} symptoms rated`}
                      </small>
                    </div>
                    {avg != null && es && (
                      <span className="clin-chip" style={{ background: es.bg, color: es.color }}>
                        {avg.toFixed(1)} · {es.label}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="clin-actions" style={{ marginTop: 8 }}>
          <Link href="/log" className="clin-btn">
            <ClipboardList size={17} /> Log symptoms
          </Link>
          <Link href="/dashboard" className="clin-btn secondary">Dashboard</Link>
        </div>
      </div>
    </div>
  );
}

export default function ConditionPage() {
  return (
    <Suspense fallback={<div className="clin-page"><div className="clin-wrap"><div className="clin-card" style={{ height: 320 }} /></div></div>}>
      <ConditionView />
    </Suspense>
  );
}
