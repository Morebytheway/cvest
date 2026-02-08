import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInvestmentPlanDto {
  @ApiProperty({
    description: 'Plan name (e.g. Conservative 10%, Balanced 15%)',
    example: 'Balanced 15%',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'ROI rate in percent (0-100)',
    example: 15,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  rate: number;

  @ApiProperty({
    description: 'Investment duration in days',
    example: 30,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  durationDays: number;

  @ApiProperty({
    description: 'Minimum investment amount (USDT)',
    example: 500,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  minAmount: number;

  @ApiPropertyOptional({
    description: 'Maximum investment amount (USDT). Omit for no cap.',
    example: 50000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional({
    description: 'Visibility of the plan',
    enum: ['public', 'private'],
    example: 'public',
  })
  @IsOptional()
  @IsEnum(['public', 'private'])
  visibility?: string;

  @ApiPropertyOptional({
    description: 'Max number of users who can invest (0 = unlimited)',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxActiveUsers?: number;

  @ApiPropertyOptional({
    description: 'Allow user to have multiple positions in this plan',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  allowMultipleInvestments?: boolean;

  @ApiPropertyOptional({
    description: 'Risk level',
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    example: 'MEDIUM',
  })
  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH'])
  riskLevel?: string;

  @ApiPropertyOptional({
    description: 'Category label (e.g. Fixed Income, Growth)',
    example: 'Fixed Income',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Public description shown to investors',
    example: '30-day fixed return plan with 15% annualized ROI. Ideal for balanced risk appetite.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Internal admin notes (not shown to users)',
    example: 'Q1 2025 launch. Review limits in June.',
  })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}
