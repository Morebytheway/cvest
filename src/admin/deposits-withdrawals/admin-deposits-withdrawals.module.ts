import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminDepositsWithdrawalsController } from './admin-deposits-withdrawals.controller';
import { AdminDepositsWithdrawalsService } from './admin-deposits-withdrawals.service';
import {
  Transaction,
  TransactionSchema,
} from '../../transactions/schemas/transaction.schema';
import { User, UserSchema } from '../../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AdminDepositsWithdrawalsController],
  providers: [AdminDepositsWithdrawalsService],
  exports: [AdminDepositsWithdrawalsService],
})
export class AdminDepositsWithdrawalsModule {}
