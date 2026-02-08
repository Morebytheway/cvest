import { IsOptional, IsString, IsEnum } from 'class-validator';

export class ReportGenerationDto {
  @IsString()
  reportType: 'daily' | 'weekly' | 'monthly' | 'custom';

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsEnum(['json', 'csv', 'pdf'])
  format?: 'json' | 'csv' | 'pdf' = 'json';

  @IsOptional()
  @IsString()
  email?: string;
}
