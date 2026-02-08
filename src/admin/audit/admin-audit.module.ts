import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminAuditService } from './admin-audit.service';
import { AdminAuditController } from './admin-audit.controller';
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema';
import { AdminAudit, AdminAuditSchema } from './schemas/admin-audit.schema';
import { User, UserSchema } from '../../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: AdminAudit.name, schema: AdminAuditSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AdminAuditController],
  providers: [AdminAuditService],
  exports: [AdminAuditService],
})
export class AdminAuditModule {}
