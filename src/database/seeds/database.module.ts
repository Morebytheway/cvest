import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../../users/schemas/user.schema';
import {
  Investment,
  InvestmentSchema,
} from '../../investments/schemas/investment.schema';
import { SuperAdminSeeder } from './super-admin.seed';
import { InvestmentSeedsService } from './investment.seeds';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: Investment.name, schema: InvestmentSchema },
    ]),
  ],
  providers: [SuperAdminSeeder, InvestmentSeedsService],
  exports: [SuperAdminSeeder, InvestmentSeedsService],
})
export class DatabaseModule {}
