import { IsNumber, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BalanceAdjustmentDto {
  @ApiProperty({
    description:
      'Adjustment amount in USDT. Positive = credit, negative = debit.',
    example: 100.5,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Reason for the adjustment (audit trail)',
    example: 'Correction for failed deposit TX-001',
  })
  @IsString()
  reason: string;

  @ApiPropertyOptional({
    description: 'Internal admin notes (not shown to user)',
    example: 'Approved by support after ticket #1234',
  })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}
