import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
  Min,
  Max,
  IsMongoId,
} from 'class-validator';

export class UpdateInvestmentPlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  rate?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  durationDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  minAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'archived'])
  status?: string;

  @IsOptional()
  @IsEnum(['public', 'private', 'archived'])
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

  @IsOptional()
  @IsMongoId()
  updatedBy?: string;
}
