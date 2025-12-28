import { IsNumber, IsPositive, Min } from 'class-validator';

export class FundTradeWalletDto {
  @IsNumber()
  @IsPositive()
  @Min(1)
  amount: number;
}
