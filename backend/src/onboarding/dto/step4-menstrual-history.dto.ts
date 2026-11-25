import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import {
  BLEEDING_INTENSITY_CHOICES,
  CYCLE_REGULARITY_CHOICES,
} from './onboarding.constants';

export class Step4MenstrualHistoryDto {
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
  last_period_date?: string;
}
