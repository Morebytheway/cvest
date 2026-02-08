import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class CreateWalletDto {
  @IsOptional()
  @IsNumber()
  balance?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  usdtBalance?: number;
}
