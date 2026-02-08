import { IsOptional, IsEnum, IsNumber, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class InvestmentPlanQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ['active', 'inactive', 'archived'],
    example: 'active',
  })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'archived'])
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by visibility',
    enum: ['public', 'private', 'archived'],
    example: 'public',
  })
  @IsOptional()
  @IsEnum(['public', 'private', 'archived'])
  visibility?: string;

  @ApiPropertyOptional({
    description: 'Filter by risk level',
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    example: 'MEDIUM',
  })
  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH'])
  riskLevel?: string;

  @ApiPropertyOptional({
    description: 'Filter by category',
    example: 'Fixed Income',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
