'use client';

import { useState } from 'react';
import { getSeverity } from '@/lib/symptoms';

interface VASSliderProps {
  label: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  lowLabel?: string;
  highLabel?: string;
}

export default function VASSlider({
  label,
  description,
  value,
  onChange,
  min = 0,
  max = 10,
  step = 1,
  lowLabel = 'None',
  highLabel = 'Severe',
}: VASSliderProps) {
  const [dragging, setDragging] = useState(false);
  const percentage = ((value - min) / (max - min)) * 100;
  const sev = getSeverity(value);

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900 text-sm">{label}</p>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        <div className="min-w-[3rem] text-right shrink-0">
          <span
            className="text-2xl font-bold tabular-nums transition-colors"
            style={{ color: sev.color }}
          >
            {value}
          </span>
          <span className="text-xs text-gray-400">/{max}</span>
        </div>
      </div>

      <div className="relative pt-1 pb-2">
        <div className="h-3 rounded-full bg-gray-200 overflow-hidden relative">
          <div
            className="h-full rounded-full transition-[width] duration-150"
            style={{ width: `${percentage}%`, backgroundColor: sev.color }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            onChange(step < 1 ? Math.round(v * 10) / 10 : Math.round(v));
          }}
          onPointerDown={() => setDragging(true)}
          onPointerUp={() => setDragging(false)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ top: '4px' }}
          aria-label={label}
        />
        <div
          className={`absolute top-1 h-3 w-3 -ml-1.5 pointer-events-none transition-transform ${
            dragging ? 'scale-125' : ''
          }`}
          style={{ left: `${percentage}%` }}
        >
          <div
            className="h-5 w-5 -mt-1 rounded-full border-2 bg-white shadow-md transition-colors"
            style={{ borderColor: sev.color }}
          />
        </div>
      </div>

      <div className="flex justify-between">
        <span className="text-xs text-gray-400">{lowLabel}</span>
        <span className="text-xs text-gray-400">{highLabel}</span>
      </div>
    </div>
  );
}
