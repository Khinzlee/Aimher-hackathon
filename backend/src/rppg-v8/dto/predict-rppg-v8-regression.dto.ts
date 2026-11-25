import { IsIn, IsString } from 'class-validator';

export const RPPG_V8_REGRESSION_TARGETS = [
  'Sleep_Quality',
  'Focus_Memory',
  'Mental_Wellness',
  'Mood_Score',
  'Metabolic_Syndrome_Risk',
  'T2D_Metabolic_Risk_Index',
  'Cardiovascular_Risk_Score',
  'Heart_Failure_Alert_Score',
  'Chronic_Stress_Severity',
  'Infertility_Reproductive_Risk',
] as const;

export type RppgV8RegressionTarget =
  (typeof RPPG_V8_REGRESSION_TARGETS)[number];

export class PredictRppgV8RegressionDto {
  @IsString()
  @IsIn(RPPG_V8_REGRESSION_TARGETS)
  target!: RppgV8RegressionTarget;
}
