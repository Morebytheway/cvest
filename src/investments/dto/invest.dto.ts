import {
  IsString,
  IsNumber,
  IsPositive,
  Min,
  IsOptional,
} from 'class-validator';

export class InvestDto {
  @IsString()
  investmentId: string;

  @IsNumber()
  @IsPositive()
  @Min(500)
  amount: number;
}

export class GetInvestmentsDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}
