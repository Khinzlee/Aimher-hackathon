interface TrendChartProps {
  /** {date: 'YYYY-MM-DD', value: number|null}[] oldest → newest */
  series: { date: string; value: number | null }[];
  color: string;
  height?: number;
}

/** Responsive SVG line chart with light gridlines and day labels. */
export default function TrendChart({ series, color, height = 180 }: TrendChartProps) {
  const W = 600;
  const H = height;
  const PAD = { top: 12, right: 12, bottom: 24, left: 28 };
  const iw = W - PAD.left - PAD.right;
  const ih = H - PAD.top - PAD.bottom;

  const values = series.map((p) => p.value).filter((v): v is number => v !== null);
  const min = values.length ? Math.max(0, Math.floor(Math.min(...values) - 1)) : 0;
  const max = values.length ? Math.min(10, Math.ceil(Math.max(...values) + 1)) : 10;
  const range = max - min || 1;

  const x = (i: number) => PAD.left + (series.length <= 1 ? iw / 2 : (i / (series.length - 1)) * iw);
  const y = (v: number) => PAD.top + ih - ((v - min) / range) * ih;

  // build contiguous segments so nulls break the line
  const segments: string[] = [];
  let current: string[] = [];
  series.forEach((p, i) => {
    if (p.value === null) {
      if (current.length > 1) segments.push(current.join(' '));
      current = [];
    } else {
      current.push(`${x(i)},${y(p.value)}`);
    }
  });
  if (current.length > 1) segments.push(current.join(' '));

  const ticks = [min, Math.round((min + max) / 2), max];
  const labelEvery = Math.ceil(series.length / 7);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Symptom intensity trend">
      {ticks.map((t) => (
        <g key={t}>
          <line
            x1={PAD.left} x2={W - PAD.right}
            y1={y(t)} y2={y(t)}
            stroke="#E5E7EB" strokeWidth="1"
          />
          <text x={PAD.left - 6} y={y(t) + 3} textAnchor="end" fontSize="9" fill="#9CA3AF">
            {t}
          </text>
        </g>
      ))}
      {segments.map((pts, i) => (
        <polyline
          key={i}
          points={pts}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {series.map((p, i) =>
        p.value !== null ? (
          <circle key={i} cx={x(i)} cy={y(p.value)} r="3" fill={color}>
            <title>{`${p.date}: ${p.value.toFixed(1)}`}</title>
          </circle>
        ) : null
      )}
      {series.map((p, i) =>
        i % labelEvery === 0 ? (
          <text
            key={`l${i}`}
            x={x(i)}
            y={H - 8}
            textAnchor="middle"
            fontSize="9"
            fill="#9CA3AF"
          >
            {p.date.slice(5)}
          </text>
        ) : null
      )}
    </svg>
  );
}
