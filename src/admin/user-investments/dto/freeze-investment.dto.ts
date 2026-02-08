import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FreezeInvestmentDto {
  @ApiProperty({
    description: 'Reason for freezing the investment',
    example: 'Compliance review required',
  })
  @IsString()
  freezeReason: string;

  @ApiPropertyOptional({
    description: 'Internal admin notes',
    example: 'Pending KYC verification',
  })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}
