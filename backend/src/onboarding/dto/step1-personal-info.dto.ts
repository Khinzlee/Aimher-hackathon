import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  BLOOD_GROUPS,
  ETHNICITIES,
  GENDERS,
  GENOTYPES,
} from './onboarding.constants';

export class Step1PersonalInfoDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  full_name?: string;

  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

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
}
