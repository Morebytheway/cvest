import {
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
  Min,
  MaxLength,
} from 'class-validator';

export class BalanceAdjustmentDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(['USDT'])
  currency: 'USDT';

  @IsEnum(['credit', 'debit'])
  operation: 'credit' | 'debit';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
