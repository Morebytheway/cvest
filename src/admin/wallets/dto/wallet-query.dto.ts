import {
  IsOptional,
  IsEnum,
  IsString,
  IsMongoId,
  IsNumber,
  IsBoolean,
  Min,
} from 'class-validator';
export class WalletQueryDto {
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @IsOptional()
  @IsEnum(['active', 'frozen', 'closed'])
  status?: string;

  @IsOptional()
  @IsBoolean()
  frozen?: boolean;

  @IsOptional()
  @IsBoolean()
  suspiciousActivity?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minBalance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxBalance?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
