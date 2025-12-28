import { IsNumber, IsString, IsOptional } from 'class-validator';

export class BalanceAdjustmentDto {
  @IsNumber()
  amount: number; // Can be positive (credit) or negative (debit)

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  adminNotes?: string;
}
