'use client';

import type { CSSProperties } from 'react';

interface VASSliderProps {
  label: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  lowLabel?: string;
  highLabel?: string;
}

function palette(percent: number) {
  if (percent <= 20) return { color: '#2f9e63', bg: '#e8f6ee', label: 'Low' };
  if (percent <= 45) return { color: '#d39a22', bg: '#fff5df', label: 'Mild' };
  if (percent <= 70) return { color: '#e07a2d', bg: '#fff0e3', label: 'Moderate' };
  return { color: '#d94a55', bg: '#fdecee', label: 'High' };
}

export default function VASSlider({
  label,
  description,
  value,
  onChange,
  min = 0,
  max = 10,
  step = 1,
  unit = '',
  lowLabel = 'None',
  highLabel = 'Severe',
}: VASSliderProps) {
  const percent = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const tone = palette(percent);
  const style = {
    '--vas-color': tone.color,
    '--vas-bg': tone.bg,
    '--vas-fill': `${percent}%`,
  } as CSSProperties;

  return (
    <div className="vas-item" style={style}>
      <div className="vas-head">
        <div>
          <label htmlFor={`vas-${label.replace(/\s+/g, '-').toLowerCase()}`}>{label}</label>
          {description && <p>{description}</p>}
        </div>
        <div className="vas-value">
          <b>{Number.isInteger(value) ? value : value.toFixed(1)}</b>
          {unit && <small>{unit}</small>}
        </div>
      </div>

      <div className="vas-track">
        <div className="vas-rail">
          <div className="vas-fill" />
        </div>
        <input
          id={`vas-${label.replace(/\s+/g, '-').toLowerCase()}`}
          className="vas-input"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={label}
        />
        <div className="vas-thumb" />
      </div>
      <div className="vas-labels">
        <span>{lowLabel}</span>
        <span className="vas-scale">{tone.label}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}
