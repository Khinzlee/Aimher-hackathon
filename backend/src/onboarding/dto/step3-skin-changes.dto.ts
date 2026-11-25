import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import {
  ACANTHOSIS_CHOICES,
  SCALP_HAIR_CHOICES,
  SKIN_TAG_CHOICES,
} from './onboarding.constants';

export class Step3SkinChangesDto {
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
}
