import type { Severity } from '@/lib/symptoms';

export default function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: severity.bg, color: severity.color }}
    >
      {severity.label}
    </span>
  );
}
