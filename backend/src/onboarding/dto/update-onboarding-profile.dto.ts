import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  ACANTHOSIS_CHOICES,
  BLEEDING_INTENSITY_CHOICES,
  BLOOD_GROUPS,
  CYCLE_REGULARITY_CHOICES,
  ETHNICITIES,
  FATIGUE_LEVEL_CHOICES,
  GENDERS,
  GENOTYPES,
  HIGH_BLOOD_PRESSURE_CHOICES,
  NIGHT_SWEATS_CHOICES,
  SCALP_HAIR_CHOICES,
  SKIN_TAG_CHOICES,
  WEARABLE_DEVICES,
} from './onboarding.constants';

export class UpdateOnboardingProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  full_name?: string;

  @IsOptional()
  @IsDateString()
  date_of_birth?: string | null;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(120)
  age?: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  nationality?: string;

  @IsOptional()
  @IsIn(ETHNICITIES)
  ethnicity?: string;

  @IsOptional()
  @IsIn(GENDERS)
  gender?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone_number?: string;

  @IsOptional()
  @IsIn(BLOOD_GROUPS)
  blood_group?: string;

  @IsOptional()
  @IsIn(GENOTYPES)
  genotype?: string;

  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(300)
  height_cm?: number;

  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(500)
  weight_kg?: number;

  @IsOptional()
  @IsBoolean()
  has_skin_changes?: boolean;

  @IsOptional()
  @IsIn(ACANTHOSIS_CHOICES)
  acanthosis_nigricans?: string;

  @IsOptional()
  @IsIn(SKIN_TAG_CHOICES)
  skin_tags?: string;

  @IsOptional()
  @IsIn(SCALP_HAIR_CHOICES)
  scalp_hair_thinning?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  cycle_length_days?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(14)
  periods_per_year?: number;

  @IsOptional()
  @IsIn(CYCLE_REGULARITY_CHOICES)
  cycle_regularity?: string;

  @IsOptional()
  @IsIn(BLEEDING_INTENSITY_CHOICES)
  bleeding_intensity?: string;

  @IsOptional()
  @IsDateString()
  last_period_date?: string | null;

  @IsOptional()
  @IsNumber()
  waist_cm?: number;

  @IsOptional()
  @IsNumber()
  hip_cm?: number;

  @IsOptional()
  @IsIn(NIGHT_SWEATS_CHOICES)
  night_sweats?: string;

  @IsOptional()
  @IsIn(FATIGUE_LEVEL_CHOICES)
  fatigue_level?: string;

  @IsOptional()
  @IsArray()
  family_history?: unknown[];

  @IsOptional()
  @IsIn(HIGH_BLOOD_PRESSURE_CHOICES)
  high_blood_pressure?: string;

  @IsOptional()
  @IsIn(WEARABLE_DEVICES)
  selected_wearable?: string;

  @IsOptional()
  @IsBoolean()
  rppg_baseline_captured?: boolean;

  @IsOptional()
  @IsDateString()
  rppg_captured_at?: string | null;
}
