import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  MaxLength,
} from 'class-validator';

export class UpdateWalletDto {
  @IsOptional()
  @IsNumber()
  balance?: number;

  @IsOptional()
  @IsNumber()
  usdtBalance?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  adminNotes?: string;

  @IsOptional()
  @IsEnum([true, false])
  suspiciousActivity?: boolean;
}
