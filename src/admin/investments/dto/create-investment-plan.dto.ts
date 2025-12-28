import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

export class CreateInvestmentPlanDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  rate: number;

  @IsNumber()
  @Min(1)
  durationDays: number;

  @IsNumber()
  @Min(1)
  minAmount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @IsOptional()
  @IsEnum(['public', 'private'])
  visibility?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxActiveUsers?: number;

  @IsOptional()
  @IsBoolean()
  allowMultipleInvestments?: boolean;

  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH'])
  riskLevel?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  adminNotes?: string;
}
