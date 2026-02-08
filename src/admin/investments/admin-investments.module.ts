import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminInvestmentsController } from './admin-investments.controller';
import { AdminInvestmentsService } from './admin-investments.service';
import {
  Investment,
  InvestmentSchema,
} from '../../investments/schemas/investment.schema';
import {
  UserInvestment,
  UserInvestmentSchema,
} from '../../investments/schemas/user-investment.schema';
import { User, UserSchema } from '../../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Investment.name, schema: InvestmentSchema },
      { name: UserInvestment.name, schema: UserInvestmentSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AdminInvestmentsController],
  providers: [AdminInvestmentsService],
  exports: [AdminInvestmentsService],
})
export class AdminInvestmentsModule {}
