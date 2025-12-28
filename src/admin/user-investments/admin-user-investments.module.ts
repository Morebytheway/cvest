import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminUserInvestmentsController } from './admin-user-investments.controller';
import { AdminUserInvestmentsService } from './admin-user-investments.service';
import {
  UserInvestment,
  UserInvestmentSchema,
} from '../../investments/schemas/user-investment.schema';
import {
  Investment,
  InvestmentSchema,
} from '../../investments/schemas/investment.schema';
import {
  TradingWallet,
  TradingWalletSchema,
} from '../../trade-wallet/schemas/trading-wallet.schema';
import {
  Transaction,
  TransactionSchema,
} from '../../transactions/schemas/transaction.schema';
import { User, UserSchema } from '../../users/schemas/user.schema';
import { InvestmentsModule } from '../../investments/investments.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserInvestment.name, schema: UserInvestmentSchema },
      { name: Investment.name, schema: InvestmentSchema },
      { name: TradingWallet.name, schema: TradingWalletSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: User.name, schema: UserSchema },
    ]),
    InvestmentsModule,
  ],
  controllers: [AdminUserInvestmentsController],
  providers: [AdminUserInvestmentsService],
  exports: [AdminUserInvestmentsService],
})
export class AdminUserInvestmentsModule {}
