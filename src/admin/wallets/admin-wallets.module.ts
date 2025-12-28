import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminWalletsController } from './admin-wallets.controller';
import { AdminWalletsService } from './admin-wallets.service';
import { Wallet, WalletSchema } from '../../wallet/schema/wallet.schema';
import {
  TradingWallet,
  TradingWalletSchema,
} from '../../trade-wallet/schemas/trading-wallet.schema';
import { User, UserSchema } from '../../users/schemas/user.schema';
import {
  Transaction,
  TransactionSchema,
} from '../../transactions/schemas/transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wallet.name, schema: WalletSchema },
      { name: TradingWallet.name, schema: TradingWalletSchema },
      { name: User.name, schema: UserSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  controllers: [AdminWalletsController],
  providers: [AdminWalletsService],
  exports: [AdminWalletsService],
})
export class AdminWalletsModule {}
