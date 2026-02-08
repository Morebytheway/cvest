import { IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Simplified query for listing investment plans (reduced parameters).
 */
export class InvestmentPlanQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by plan status',
    enum: ['active', 'inactive', 'archived'],
    example: 'active',
  })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'archived'])
  status?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
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
}
