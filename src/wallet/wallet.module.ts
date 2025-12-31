import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { Wallet, WalletSchema } from './schema/wallet.schema';
import { TransactionsService } from '../transactions/transactions.service';
import {
  Transaction,
  TransactionSchema,
} from '../transactions/schemas/transaction.schema';
import {
  UserInvestment,
  UserInvestmentSchema,
} from '../investments/schemas/user-investment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Wallet.name, schema: WalletSchema }]),
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
    ]),
    MongooseModule.forFeature([
      { name: UserInvestment.name, schema: UserInvestmentSchema },
    ]),
  ],
  controllers: [WalletController],
  providers: [WalletService, TransactionsService],
  exports: [WalletService],
})
export class WalletModule {}
