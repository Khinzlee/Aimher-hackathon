import { getSeverity } from '@/lib/symptoms';

export default function SeverityBadge({ value }: { value: number }) {
  const sev = getSeverity(value);
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: sev.bg, color: sev.color }}
    >
      {sev.label}
    </span>
  );
}
