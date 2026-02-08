import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class PlatformFeesDto {
  @ApiPropertyOptional({ description: 'Deposit fee percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  depositFeePercent?: number;

  @ApiPropertyOptional({ description: 'Withdrawal fee percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  withdrawalFeePercent?: number;

  @ApiPropertyOptional({ description: 'Fixed withdrawal fee (USDT)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  withdrawalFeeFixed?: number;

  @ApiPropertyOptional({ description: 'Investment fee percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  investmentFeePercent?: number;
}
