import { IsBoolean } from 'class-validator';

export class Step6RppgDto {
  @IsBoolean()
  baseline_captured!: boolean;
}
