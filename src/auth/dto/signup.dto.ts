import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SignupDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'Jenny Doe',
  })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  name: string;

  @ApiProperty({
    description: 'User identifier (email)',
    example: 'user@example.com',
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsString({ message: 'Email must be a string' })
  @MinLength(3, { message: 'Email must be at least 3 characters long' })
  @MaxLength(100, { message: 'Email must not exceed 100 characters' })
  email: string;

  @ApiProperty({
    description: 'Phone number of the user',
    example: '08012345678',
  })
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString({ message: 'Phone must be a string' })
  phone: string;

  @ApiProperty({
    description: 'User password',
    example: 'P@ssw0rd123',
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(50, { message: 'Password must not exceed 50 characters' })
  password: string;

  @ApiPropertyOptional({
    description: 'Role of the SUPER-ADMIN, ADMIN, or USER (default is "USER")',
    example: 'USER',
  })
  @IsOptional()
  @IsString({ message: 'Role must be a string' })
  role?: string;
}
