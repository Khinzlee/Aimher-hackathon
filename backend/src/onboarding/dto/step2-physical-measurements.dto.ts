import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class Step2PhysicalMeasurementsDto {
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
}
