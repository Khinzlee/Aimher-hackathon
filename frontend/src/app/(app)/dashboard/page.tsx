'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ChevronRight, ClipboardList } from 'lucide-react';
import { CONDITIONS, getSeverity } from '@/lib/symptoms';
import {
  getConditionSummaries,
  type ConditionSummary,
} from '@/lib/symptomService';
import SeverityBadge from '@/components/SeverityBadge';
import Sparkline from '@/components/Sparkline';
import { SymptomIcon } from '@/components/SymptomIcon';
import { useNow } from '@/hooks/useNow';

function greeting(d: Date) {
  const h = d.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const [summaries, setSummaries] = useState<ConditionSummary[] | null>(null);
  const now = useNow();

  useEffect(() => {
    let alive = true;
    getConditionSummaries(14).then((s) => alive && setSummaries(s));
    return () => {
      alive = false;
    };
  }, []);

  const today = now
    ? now.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const flagged = summaries?.filter((s) => s.redFlag);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">{today}</p>
        <h1 className="text-2xl font-bold">{now ? greeting(now) : 'Hello'}</h1>
        <p className="text-sm text-gray-500 mt-1">
          Symptom burden across 6 tracked conditions
        </p>
      </div>

      {flagged && flagged.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 flex gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs text-red-800">
            {flagged.length} condition{flagged.length > 1 ? 's have' : ' has'} red-flag
            symptoms logged. Review the highlighted cards below.
          </p>
        </div>
      )}

      {!summaries ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {CONDITIONS.map((cond) => {
            const s = summaries.find((x) => x.conditionId === cond.id)!;
            const burden = s.latestBurden;
            const sev = burden !== null ? getSeverity(burden) : null;
            const delta =
              burden !== null && s.previousBurden !== null
                ? burden - s.previousBurden
                : null;
            const isFlagged = s.redFlag;

            return (
              <Link
                key={cond.id}
                href={`/conditions/${cond.id}`}
                className={`block bg-white rounded-2xl border p-4 transition-shadow hover:shadow-md ${
                  isFlagged ? 'border-red-300' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${cond.color}1A` }}
                  >
                    <SymptomIcon
                      name={cond.icon}
                      className="h-5 w-5"
                      style={{ color: cond.color }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-gray-900 text-sm">{cond.name}</h2>
                      {isFlagged && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-semibold">
                          <AlertTriangle className="h-3 w-3" /> Red flag
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{cond.fullName}</p>

                    <div className="flex items-end justify-between mt-2">
                      <div className="flex items-baseline gap-1">
                        {burden !== null ? (
                          <>
                            <span
                              className="text-2xl font-bold tabular-nums"
                              style={{ color: sev!.color }}
                            >
                              {burden.toFixed(1)}
                            </span>
                            <span className="text-xs text-gray-400">/10</span>
                            <span className="ml-2">
                              <SeverityBadge value={burden} />
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">No data yet</span>
                        )}
                      </div>
                      <Sparkline
                        data={s.series.map((p) => p.value)}
                        color={cond.color}
                      />
                    </div>

                    {delta !== null && Math.abs(delta) >= 0.5 && (
                      <p
                        className={`text-[11px] mt-1 font-medium ${
                          delta > 0 ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {delta > 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)} vs previous
                        entry
                      </p>
                    )}
                  </div>

                  <ChevronRight className="h-5 w-5 text-gray-300 shrink-0 mt-1" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Link
        href="/log"
        className="flex items-center justify-center gap-2 w-full rounded-2xl py-3.5 font-semibold text-white text-sm shadow-sm"
        style={{ backgroundColor: '#00897B' }}
      >
        <ClipboardList className="h-4 w-4" />
        Log today&apos;s symptoms
      </Link>

      <p className="text-[11px] text-gray-400 text-center leading-relaxed">
        Symptom burden is computed from your logged intensities and is not a
        medical diagnosis.
      </p>
    </div>
  );
}
