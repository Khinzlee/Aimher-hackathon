import { IsIn, IsOptional } from 'class-validator';
import { WEARABLE_DEVICES } from './onboarding.constants';

export class Step5WearableDto {
  @IsOptional()
  @IsIn(WEARABLE_DEVICES)
  selected_wearable?: string;
}
