import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { InvestmentProfitService } from './investment-profit.service';
import {
  UserInvestment,
  UserInvestmentSchema,
} from '../investments/schemas/user-investment.schema';
import { Wallet, WalletSchema } from '../wallet/schema/wallet.schema';
import {
  Transaction,
  TransactionSchema,
} from '../transactions/schemas/transaction.schema';
import { InvestmentsModule } from '../investments/investments.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: UserInvestment.name, schema: UserInvestmentSchema },
      { name: Wallet.name, schema: WalletSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
    InvestmentsModule,
  ],
  providers: [InvestmentProfitService],
  exports: [InvestmentProfitService],
})
export class SchedulesModule {}
