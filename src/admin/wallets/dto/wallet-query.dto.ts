import {
  IsOptional,
  IsEnum,
  IsString,
  IsMongoId,
  IsNumber,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class WalletQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter by wallet status',
    enum: ['active', 'frozen', 'closed'],
    example: 'active',
  })
  @IsOptional()
  @IsEnum(['active', 'frozen', 'closed'])
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter frozen wallets',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  frozen?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by suspicious activity flag',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  suspiciousActivity?: boolean;

  @ApiPropertyOptional({
    description: 'Minimum balance (USDT)',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minBalance?: number;

  @ApiPropertyOptional({
    description: 'Maximum balance (USDT)',
    example: 100000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxBalance?: number;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'USDT',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Page number', example: 1, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', example: 10, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Sort field', example: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
