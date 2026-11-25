import {
  IsEnum,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export enum RppgV8SessionType {
  MORNING = 'morning',
  EVENING = 'evening',
  BASELINE = 'baseline',
  CHECKIN = 'checkin',
}

export enum RppgV8SessionQuality {
  GOOD = 'good',
  POOR = 'poor',
  MOTION_ARTIFACT = 'motion_artifact',
}

export class CreateRppgV8SessionDto {
  @IsNumber()
  @Min(0)
  @Max(1000)
  rmssd!: number;

  @IsNumber()
  @Min(0)
  @Max(5000)
  hf!: number;

  @IsNumber()
  @Min(0)
  @Max(20)
  lf_hf_ratio!: number;

  @IsNumber()
  @Min(30)
  @Max(200)
  heart_rate!: number;

  @IsNumber()
  @Min(0)
  @Max(1000)
  hrv!: number;

  @IsNumber()
  @Min(80)
  @Max(100)
  estimated_spo2!: number;

  @IsNumber()
  @Min(25)
  @Max(42)
  skin_temperature!: number;

  @IsOptional()
  @IsNumber()
  @Min(-10)
  @Max(10)
  hr_trend?: number | null;

  @IsNumber()
  @Min(0)
  @Max(20)
  mean_eda!: number;

  @IsNumber()
  @Min(25)
  @Max(42)
  mean_temp!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  asi?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(-50)
  @Max(50)
  rmssd_trend?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(255)
  ac?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(255)
  dc?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  ac_dc_ratio?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  pulse_amplitude?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  signal_quality?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(40)
  respiratory_rate?: number | null;

  @IsOptional()
  @IsEnum(RppgV8SessionType)
  session_type?: RppgV8SessionType;

  @IsOptional()
  @IsEnum(RppgV8SessionQuality)
  session_quality?: RppgV8SessionQuality | null;
}
