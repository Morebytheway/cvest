import { IsString, IsOptional, IsMongoId } from 'class-validator';

export class TransactionReversalDto {
  @IsString()
  reversalReason: string;

  @IsOptional()
  @IsString()
  adminNotes?: string;
}
