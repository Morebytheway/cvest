import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class RoiRulesDto {
  @ApiPropertyOptional({ description: 'Default ROI percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  defaultRoiPercent?: number;

  @ApiPropertyOptional({ description: 'Minimum ROI percentage allowed' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minRoiPercent?: number;

  @ApiPropertyOptional({ description: 'Maximum ROI percentage allowed' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxRoiPercent?: number;

  @ApiPropertyOptional({ description: 'ROI calculation type: simple | compound' })
  @IsOptional()
  @IsString()
  calculationType?: string;
}
