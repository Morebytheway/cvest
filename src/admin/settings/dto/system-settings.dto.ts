import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class SystemSettingsUpdateDto {
  @ApiProperty({ description: 'Setting key (e.g. platform_fees, roi_rules, investment_limits)' })
  @IsString()
  key: string;

  @ApiProperty({ description: 'Setting value (object)' })
  @IsObject()
  value: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;
}
