import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class ResetCredentialsDto {
  @ApiPropertyOptional({ description: 'New password (if not provided, a reset link may be sent)' })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  newPassword?: string;

  @ApiPropertyOptional({ description: 'Send password reset email instead' })
  @IsOptional()
  sendResetEmail?: boolean;
}
