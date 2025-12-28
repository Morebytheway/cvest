import { IsString, IsOptional } from 'class-validator';

export class WalletFreezeDto {
  @IsString()
  freezeReason: string;

  @IsOptional()
  @IsString()
  adminNotes?: string;
}
