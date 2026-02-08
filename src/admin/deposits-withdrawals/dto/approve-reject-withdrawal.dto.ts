import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ApproveRejectWithdrawalDto {
  @ApiProperty({ description: 'true = approve, false = reject' })
  @IsBoolean()
  approve: boolean;

  @ApiPropertyOptional({ description: 'Reason (e.g. for rejection)' })
  @IsOptional()
  @IsString()
  reason?: string;
}
