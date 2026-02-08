import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ManualPayoutDto {
  @ApiProperty({ description: 'User ID to credit' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Amount (USDT)' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'Description or reference' })
  @IsOptional()
  @IsString()
  description?: string;
}
