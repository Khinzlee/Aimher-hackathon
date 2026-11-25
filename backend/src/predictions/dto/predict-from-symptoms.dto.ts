import {
  IsEnum,
  IsNumber,
  Max,
  Min,
} from 'class-validator';
import { CyclePhase } from '../../symptoms/dto/log-symptom.dto';

export class PredictFromSymptomsDto {
  @IsNumber()
  @Min(1)
  @Max(28)
  day_of_cycle!: number;

  @IsEnum(CyclePhase)
  cycle_phase!: CyclePhase;

  @IsNumber()
  @Min(0)
  @Max(10)
  breast_soreness_vas!: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  painful_touch_vas!: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  pelvic_pressure_vas!: number;

  @IsNumber()
  bloating_delta_cm!: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  fatigue_mfi5_vas!: number;

  @IsNumber()
  @Min(0)
  @Max(4)
  acne_severity_likert!: number;

  @IsNumber()
  @Min(0)
  @Max(36)
  hirsutism_mfg_score!: number;
}
