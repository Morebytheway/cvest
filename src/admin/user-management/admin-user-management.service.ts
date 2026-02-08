import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { UserQueryDto } from './dto/user-query.dto';
import { SuspendUserDto } from './dto/suspend-user.dto';
import { ResetCredentialsDto } from './dto/reset-credentials.dto';

@Injectable()
export class AdminUserManagementService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async getAllUsers(query: UserQueryDto) {
    const filter: Record<string, unknown> = {};
    if (query.search) {
      filter.$or = [
        { email: new RegExp(query.search, 'i') },
        { name: new RegExp(query.search, 'i') },
      ];
    }
    if (query.role) filter.role = query.role;
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-password -resetPasswordToken -resetPasswordExpires')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.userModel.countDocuments(filter),
    ]);

    return {
      users,
      total,
      pagination: { page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUserProfile(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .populate('wallet')
      .lean();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async suspendOrReactivate(userId: string, dto: SuspendUserDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    // If your User schema has isActive/suspended, set it here; otherwise extend schema
    user.suspended = dto.suspended;
    if (dto.reason) user.suspensionReason = dto.reason;
    await user.save();
    return {
      success: true,
      message: dto.suspended ? 'User suspended' : 'User reactivated',
    };
  }

  async resetCredentials(userId: string, dto: ResetCredentialsDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (dto.newPassword) {
      const bcrypt = await import('bcrypt');
      user.password = await bcrypt.hash(dto.newPassword, 10);
      await user.save();
      return { success: true, message: 'Password updated' };
    }
    if (dto.sendResetEmail) {
      // Integrate with your mail service to send reset link
      return { success: true, message: 'Reset email sent (implement mail integration)' };
    }
    throw new BadRequestException('Provide newPassword or sendResetEmail');
  }
}
