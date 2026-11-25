import { IsNumber, IsObject } from 'class-validator';

export const DISEASES = [
  'Infertility',
  'Dysmenorrhea',
  'PMDD',
  'T2D',
  'CVD',
  'Endometrial',
] as const;

export class DiseaseFeaturesDto {
  @IsNumber()
  PredFlag!: number;

  @IsNumber()
  PredScore!: number;

  @IsNumber()
  RiskProb!: number;
}

export class PredictDto {
  @IsNumber()
  pcos_label!: number;

  @IsObject()
  features!: DiseaseFeatures;
}

export type DiseaseFeatures = Record<(typeof DISEASES)[number], DiseaseFeaturesDto>;
