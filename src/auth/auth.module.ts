import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { BookingsModule } from '../bookings/bookings.module';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';
import { Wallet, WalletSchema } from '../wallet/schema/wallet.schema';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: Wallet.name, schema: WalletSchema },
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: 60 * 60 * 24 },
      }),
    }),
    MailModule,
    BookingsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [MongooseModule],
})
export class AuthModule {}
