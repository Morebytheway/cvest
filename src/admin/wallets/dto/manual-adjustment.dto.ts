import { IsNumber, IsString, IsOptional, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ManualAdjustmentDto {
  @ApiProperty({
    description: 'User ID whose wallet to adjust',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  userId: string;

  @ApiProperty({
    description: 'Adjustment amount in USDT. Positive = credit, negative = debit.',
    example: -50.25,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Description for the transaction (audit trail)',
    example: 'Refund for cancelled investment INV-002',
  })
  @IsString()
  description: string;

  @ApiPropertyOptional({
    description: 'Internal admin notes',
    example: 'Processed per support ticket #5678',
  })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}
