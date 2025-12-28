import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class SigninDto {
  @ApiProperty({
    description: 'User identifier (email, phone number, or username)',
    example: 'user@example.com',
  })
  @IsNotEmpty({ message: 'Identifier is required' })
  @IsString({ message: 'Identifier must be a string' })
  @MinLength(3, { message: 'Identifier must be at least 3 characters long' })
  @MaxLength(100, { message: 'Identifier must not exceed 100 characters' })
  identifier: string;

  @ApiProperty({
    description: 'User password',
    example: 'P@ssw0rd123',
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(50, { message: 'Password must not exceed 50 characters' })
  password: string;
}
