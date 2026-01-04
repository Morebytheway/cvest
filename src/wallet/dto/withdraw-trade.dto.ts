import {
  IsNumber,
  IsPositive,
  Min,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class WithdrawTradeDto {
  @IsNumber()
  @IsPositive()
  @Min(1)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
