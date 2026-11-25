'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, ClipboardList } from 'lucide-react';
import { CONDITION_MAP, SYMPTOM_MAP, getSeverity } from '@/lib/symptoms';
import { getConditionDetail, type ConditionDetail } from '@/lib/symptomService';
import SeverityBadge from '@/components/SeverityBadge';
import TrendChart from '@/components/TrendChart';
import { SymptomIcon } from '@/components/SymptomIcon';

function ConditionDetail() {
  const params = useParams<{ id: string }>();
  const conditionId = params.id;
  const [detail, setDetail] = useState<ConditionDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getConditionDetail(conditionId, 30).then((d) => {
      if (d) setDetail(d);
      else setNotFound(true);
    });
  }, [conditionId]);

  const cond = CONDITION_MAP[conditionId];

  if (notFound || !cond) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Condition not found.</p>
        <Link href="/dashboard" className="text-teal-700 text-sm font-medium mt-2 inline-block">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (!detail) {
    return <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse h-96" />;
  }

  const { summary, symptoms, entries } = detail;
  const burden = summary.latestBurden;
  const sev = burden !== null ? getSeverity(burden) : null;

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-start gap-3">
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${cond.color}1A` }}
          >
            <SymptomIcon name={cond.icon} className="h-6 w-6" style={{ color: cond.color }} />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{cond.fullName}</h1>
            <p className="text-xs text-gray-500">{cond.description}</p>
          </div>
        </div>

        {summary.redFlag && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 flex gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-800">{cond.redFlagMessage}</p>
          </div>
        )}

        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-xs text-gray-500">Latest symptom burden</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-bold tabular-nums" style={{ color: sev?.color ?? '#9CA3AF' }}>
                {burden !== null ? burden.toFixed(1) : '—'}
              </span>
              <span className="text-sm text-gray-400">/10</span>
            </div>
            {burden !== null && <div className="mt-2"><SeverityBadge value={burden} /></div>}
            {summary.latestDate && (
              <p className="text-[11px] text-gray-400 mt-1">
                as of {new Date(summary.latestDate + 'T00:00:00').toLocaleDateString()}
              </p>
            )}
          </div>
          <Link
            href="/log"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: cond.color }}
          >
            <ClipboardList className="h-4 w-4" /> Log symptoms
          </Link>
        </div>

        <p className="text-[11px] text-gray-400 mt-4 leading-relaxed">{cond.disclaimer}</p>
      </div>

      {/* trend */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="font-bold text-sm mb-3">30-day burden trend</h2>
        <TrendChart series={summary.series} color={cond.color} />
      </div>

      {/* per-symptom breakdown */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="font-bold text-sm mb-3">Symptom breakdown</h2>
        <div className="space-y-3">
          {symptoms.map((s) => {
            const meta = SYMPTOM_MAP[s.symptomId];
            const avgSev = s.average !== null ? getSeverity(s.average) : null;
            return (
              <div key={s.symptomId} className="flex items-center gap-3">
                <SymptomIcon name={meta?.icon ?? 'Activity'} className="h-4 w-4 text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{meta?.label}</p>
                  <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${((s.average ?? 0) / 10) * 100}%`,
                        backgroundColor: avgSev?.color ?? '#E5E7EB',
                      }}
                    />
                  </div>
                </div>
                <span className="text-sm font-bold tabular-nums w-10 text-right" style={{ color: avgSev?.color ?? '#9CA3AF' }}>
                  {s.average !== null ? s.average.toFixed(1) : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* history */}
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
                  {cond.symptomIds.map((id) => (
                    <th key={id} className="py-2 px-2 font-medium whitespace-nowrap">
                      {SYMPTOM_MAP[id]?.label.split(' ')[0]}
                    </th>
                  ))}
                  <th className="py-2 pl-2 font-medium">Burden</th>
                </tr>
              </thead>
              <tbody>
                {entries.slice(0, 14).map((e) => {
                  const b = cond.symptomIds
                    .map((id) => e.values[id])
                    .filter((v): v is number => typeof v === 'number');
                  const avg = b.length ? b.reduce((a, x) => a + x, 0) / b.length : null;
                  const sevEntry = avg !== null ? getSeverity(avg) : null;
                  return (
                    <tr key={e.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 pr-3 text-gray-600 whitespace-nowrap">
                        {new Date(e.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </td>
                      {cond.symptomIds.map((id) => (
                        <td key={id} className="py-2 px-2 text-center tabular-nums text-gray-700">
                          {typeof e.values[id] === 'number' ? e.values[id] : '·'}
                        </td>
                      ))}
                      <td className="py-2 pl-2">
                        {avg !== null ? (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: sevEntry!.bg, color: sevEntry!.color }}
                          >
                            {avg.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
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
      <ConditionDetail />
    </Suspense>
  );
}
