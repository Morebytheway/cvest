import { IsOptional, IsNumber, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProfitAdjustmentDto {
  @ApiProperty({
    description: 'New profit amount (USDT) to set',
    example: 125.5,
  })
  @IsNumber()
  newProfitAmount: number;

  @ApiPropertyOptional({
    description: 'Reason for the adjustment',
    example: 'Corrected calculation error',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Internal admin notes',
    example: 'Approved by finance team',
  })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}
