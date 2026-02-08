import { IsString, IsOptional, MaxLength } from 'class-validator';

export class FreezeWalletDto {
  @IsString()
  @MaxLength(500)
  reason: string;

  @IsOptional()
  @IsString()
  frozenBy?: string;
}
