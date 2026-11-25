'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, ClipboardList } from 'lucide-react';
import { diseaseByRouteId, burdenSeverity, probabilitySeverity, riskScoreSeverity } from '@/lib/symptoms';
import { getSymptomHistory, getCachedPrediction, type SymptomLogEntry } from '@/lib/symptomService';
import SeverityBadge from '@/components/SeverityBadge';
import TrendChart from '@/components/TrendChart';
import { SymptomIcon } from '@/components/SymptomIcon';

function DiseaseDetail() {
  const params = useParams<{ id: string }>();
  const disease = diseaseByRouteId(params.id);
  const [entries, setEntries] = useState<SymptomLogEntry[] | null>(null);

  useEffect(() => {
    getSymptomHistory(60).then((h) => setEntries(h.data));
  }, []);

  if (!disease) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Condition not found.</p>
        <Link href="/dashboard" className="text-teal-700 text-sm font-medium mt-2 inline-block">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (!entries) {
    return <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse h-96" />;
  }

  const prediction = getCachedPrediction();
  const pred = prediction?.diseases?.[disease.key] ?? null;
  const probSev = pred ? probabilitySeverity(pred.probability) : null;
  const riskSev = pred ? riskScoreSeverity(pred.riskScore) : null;
  const elevated = pred ? pred.severity === 'High' || pred.predicted === 1 : false;

  // burden + per-entry disease riskScore series (when predictions were cached per entry)
  const burdenSeries = entries
    .slice()
    .reverse()
    .map((e) => ({ date: e.loggedAt.slice(0, 10), value: e.symptomBurdenScore }));
  const riskSeries = entries
    .slice()
    .reverse()
    .map((e) => ({
      date: e.loggedAt.slice(0, 10),
      value: e.prediction?.[disease.key]?.riskScore != null
        ? e.prediction[disease.key].riskScore * 10
        : null,
    }));

  const FIELD_LABELS: [keyof SymptomLogEntry['data'], string][] = [
    ['breast_soreness_vas', 'Breast Soreness'],
    ['painful_touch_vas', 'Painful Touch'],
    ['pelvic_pressure_vas', 'Pelvic Pressure'],
    ['bloating_delta_cm', 'Bloating (cm)'],
    ['fatigue_mfi5_vas', 'Fatigue (MFI-5)'],
    ['acne_severity_likert', 'Acne (0–4)'],
    ['hirsutism_mfg_score', 'Hirsutism mFG'],
  ];

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-start gap-3">
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${disease.color}1A` }}
          >
            <SymptomIcon name={disease.icon} className="h-6 w-6" style={{ color: disease.color }} />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{disease.fullName}</h1>
            <p className="text-xs text-gray-500">{disease.description}</p>
          </div>
        </div>

        {elevated && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 flex gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-800">
              Elevated risk flagged by the model — consider discussing with a clinician.
            </p>
          </div>
        )}

        {pred ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">Probability</p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: probSev!.color }}>
                {(pred.probability * 100).toFixed(0)}%
              </p>
              <div className="mt-1"><SeverityBadge severity={probSev!} /></div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">Risk Score</p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: riskSev!.color }}>
                {(pred.riskScore * 100).toFixed(0)}%
              </p>
              <div className="mt-1"><SeverityBadge severity={riskSev!} /></div>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-400">
            No prediction cached — log symptoms to generate one.
          </p>
        )}

        <p className="text-[11px] text-gray-400 mt-4 leading-relaxed">{disease.disclaimer}</p>

        <Link
          href="/log"
          className="mt-4 flex items-center justify-center gap-1.5 w-full rounded-xl py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: disease.color }}
        >
          <ClipboardList className="h-4 w-4" /> Log symptoms
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="font-bold text-sm mb-3">Symptom burden trend</h2>
        <TrendChart series={burdenSeries} color={disease.color} />
      </div>

      {riskSeries.some((p) => p.value !== null) && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-bold text-sm mb-3">Risk score trend (0–10 scaled)</h2>
          <TrendChart series={riskSeries} color={disease.color} />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="font-bold text-sm mb-3">Log history</h2>
        {entries.length === 0 ? (
          <p className="text-sm text-gray-400">No entries yet.</p>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="py-2 pr-3 font-medium">Date</th>
                  <th className="py-2 px-2 font-medium">Phase</th>
                  <th className="py-2 px-2 font-medium">Day</th>
                  {FIELD_LABELS.map(([k, label]) => (
                    <th key={k} className="py-2 px-2 font-medium whitespace-nowrap">{label.split(' ')[0]}</th>
                  ))}
                  <th className="py-2 pl-2 font-medium">Burden</th>
                </tr>
              </thead>
              <tbody>
                {entries.slice(0, 14).map((e) => {
                  const sev = burdenSeverity(e.symptomBurdenScore);
                  return (
                    <tr key={e.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 pr-3 text-gray-600 whitespace-nowrap">
                        {new Date(e.loggedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-2 px-2 text-gray-600">{e.data.cycle_phase}</td>
                      <td className="py-2 px-2 text-gray-600 tabular-nums">{e.data.day_of_cycle}</td>
                      {FIELD_LABELS.map(([k]) => (
                        <td key={k} className="py-2 px-2 text-center tabular-nums text-gray-700">
                          {e.data[k]}
                        </td>
                      ))}
                      <td className="py-2 pl-2">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: sev.bg, color: sev.color }}
                        >
                          {e.symptomBurdenScore.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConditionDetailPage() {
  return (
    <Suspense fallback={<div className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse h-96" />}>
      <DiseaseDetail />
    </Suspense>
  );
}
