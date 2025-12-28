import { IsOptional, IsNumber, IsString } from 'class-validator';

export class ProfitAdjustmentDto {
  @IsNumber()
  newProfitAmount: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  adminNotes?: string;
}
