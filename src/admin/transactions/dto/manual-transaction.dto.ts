import { IsString, IsNumber, IsOptional } from 'class-validator';

export class ManualTransactionDto {
  @IsString()
  userId: string;

  @IsString()
  type: string;

  @IsNumber()
  amount: number;

  @IsString()
  source: string;

  @IsString()
  destination: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  adminNotes?: string;
}
