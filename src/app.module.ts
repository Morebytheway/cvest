import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { GlobalCacheModule } from './cache/cache.module';
import { CacheService } from './cache/cache.service';
import { DatabaseModule } from './database/seeds/database.module';
import { MailModule } from './mail/mail.module';
import { SlotModule } from './slots/slot.module';
import { TestModule } from './test/test.module';
import { UsersModule } from './users/users.module';
import { WalletModule } from './wallet/wallet.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    MongooseModule.forRoot(process.env.MONGO_URI || ''),

    // ✅ Use built-in in-memory cache
    CacheModule.register({
      isGlobal: true,
      ttl: 300, // default TTL 5 mins
      max: 1000, // max items in cache
    }),
    GlobalCacheModule,
    AuthModule,
    UsersModule,
    DatabaseModule,
    MailModule,
    SlotModule,
    BookingsModule,
    TestModule,
    WalletModule,
  ],
  providers: [CacheService],
})
export class AppModule {
  constructor() {
    console.log('✅ ENV Loaded:');
    console.log('✅ PORT:', process.env.PORT);
    console.log('✅ APP_NAME:', process.env.APP_NAME);
  }
}
