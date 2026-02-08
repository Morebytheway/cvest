import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class DepositsWithdrawalsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by type: deposit | withdrawal' })
  @IsOptional()
  @IsString()
  type?: 'deposit' | 'withdrawal';

  @ApiPropertyOptional({ description: 'Filter by status: pending | completed | failed' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'User ID filter' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
