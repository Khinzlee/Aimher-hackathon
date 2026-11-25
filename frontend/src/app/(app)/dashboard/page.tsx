'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Camera, ChevronRight, ClipboardList } from 'lucide-react';
import {
  DISEASES,
  burdenSeverity,
  diseaseRouteId,
  probabilitySeverity,
  riskScoreSeverity,
} from '@/lib/symptoms';
import {
  getSymptomHistory,
  getCachedPrediction,
  type DiseasePredictionMap,
  type PredictResponse,
  type SymptomLogEntry,
} from '@/lib/symptomService';
import SeverityBadge from '@/components/SeverityBadge';
import Sparkline from '@/components/Sparkline';
import { SymptomIcon } from '@/components/SymptomIcon';
import { useNow } from '@/hooks/useNow';
import { useProfile } from '@/hooks/useProfile';

function greeting(d: Date) {
  const h = d.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const [entries, setEntries] = useState<SymptomLogEntry[] | null>(null);
  const [prediction, setPrediction] = useState<PredictResponse | null>(null);
  const now = useNow();
  const profile = useProfile();
  const firstName = profile?.full_name?.split(' ')[0];

  useEffect(() => {
    let alive = true;
    getSymptomHistory(30).then((h) => {
      if (!alive) return;
      setEntries(h.data);
      setPrediction(getCachedPrediction());
    });
    return () => {
      alive = false;
    };
  }, []);

  const today = now
    ? now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
    : '';

  const latest = entries?.[0] ?? null;
  const burden = latest?.symptomBurdenScore ?? null;
  const burdenSev = burden !== null ? burdenSeverity(burden) : null;
  const diseases: DiseasePredictionMap = prediction?.diseases ?? {};
  const burdenSeries = (entries ?? []).slice().reverse().map((e) => e.symptomBurdenScore);

  const flagged = DISEASES.filter((d) => {
    const p = diseases[d.key];
    return p && (p.severity === 'High' || p.predicted === 1);
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">{today}</p>
        <h1 className="text-2xl font-bold">
          {now ? greeting(now) : 'Hello'}
          {firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Symptom burden &amp; disease risk from your latest log
        </p>
      </div>

      {/* Quick actions */}
      <div className="space-y-3">
        {[
          {
            href: '/log',
            icon: ClipboardList,
            title: 'Log Symptoms',
            subtitle: 'Rate intensity — runs risk prediction',
            gradient: 'bg-teal-500',
          },
          {
            href: '/rppg',
            icon: Camera,
            title: 'rPPG Passive Sensing',
            subtitle: 'Capture HR, HRV, SpO₂ & more with your camera',
            gradient: 'bg-emerald-500',
          },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="w-full rounded-2xl border border-gray-200 bg-white p-4 flex items-center gap-4 hover:shadow-md transition-shadow group"
          >
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${a.gradient}`}>
              <a.icon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-gray-900">{a.title}</h3>
              <p className="text-xs text-gray-500 truncate">{a.subtitle}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
          </Link>
        ))}
      </div>

      {flagged.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 flex gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs text-red-800">
            Elevated risk flagged for {flagged.map((d) => d.name).join(', ')}. Review the cards below.
          </p>
        </div>
      )}

      {/* Burden summary */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-sm text-gray-900">Symptom Burden Score</h2>
          {burden !== null && <SeverityBadge severity={burdenSev!} />}
        </div>
        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold tabular-nums" style={{ color: burdenSev?.color ?? '#9CA3AF' }}>
              {burden !== null ? burden.toFixed(1) : '—'}
            </span>
            <span className="text-sm text-gray-400">/10</span>
          </div>
          <Sparkline data={burdenSeries} color="#00897B" width={140} height={44} />
        </div>
        {latest && (
          <p className="text-[11px] text-gray-400 mt-2">
            From log from {new Date(latest.loggedAt).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Disease risk cards */}
      <div className="space-y-3">
        <h2 className="font-bold text-sm text-gray-900 px-1">Disease Risk Prediction</h2>
        {!prediction ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
            <p className="text-sm text-gray-500">
              No prediction yet — log your symptoms to generate disease risk scores.
            </p>
          </div>
        ) : (
          DISEASES.map((d) => {
            const pred = diseases[d.key];
            if (!pred) return null;
            const probSev = probabilitySeverity(pred.probability);
            const riskSev = riskScoreSeverity(pred.riskScore);
            const elevated = pred.severity === 'High' || pred.predicted === 1;
            return (
              <Link
                key={d.key}
                href={`/conditions/${diseaseRouteId(d.key)}`}
                className={`block bg-white rounded-2xl border p-4 transition-shadow hover:shadow-md ${
                  elevated ? 'border-red-300' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${d.color}1A` }}
                  >
                    <SymptomIcon name={d.icon} className="h-5 w-5" style={{ color: d.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 text-sm">{d.name}</h3>
                      {elevated && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-semibold">
                          <AlertTriangle className="h-3 w-3" /> Flagged
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{d.fullName}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <span className="text-gray-500">
                        Probability{' '}
                        <strong className="tabular-nums" style={{ color: probSev.color }}>
                          {(pred.probability * 100).toFixed(0)}%
                        </strong>
                      </span>
                      <SeverityBadge severity={probSev} />
                      <span className="text-gray-500">
                        Risk score{' '}
                        <strong className="tabular-nums" style={{ color: riskSev.color }}>
                          {(pred.riskScore * 100).toFixed(0)}%
                        </strong>
                      </span>
                      <SeverityBadge severity={riskSev} />
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-300 shrink-0 mt-1" />
                </div>
              </Link>
            );
          })
        )}
      </div>

      <p className="text-[11px] text-gray-400 text-center leading-relaxed">
        Predictions are model outputs from your logged symptom intensities — not a
        medical diagnosis.
      </p>
    </div>
  );
}
