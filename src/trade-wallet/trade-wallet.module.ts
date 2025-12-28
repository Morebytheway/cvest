import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TradeWalletService } from './trade-wallet.service';
import { TradeWalletController } from './trade-wallet.controller';
import {
  TradingWallet,
  TradingWalletSchema,
} from './schemas/trading-wallet.schema';
import { Wallet, WalletSchema } from '../wallet/schema/wallet.schema';
import {
  Transaction,
  TransactionSchema,
} from '../transactions/schemas/transaction.schema';
import {
  UserInvestment,
  UserInvestmentSchema,
} from '../investments/schemas/user-investment.schema';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [
    TransactionsModule,
    MongooseModule.forFeature([
      { name: TradingWallet.name, schema: TradingWalletSchema },
      { name: Wallet.name, schema: WalletSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: UserInvestment.name, schema: UserInvestmentSchema },
    ]),
  ],
  controllers: [TradeWalletController],
  providers: [TradeWalletService],
  exports: [TradeWalletService],
})
export class TradeWalletModule {}
