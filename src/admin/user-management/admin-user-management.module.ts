import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminUserManagementController } from './admin-user-management.controller';
import { AdminUserManagementService } from './admin-user-management.service';
import { User, UserSchema } from '../../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [AdminUserManagementController],
  providers: [AdminUserManagementService],
  exports: [AdminUserManagementService],
})
export class AdminUserManagementModule {}
