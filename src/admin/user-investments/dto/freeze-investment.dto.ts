import { IsString, IsOptional } from 'class-validator';

export class FreezeInvestmentDto {
  @IsString()
  freezeReason: string;

  @IsOptional()
  @IsString()
  adminNotes?: string;
}
