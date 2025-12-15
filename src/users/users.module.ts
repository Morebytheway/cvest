import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { SuperAdminSeeder } from '../database/seeds/super-admin.seed';
import { Slot, SlotSchema } from '../slots/schemas/slot.schema';
import { Wallet, WalletSchema } from '../wallet/schema/wallet.schema';
import { User, UserSchema } from './schemas/user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Booking.name, schema: BookingSchema },
      { name: Slot.name, schema: SlotSchema },
      { name: Wallet.name, schema: WalletSchema },
    ]),
  ],
  providers: [UsersService, SuperAdminSeeder],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
