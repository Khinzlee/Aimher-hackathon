/* eslint-disable @typescript-eslint/no-explicit-any -- rPPG capture flow */
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowLeft, Camera, Check, Heart,
  RefreshCw, Sparkles,
} from 'lucide-react';
import RppgV8Camera, { type ReadinessState } from '@/components/RppgV8Camera';
import { rppgV8Service, type RppgV8SessionPayload } from '@/services/rppgV8Service';
import { toast } from '@/hooks/use-toast';
import { useNow } from '@/hooks/useNow';

function qualityColor(value: number): string {
  if (value >= 60) return '#2f9e63';
  if (value >= 30) return '#d39a22';
  return '#d94a55';
}

export default function RppgV8CaptureScreen() {
  const router = useRouter();
  const now = useNow();
  const [isCapturing, setIsCapturing] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [captureComplete, setCaptureComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<{
    payload: RppgV8SessionPayload;
    predictions?: any;
  } | null>(null);
  const [nextCaptureAt, setNextCaptureAt] = useState<number | null>(null);
  const [readiness, setReadiness] = useState<ReadinessState | null>(null);
  const [showBypass, setShowBypass] = useState(false);

  useEffect(() => {
    if (!showPreview) return;
    setShowBypass(false);
    const timer = setTimeout(() => setShowBypass(true), 5000);
    return () => clearTimeout(timer);
  }, [showPreview]);

  useEffect(() => {
    localStorage.removeItem('nextRppgV8CaptureAt');
  }, []);

  const scheduleNextCapture = useCallback(() => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) return;
    const next = Date.now() + 60 * 60 * 1000;
    localStorage.setItem('nextRppgV8CaptureAt', String(next));
    setNextCaptureAt(next);
  }, []);

  const handleStartCapture = () => {
    setShowPreview(false);
    setIsCapturing(true);
    setCaptureComplete(false);
    setError(null);
  };

  const handleCaptureComplete = async (metrics: RppgV8SessionPayload) => {
    setIsLoading(true);
    setError(null);
    setSessionData({ payload: metrics });
    setCaptureComplete(true);
    setIsCapturing(false);

    try {
      await rppgV8Service.logSession(metrics);
      try {
        const predictions = await rppgV8Service.predictAll();
        setSessionData((prev) => (prev ? { ...prev, predictions } : prev));
      } catch (predictionError) {
        console.warn('Prediction failed (session still saved):', predictionError);
      }
      scheduleNextCapture();
      toast({
        title: 'Measurement complete',
        description: 'Your passive sensing data has been saved.',
      });
    } catch (err: any) {
      if (err?.errors?.length) {
        setError(`Validation: ${err.errors.slice(0, 3).map((e: any) => `${e.field}: ${e.message}`).join('; ')}`);
      } else {
        setError(err?.message ?? 'Could not save this session.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReadinessChange = useCallback((state: ReadinessState) => setReadiness(state), []);
  const reset = () => {
    setCaptureComplete(false);
    setSessionData(null);
    setShowPreview(true);
    setReadiness(null);
    setError(null);
  };

  const p = sessionData?.payload;
  const pred = sessionData?.predictions;
  const blocked = showPreview && readiness !== null && !readiness.allReady && !showBypass;
  const startLabel = isCapturing
    ? 'Capturing…'
    : blocked
      ? showBypass ? 'Continue anyway' : 'Check conditions first'
      : 'Start capture';

  return (
    <div className="clin-page">
      <div className="clin-wrap">
        <div className="clin-top">
          <Link href="/rppg" className="clin-back">
            <ArrowLeft size={17} /> Back to passive sensing
          </Link>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="clin-mark" />
        </div>

        <section className="clin-hero">
          <span className="clin-kicker">Camera capture</span>
          <h1>{captureComplete && p ? 'Measurement complete.' : 'Let’s read your signals.'}</h1>
          <p>
            {captureComplete && p
              ? 'Your physiological metrics are ready.'
              : 'Hold still in good lighting for about two minutes. Nothing is recorded.'}
          </p>
        </section>

        {error && (
          <div className="clin-alert" style={{ marginTop: 14 }}>
            <AlertTriangle size={17} /> {error}
          </div>
        )}

        {captureComplete && p ? (
          <>
            <div className="clin-success" style={{ marginTop: 16 }}>
              <Check size={18} /> {isLoading ? 'Saving your session…' : 'Session saved to your health timeline.'}
            </div>

            <div className="clin-section">
              <div className="clin-section-label">Core vitals</div>
              <div className="clin-card">
                <div className="clin-grid four">
                  <div className="clin-tile"><div className="t-label">Heart rate</div><div className="t-value">{p.heart_rate.toFixed(0)}</div><div className="t-unit">bpm</div></div>
                  <div className="clin-tile"><div className="t-label">RMSSD</div><div className="t-value">{p.rmssd > 0 ? p.rmssd.toFixed(1) : '--'}</div><div className="t-unit">ms</div></div>
                  <div className="clin-tile"><div className="t-label">SpO₂</div><div className="t-value">{p.estimated_spo2.toFixed(1)}</div><div className="t-unit">%</div></div>
                  <div className="clin-tile"><div className="t-label">HRV</div><div className="t-value">{p.hrv > 0 ? p.hrv.toFixed(1) : '--'}</div><div className="t-unit">ms</div></div>
                </div>
              </div>
            </div>

            <div className="clin-section">
              <div className="clin-section-label">Autonomic detail</div>
              <div className="clin-card">
                <div className="clin-grid four">
                  <div className="clin-tile"><div className="t-label">HF power</div><div className="t-value">{p.hf > 0 ? p.hf.toFixed(0) : '--'}</div><div className="t-unit">ms²</div></div>
                  <div className="clin-tile"><div className="t-label">LF/HF</div><div className="t-value">{p.lf_hf_ratio > 0 ? p.lf_hf_ratio.toFixed(2) : '--'}</div></div>
                  <div className="clin-tile"><div className="t-label">Respiration</div><div className="t-value">{p.respiratory_rate?.toFixed(1) ?? '--'}</div><div className="t-unit">br/min</div></div>
                  <div className="clin-tile"><div className="t-label">ASI</div><div className="t-value">{p.asi?.toFixed(3) ?? '--'}</div></div>
                  <div className="clin-tile"><div className="t-label">Skin temp</div><div className="t-value">{p.skin_temperature.toFixed(1)}</div><div className="t-unit">°C</div></div>
                  <div className="clin-tile"><div className="t-label">EDA</div><div className="t-value">{p.mean_eda?.toFixed(2) ?? '--'}</div><div className="t-unit">µS</div></div>
                  <div className="clin-tile"><div className="t-label">AC/DC</div><div className="t-value">{p.ac_dc_ratio?.toFixed(3) ?? '--'}</div></div>
                  <div className="clin-tile"><div className="t-label">Pulse amp</div><div className="t-value">{p.pulse_amplitude?.toFixed(3) ?? '--'}</div></div>
                </div>
                <div className="clin-divider" />
                <div className="clin-card-head" style={{ marginBottom: 8 }}>
                  <div>
                    <h2>Signal quality</h2>
                    <p>{p.session_quality ?? 'unknown'} · {p.session_type} session</p>
                  </div>
                </div>
                <div className="clin-bar" style={{ width: '100%', height: 9 }}>
                  <span style={{ width: `${Math.min(100, p.signal_quality ?? 0)}%`, background: qualityColor(p.signal_quality ?? 0) }} />
                </div>
                <p className="clin-note">{p.signal_quality?.toFixed(0) ?? '--'}% signal confidence</p>
              </div>
            </div>

            {pred && (
              <div className="clin-section">
                <div className="clin-section-label">Instant insights</div>
                <div className="clin-card">
                  <div className="clin-card-head">
                    <div>
                      <h2>Model highlights</h2>
                      <p>Estimates computed from this session.</p>
                    </div>
                    <div className="clin-card-ico"><Sparkles size={19} /></div>
                  </div>
                  {Object.entries(pred.regression ?? {}).slice(0, 5).map(([target, result]: [string, any]) => (
                    <div className="clin-row" key={target}>
                      <div className="clin-row-main"><strong>{target.replace(/_/g, ' ')}</strong></div>
                      <b style={{ color: 'var(--teal-d)', fontSize: '0.86rem' }}>
                        {result?.ensemble != null ? `${result.ensemble.toFixed(0)}%` : '--'}
                      </b>
                    </div>
                  ))}
                  {pred.mood_check?.best_prediction && (
                    <div className="clin-row">
                      <div className="clin-row-main"><strong>Mood check</strong></div>
                      <span className="clin-chip good">{pred.mood_check.best_prediction.label}</span>
                    </div>
                  )}
                  {!pred.regression && !pred.mood_check && (
                    <p className="clin-note">Insights will appear once the inference service is available.</p>
                  )}
                </div>
              </div>
            )}

            <div className="clin-section">
              <div className="clin-actions">
                <button type="button" className="clin-btn secondary" onClick={reset}>
                  <RefreshCw size={16} /> Capture again
                </button>
                <button type="button" className="clin-btn" onClick={() => router.push('/rppg')}>
                  Back to insights
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="clin-section">
              <div className="clin-card">
                <div className="clin-card-head">
                  <div>
                    <h2>Before you begin</h2>
                    <p>Good lighting, a steady position and a clear face give the best signal.</p>
                  </div>
                  <div className="clin-card-ico"><Camera size={19} /></div>
                </div>
                {readiness && (
                  <div className="clin-keyline" style={{ flexWrap: 'wrap', gap: 8 }}>
                    <span className={`clin-chip ${readiness.lighting === 'good' ? 'good' : ''}`}>
                      {readiness.lighting === 'good' ? 'Lighting good' : readiness.lighting === 'checking' ? 'Checking light' : 'Adjust lighting'}
                    </span>
                    <span className={`clin-chip ${readiness.stability === 'steady' ? 'good' : ''}`}>
                      {readiness.stability === 'steady' ? 'Hold steady' : 'Hold still'}
                    </span>
                  </div>
                )}
                {nextCaptureAt && now && (
                  <p className="clin-note">Next capture available in {Math.ceil((nextCaptureAt - now.getTime()) / 3600000)}h.</p>
                )}
              </div>
            </div>

            <div className="clin-section">
              <div className="clin-card" style={{ padding: 12 }}>
                <RppgV8Camera
                  onCaptureComplete={handleCaptureComplete}
                  onCaptureError={(message) => { setError(message); setIsCapturing(false); }}
                  isCapturing={isCapturing}
                  setIsCapturing={setIsCapturing}
                  showPreview={showPreview}
                  onReadinessChange={handleReadinessChange}
                />
              </div>
            </div>

            <div className="clin-section">
              <div className="clin-actions">
                <button
                  type="button"
                  className="clin-btn"
                  onClick={blocked ? () => setShowBypass(true) : handleStartCapture}
                  disabled={isCapturing || isLoading}
                >
                  {isCapturing ? <Activity size={17} /> : <Camera size={17} />} {startLabel}
                </button>
                <Link href="/rppg" className="clin-btn ghost">Cancel</Link>
              </div>
              <p className="clin-note" style={{ textAlign: 'center' }}>
                <Heart size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
                Camera frames are processed on your device.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
