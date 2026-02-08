import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WalletFreezeDto {
  @ApiProperty({
    description: 'Reason for freezing the wallet',
    example: 'Suspicious activity under review',
  })
  @IsString()
  freezeReason: string;

  @ApiPropertyOptional({
    description: 'Internal admin notes',
    example: 'Compliance hold - KYC pending',
  })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}
