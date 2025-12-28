import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { AdminAnalyticsService } from './admin-analytics.service';
import { DailyReportService } from './daily-report.service';
import { DailyReport, DailyReportSchema } from './schemas/daily-report.schema';
import {
  UserInvestment,
  UserInvestmentSchema,
} from '../../investments/schemas/user-investment.schema';
import {
  Investment,
  InvestmentSchema,
} from '../../investments/schemas/investment.schema';
import { User, UserSchema } from '../../users/schemas/user.schema';
import {
  Transaction,
  TransactionSchema,
} from '../../transactions/schemas/transaction.schema';
import {
  TradingWallet,
  TradingWalletSchema,
} from '../../trade-wallet/schemas/trading-wallet.schema';
import { InvestmentsModule } from '../../investments/investments.module';

@Module({
  imports: [
    InvestmentsModule,
    MongooseModule.forFeature([
      { name: DailyReport.name, schema: DailyReportSchema },
      { name: UserInvestment.name, schema: UserInvestmentSchema },
      { name: Investment.name, schema: InvestmentSchema },
      { name: User.name, schema: UserSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: TradingWallet.name, schema: TradingWalletSchema },
    ]),
  ],
  controllers: [AdminAnalyticsController],
  providers: [AdminAnalyticsService, DailyReportService],
  exports: [AdminAnalyticsService, DailyReportService],
})
export class AdminAnalyticsModule {}
