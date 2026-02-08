import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class InvestmentLimitsDto {
  @ApiPropertyOptional({ description: 'Global minimum investment amount (USDT)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minInvestmentAmount?: number;

  @ApiPropertyOptional({ description: 'Global maximum investment amount (USDT)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxInvestmentAmount?: number;

  @ApiPropertyOptional({ description: 'Max active investments per user' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxActiveInvestmentsPerUser?: number;
}
