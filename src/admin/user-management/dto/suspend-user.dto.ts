import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class SuspendUserDto {
  @ApiProperty({ description: 'Whether to suspend (true) or reactivate (false)' })
  @IsBoolean()
  suspended: boolean;

  @ApiPropertyOptional({ description: 'Reason for suspension' })
  @IsOptional()
  @IsString()
  reason?: string;
}
