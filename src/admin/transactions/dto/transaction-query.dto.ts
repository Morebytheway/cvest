import {
  IsOptional,
  IsEnum,
  IsString,
  IsMongoId,
  IsNumber,
  IsBoolean,
  Min,
} from 'class-validator';

export class TransactionQueryDto {
  @IsOptional()
  @IsEnum(['pending', 'completed', 'failed'])
  status?: string;

  @IsOptional()
  @IsEnum([
    'wallet_to_trade',
    'trade_to_investment',
    'investment_profit',
    'investment_principal',
    'withdrawal',
  ])
  type?: string;

  @IsOptional()
  @IsMongoId()
  userId?: string;

  @IsOptional()
  @IsMongoId()
  investmentId?: string;

  @IsOptional()
  @IsBoolean()
  flaggedForReview?: boolean;

  @IsOptional()
  @IsBoolean()
  suspiciousActivity?: boolean;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number;

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
