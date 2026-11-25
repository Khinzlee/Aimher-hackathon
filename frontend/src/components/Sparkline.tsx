interface SparklineProps {
  data: (number | null)[];
  color: string;
  width?: number;
  height?: number;
}

/** Tiny inline SVG trend line; nulls break the line. */
export default function Sparkline({ data, color, width = 120, height = 36 }: SparklineProps) {
  const values = data.filter((v): v is number => v !== null);
  if (values.length < 2) {
    return <div style={{ width, height }} className="bg-gray-100 rounded" />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  const points = data
    .map((v, i) => {
      if (v === null) return null;
      const x = i * stepX;
      const y = height - 4 - ((v - min) / range) * (height - 8);
      return `${x},${y}`;
    })
    .filter(Boolean)
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
