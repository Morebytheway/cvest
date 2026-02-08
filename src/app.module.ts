import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { GlobalCacheModule } from './cache/cache.module';
import { ApiDocModule } from './swagger/swagger.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/seeds/database.module';
import { MailModule } from './mail/mail.module';
import { SlotModule } from './slots/slot.module';
import { BookingsModule } from './bookings/bookings.module';
import { TestModule } from './test/test.module';
import { WalletModule } from './wallet/wallet.module';
// Removed TradeWalletModule - trade wallet functionality merged into main wallet
import { InvestmentsModule } from './investments/investments.module';
import { TransactionsModule } from './transactions/transactions.module';
import { SchedulesModule } from './schedules/schedules.module';
import { AdminInvestmentsModule } from './admin/investments/admin-investments.module';
import { AdminUserInvestmentsModule } from './admin/user-investments/admin-user-investments.module';
import { AdminAnalyticsModule } from './admin/analytics/admin-analytics.module';
import { AdminTransactionsModule } from './admin/transactions/admin-transactions.module';
import { AdminWalletsModule } from './admin/wallets/admin-wallets.module';
import { AdminAuditModule } from './admin/audit/admin-audit.module';
import { AdminSchedulesModule } from './admin/schedules/admin-schedules.module';
import { AdminUserManagementModule } from './admin/user-management/admin-user-management.module';
import { AdminDepositsWithdrawalsModule } from './admin/deposits-withdrawals/admin-deposits-withdrawals.module';
import { AdminSettingsModule } from './admin/settings/admin-settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    MongooseModule.forRoot(process.env.MONGO_URI || ''),

    // ✅ Use built-in in-memory cache (configured in GlobalCacheModule)
    GlobalCacheModule,
    AuthModule,
    UsersModule,
    DatabaseModule,
    MailModule,
    SlotModule,
    BookingsModule,
    TestModule,
    WalletModule,

    InvestmentsModule,
    TransactionsModule,
    SchedulesModule,
    // Admin Modules
    AdminInvestmentsModule,
    AdminUserInvestmentsModule,
    AdminAnalyticsModule,
    AdminTransactionsModule,
    AdminWalletsModule,
    AdminAuditModule,
    AdminSchedulesModule,
    AdminUserManagementModule,
    AdminDepositsWithdrawalsModule,
    AdminSettingsModule,
    ApiDocModule,
  ],
  providers: [],
})
export class AppModule {
  constructor() {
    console.log('✅ ENV Loaded:');
    console.log('✅ PORT:', process.env.PORT);
    console.log('mongo', process.env.MONGO_URI);
    console.log('✅ APP_NAME:', process.env.APP_NAME);
  }
}
