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
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateInvestmentPlanDto {
  @ApiPropertyOptional({
    description: 'Plan name',
    example: 'Balanced 15% (Revised)',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'ROI rate in percent. Cannot change if plan has active investments.',
    example: 18,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  rate?: number;

  @ApiPropertyOptional({
    description: 'Duration in days. Cannot change if plan has active investments.',
    example: 60,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  durationDays?: number;

  @ApiPropertyOptional({
    description: 'Minimum investment (USDT). Cannot change if plan has active investments.',
    example: 1000,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minAmount?: number;

  @ApiPropertyOptional({
    description: 'Maximum investment (USDT)',
    example: 100000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional({
    description: 'Status: active, inactive, or archived',
    enum: ['active', 'inactive', 'archived'],
    example: 'active',
  })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'archived'])
  status?: string;

  @ApiPropertyOptional({
    description: 'Visibility',
    enum: ['public', 'private', 'archived'],
    example: 'public',
  })
  @IsOptional()
  @IsEnum(['public', 'private', 'archived'])
  visibility?: string;

  @ApiPropertyOptional({
    description: 'Max active users (0 = unlimited)',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxActiveUsers?: number;

  @ApiPropertyOptional({
    description: 'Allow multiple investments per user',
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
    description: 'Category',
    example: 'Fixed Income',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Public description',
    example: 'Updated terms: 60-day plan with 18% ROI.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Admin notes',
    example: 'Terms updated in Feb 2025.',
  })
  @IsOptional()
  @IsString()
  adminNotes?: string;

  @ApiPropertyOptional({ description: 'Admin user ID (set by backend)' })
  @IsOptional()
  @IsMongoId()
  updatedBy?: string;
}
