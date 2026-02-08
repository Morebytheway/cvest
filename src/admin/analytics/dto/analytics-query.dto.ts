import { IsOptional, IsEnum } from 'class-validator';
import { DateRangeDto } from './date-range.dto';

export class AnalyticsQueryDto extends DateRangeDto {
  @IsOptional()
  @IsEnum(['day', 'week', 'month', 'year'])
  granularity?: 'day' | 'week' | 'month' | 'year';

  @IsOptional()
  @IsEnum(['investment', 'revenue', 'users', 'transactions'])
  type?: 'investment' | 'revenue' | 'users' | 'transactions';

  @IsOptional()
  @IsEnum(['amount', 'count', 'profit', 'roi'])
  metric?: 'amount' | 'count' | 'profit' | 'roi';
}
