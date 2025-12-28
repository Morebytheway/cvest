import { IsOptional, IsString, IsMongoId } from 'class-validator';

export class InvestmentActionDto {
  @IsOptional()
  @IsString()
  adminNotes?: string;
}
