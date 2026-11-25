import {
  Activity, AlertCircle, BatteryLow, Bone, Calendar, CircleDot, Droplet,
  Droplets, Frown, Heart, HeartPulse, Moon, Smile, Stethoscope, Target,
  Thermometer, Wind, Zap, type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  Activity, AlertCircle, BatteryLow, Bone, Calendar, CircleDot, Droplet,
  Droplets, Frown, Heart, HeartPulse, Moon, Smile, Stethoscope, Target,
  Thermometer, Wind, Zap,
};

export function SymptomIcon({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  const Icon = ICONS[name] ?? Activity;
  return <Icon className={className} style={style} />;
}
