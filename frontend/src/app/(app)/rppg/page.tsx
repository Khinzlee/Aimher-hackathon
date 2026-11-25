"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity, ArrowLeft, Brain, Camera, Clock, RefreshCw, Sparkles,
} from 'lucide-react';
import {
  rppgV8Service, REGRESSION_TARGETS,
  type RppgV8Session,
} from '@/services/rppgV8Service';
import { useNow } from '@/hooks/useNow';

function isRiskTarget(target: string): boolean {
  const t = target.toLowerCase();
  return t.includes('risk') || t.includes('stress') || t.includes('failure') || t.includes('syndrome');
}

function interpretation(target: string, value: number): string {
  const t = target.toLowerCase();
  if (t.includes('sleep')) return value >= 70 ? 'Restorative sleep' : value >= 50 ? 'Room to improve' : 'Prioritise sleep';
  if (t.includes('focus')) return value >= 70 ? 'Sharp focus' : value >= 50 ? 'Steady focus' : 'Focus may be dipping';
  if (t.includes('mental')) return value >= 70 ? 'Feeling well' : value >= 50 ? 'Monitor stress' : 'Needs attention';
  if (t.includes('risk') || t.includes('stress') || t.includes('failure')) {
    return value >= 60 ? 'Elevated — keep monitoring' : value >= 40 ? 'Mild — stay on track' : 'Low risk';
  }
  return value >= 70 ? 'Strong result' : value >= 50 ? 'Moderate result' : 'Needs attention';
}

function formatRemaining(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export default function RppgPassiveSensing() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const now = useNow();
  const [nextCaptureAt, setNextCaptureAt] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState('');

  const { data: sessionsData, isLoading, error: sessionsError } = useQuery({
    queryKey: ['rppg-v8-sessions'],
    queryFn: () => rppgV8Service.getSessions(),
    staleTime: 5 * 60 * 1000,
  });
  const { data: predictionsData, error: predictionsError } = useQuery({
    queryKey: ['rppg-v8-predictions'],
    queryFn: () => rppgV8Service.predictAll(),
    staleTime: 2 * 60 * 1000,
  });

  const sessions: RppgV8Session[] = sessionsData?.data?.sessions ?? [];
  const predictions = predictionsData?.data ?? null;
  const error = sessionsError?.message ?? predictionsError?.message ?? null;

  useEffect(() => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) {
      localStorage.removeItem('nextRppgV8CaptureAt');
      return;
    }
    const stored = localStorage.getItem('nextRppgV8CaptureAt');
    if (stored) {
      const ts = Number(stored);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (ts > Date.now()) setNextCaptureAt(ts);
      else localStorage.removeItem('nextRppgV8CaptureAt');
    }
  }, []);

  useEffect(() => {
    if (!nextCaptureAt) return;
    const update = () => {
      const remaining = nextCaptureAt - Date.now();
      if (remaining <= 0) {
        setNextCaptureAt(null);
        localStorage.removeItem('nextRppgV8CaptureAt');
      } else {
        setTimeRemaining(formatRemaining(remaining));
      }
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [nextCaptureAt]);

  const todaySessions = now
    ? sessions.filter((s) => new Date(s.capturedAt).toDateString() === now.toDateString())
    : [];

  const avg = (field: keyof RppgV8Session, decimals = 1): string => {
    if (!todaySessions.length) return '--';
    const values = todaySessions
      .map((s) => s[field])
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    if (!values.length) return '--';
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(decimals);
  };

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['rppg-v8-sessions'] });
    queryClient.invalidateQueries({ queryKey: ['rppg-v8-predictions'] });
  };

  const latest = sessions[0] ?? null;
  const waiting = Boolean(nextCaptureAt && now && now.getTime() < nextCaptureAt);

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
          <span className="clin-kicker">rPPG passive sensing</span>
          <h1>Your vitals, quietly tracked.</h1>
          <p>Camera-based physiological sensing powers ten wellness and risk insights.</p>
        </section>

        {error && <div className="clin-alert" style={{ marginTop: 14 }}>{error}</div>}

        <div className="clin-section">
          <div className="clin-card">
            <div className="clin-card-head">
              <div>
                <h2>Capture status</h2>
                <p>{waiting ? `Next capture in ${timeRemaining}` : 'Ready when you are — about 2 minutes.'}</p>
              </div>
              <div className="clin-card-ico"><Clock size={19} /></div>
            </div>
            <div className="clin-actions">
              <button
                type="button"
                className="clin-btn"
                onClick={() => router.push('/rppg/capture')}
                disabled={waiting}
              >
                <Camera size={17} /> {waiting ? 'Please wait' : 'Start capture'}
              </button>
              <button type="button" className="clin-btn ghost" onClick={refresh}>
                <RefreshCw size={16} /> Refresh
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="clin-section">
            <div className="clin-card clin-empty">Loading your readings…</div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="clin-section">
            <div className="clin-card clin-empty">
              <div className="empty-ico"><Camera size={28} /></div>
              <h3>No sessions yet</h3>
              <p>Start a capture to see your heart rate, HRV, oxygen saturation and wellness insights.</p>
              <button type="button" className="clin-btn" onClick={() => router.push('/rppg/capture')}>
                <Camera size={17} /> Start your first capture
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="clin-section">
              <div className="clin-section-label">Today&apos;s averages</div>
              <div className="clin-card">
                <div className="clin-grid four">
                  <div className="clin-tile"><div className="t-label">Heart rate</div><div className="t-value">{avg('heartRate', 0)}</div><div className="t-unit">bpm</div></div>
                  <div className="clin-tile"><div className="t-label">RMSSD</div><div className="t-value">{avg('rmssd')}</div><div className="t-unit">ms</div></div>
                  <div className="clin-tile"><div className="t-label">HRV</div><div className="t-value">{avg('hrv')}</div><div className="t-unit">ms</div></div>
                  <div className="clin-tile"><div className="t-label">SpO₂</div><div className="t-value">{avg('estimatedSpO2', 0)}</div><div className="t-unit">%</div></div>
                  <div className="clin-tile"><div className="t-label">Skin temp</div><div className="t-value">{avg('skinTemperature')}</div><div className="t-unit">°C</div></div>
                  <div className="clin-tile"><div className="t-label">EDA</div><div className="t-value">{avg('meanEda', 2)}</div><div className="t-unit">µS</div></div>
                  <div className="clin-tile"><div className="t-label">LF/HF</div><div className="t-value">{avg('lfHfRatio', 2)}</div><div className="t-unit">ratio</div></div>
                  <div className="clin-tile"><div className="t-label">Respiration</div><div className="t-value">{avg('respiratoryRate')}</div><div className="t-unit">br/min</div></div>
                </div>
              </div>
            </div>

            <div className="clin-section">
              <div className="clin-section-label">Wellness insights</div>
              <div className="clin-card">
                <div className="clin-card-head">
                  <div>
                    <h2>Downstream health outcomes</h2>
                    <p>Model estimates from your most recent rPPG session.</p>
                  </div>
                  <div className="clin-card-ico"><Sparkles size={19} /></div>
                </div>
                {predictions?.regression && Object.keys(predictions.regression).length > 0 ? (
                  REGRESSION_TARGETS.map((target) => {
                    const value = predictions.regression?.[target]?.ensemble;
                    const color = isRiskTarget(target)
                      ? (value ?? 0) >= 60 ? '#d94a55' : (value ?? 0) >= 40 ? '#e07a2d' : '#2f9e63'
                      : (value ?? 0) >= 70 ? '#2f9e63' : (value ?? 0) >= 50 ? '#d39a22' : '#d94a55';
                    return (
                      <div className="clin-row" key={target}>
                        <div className="clin-row-main">
                          <strong>{target.replace(/_/g, ' ')}</strong>
                          <small>{value != null ? interpretation(target, value) : 'No value yet'}</small>
                        </div>
                        <div className="clin-keyline">
                          <div className="clin-bar"><span style={{ width: `${Math.max(0, Math.min(100, value ?? 0))}%`, background: color }} /></div>
                          <b style={{ color, fontSize: '0.82rem', minWidth: 44, textAlign: 'right' }}>
                            {value != null ? `${value.toFixed(0)}%` : '--'}
                          </b>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="clin-note">Complete a capture to unlock these insights.</p>
                )}
              </div>

              {predictions?.mood_check?.best_prediction && (
                <div className="clin-card">
                  <div className="clin-card-head">
                    <div>
                      <h2>Mood check</h2>
                      <p>From the same passive sensing session.</p>
                    </div>
                    <div className="clin-card-ico"><Brain size={19} /></div>
                  </div>
                  <div className="clin-row" style={{ borderTop: 0 }}>
                    <div className="clin-row-main">
                      <strong style={{ fontSize: '1.1rem' }}>{predictions.mood_check.best_prediction.label}</strong>
                      <small>{predictions.mood_check.best_algorithm || 'Model'} · {predictions.nSessions || sessions.length} sessions used</small>
                    </div>
                    <span className="clin-chip good">
                      {(predictions.mood_check.best_prediction.confidence * 100).toFixed(0)}% confidence
                    </span>
                  </div>
                </div>
              )}
            </div>

            {latest && (
              <div className="clin-section">
                <div className="clin-section-label">Latest session</div>
                <div className="clin-card">
                  <div className="clin-card-head">
                    <div>
                      <h2>Advanced markers</h2>
                      <p>{new Date(latest.capturedAt).toLocaleString()}</p>
                    </div>
                    <div className="clin-card-ico"><Activity size={19} /></div>
                  </div>
                  <div className="clin-grid four">
                    <div className="clin-tile"><div className="t-label">ASI</div><div className="t-value">{latest.asi?.toFixed(3) ?? '--'}</div></div>
                    <div className="clin-tile"><div className="t-label">AC/DC</div><div className="t-value">{latest.acDcRatio?.toFixed(3) ?? '--'}</div></div>
                    <div className="clin-tile"><div className="t-label">Signal</div><div className="t-value">{latest.signalQuality ?? '--'}</div><div className="t-unit">%</div></div>
                    <div className="clin-tile"><div className="t-label">Pulse amp</div><div className="t-value">{latest.pulseAmplitude?.toFixed(3) ?? '--'}</div></div>
                  </div>
                  <div className="clin-divider" />
                  <div className="clin-list">
                    <div className="clin-list-row"><span>Temperature</span><strong>{latest.skinTemperature ?? '--'}°C</strong></div>
                    <div className="clin-list-row"><span>EDA</span><strong>{latest.meanEda ?? '--'} µS</strong></div>
                    <div className="clin-list-row"><span>Respiratory rate</span><strong>{latest.respiratoryRate ?? '--'} br/min</strong></div>
                    <div className="clin-list-row"><span>Session quality</span><strong style={{ textTransform: 'capitalize' }}>{latest.sessionQuality ?? 'unknown'}</strong></div>
                  </div>
                </div>
              </div>
            )}

            <div className="clin-section">
              <div className="clin-section-label">Session history</div>
              <div className="clin-card">
                <div className="clin-list">
                  {sessions.slice(0, 12).map((session) => (
                    <div className="clin-list-row" key={session.id}>
                      <span>{new Date(session.capturedAt).toLocaleString()}</span>
                      <span className="clin-keyline">
                        <strong>{session.heartRate || '--'} bpm</strong>
                        <span>·</span>
                        <strong>{session.rmssd?.toFixed(0) ?? '--'} ms RMSSD</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        <p className="clin-note" style={{ textAlign: 'center', marginTop: 20 }}>
          rPPG estimates are wellness indicators, not a medical diagnosis.
        </p>
      </div>
    </div>
  );
}
