import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wallet, WalletDocument } from '../../wallet/schema/wallet.schema';
// Removed TradingWallet import - now using enhanced Wallet schema
import { User, UserDocument } from '../../users/schemas/user.schema';
import {
  Transaction,
  TransactionDocument,
} from '../../transactions/schemas/transaction.schema';

@Injectable()
export class AdminWalletsService {
  constructor(
    @InjectModel(Wallet.name)
    private walletModel: Model<WalletDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
  ) {}

  async getAllWallets(query: any) {
    const filter = this.buildFilter(query);
    const sort = this.buildSort(query);
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [wallets, total] = await Promise.all([
      this.walletModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email')
        .populate('frozenBy', 'name email')
        .exec(),
      this.walletModel.countDocuments(filter),
    ]);

    return {
      wallets,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async getUserWallets(userId: string) {
    const wallet = await this.walletModel
      .findOne({ user: new Types.ObjectId(userId) })
      .populate('user', 'name email')
      .populate('frozenBy', 'name email')
      .exec();

    if (!wallet) {
      throw new NotFoundException('Wallet not found for this user');
    }

    return {
      wallet,
      balance: wallet.balance,
      tradeWalletBalance: wallet.tradeWalletBalance,
      currency: wallet.currency,
      status: wallet.status,
      frozen: wallet.frozen,
      hasActiveInvestments: wallet.hasActiveInvestments,
    };
  }

  async getWalletById(walletId: string) {
    const wallet = await this.walletModel
      .findById(walletId)
      .populate('user', 'name email')
      .populate('frozenBy', 'name email')
      .exec();

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return {
      wallet,
      balance: wallet.balance,
      tradeWalletBalance: wallet.tradeWalletBalance,
      currency: wallet.currency,
      status: wallet.status,
      frozen: wallet.frozen,
      hasActiveInvestments: wallet.hasActiveInvestments,
    };
  }

  async adjustWalletBalance(
    userId: string,
    adjustmentDto: any,
    adminId: string,
  ) {
    const session = await this.walletModel.db.startSession();
    session.startTransaction();

    try {
      const wallet = await this.walletModel
        .findOne({ user: new Types.ObjectId(userId) })
        .session(session);

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      const oldBalance = wallet.balance;
      wallet.balance += adjustmentDto.amount;
      wallet.lastActivity = new Date();
      wallet.adminNotes = adjustmentDto.adminNotes;

      // Update totals
      if (adjustmentDto.amount > 0) {
        wallet.totalDeposited += adjustmentDto.amount;
      } else {
        wallet.totalWithdrawn += Math.abs(adjustmentDto.amount);
      }

      await wallet.save({ session });

      // Create transaction record
      const transaction = new this.transactionModel({
        user: new Types.ObjectId(userId),
        type: 'admin_adjustment',
        amount: adjustmentDto.amount,
        source: 'wallet',
        destination: 'wallet',
        reference: `ADJUST_${Date.now()}`,
        status: 'completed',
        description: `Admin balance adjustment: ${adjustmentDto.reason}`,
        manualTransaction: true,
        createdBy: new Types.ObjectId(adminId),
        adminNotes: adjustmentDto.adminNotes,
      });

      await transaction.save({ session });

      await session.commitTransaction();

      return {
        oldBalance,
        newBalance: wallet.balance,
        adjustment: adjustmentDto.amount,
        reason: adjustmentDto.reason,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async freezeWallet(userId: string, freezeDto: any, adminId: string) {
    const wallet = await this.walletModel.findOne({
      user: new Types.ObjectId(userId),
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (wallet.frozen) {
      throw new BadRequestException('Wallet is already frozen');
    }

    wallet.frozen = true;
    wallet.frozenAt = new Date();
    wallet.frozenBy = new Types.ObjectId(adminId);
    wallet.freezeReason = freezeDto.freezeReason;
    wallet.adminNotes = freezeDto.adminNotes;

    await wallet.save();

    return await this.getUserWallets(userId);
  }

  async unfreezeWallet(userId: string, adminId: string) {
    const wallet = await this.walletModel.findOne({
      user: new Types.ObjectId(userId),
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (!wallet.frozen) {
      throw new BadRequestException('Wallet is not frozen');
    }

    wallet.frozen = false;
    wallet.frozenAt = undefined;
    wallet.frozenBy = undefined;
    wallet.freezeReason = undefined;

    await wallet.save();

    return await this.getUserWallets(userId);
  }

  async detectSuspiciousActivity() {
    const suspiciousWallets = await this.walletModel
      .find({
        $or: [{ suspiciousActivity: true }, { frozen: true }],
      })
      .populate('user', 'name email')
      .sort({ updatedAt: -1 })
      .limit(50)
      .exec();

    return {
      suspiciousWallets,
      count: suspiciousWallets.length,
    };
  }

  async createManualAdjustment(
    adjustmentDto: { userId: string; amount: number; description: string; adminNotes?: string },
    adminId: string,
  ) {
    const session = await this.walletModel.db.startSession();
    session.startTransaction();

    try {
      const user = await this.userModel
        .findById(adjustmentDto.userId)
        .session(session);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const wallet = await this.walletModel
        .findOne({ user: new Types.ObjectId(adjustmentDto.userId) })
        .session(session);

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      // Update wallet balance
      wallet.balance += adjustmentDto.amount;
      wallet.lastActivity = new Date();

      await wallet.save({ session });

      // Create transaction
      const transaction = new this.transactionModel({
        user: new Types.ObjectId(adjustmentDto.userId),
        type: 'admin_adjustment',
        amount: adjustmentDto.amount,
        source: 'wallet',
        destination: 'wallet',
        reference: `MANUAL_${Date.now()}`,
        status: 'completed',
        description: adjustmentDto.description,
        manualTransaction: true,
        createdBy: new Types.ObjectId(adminId),
        adminNotes: adjustmentDto.adminNotes,
      });

      await transaction.save({ session });

      await session.commitTransaction();

      return {
        success: true,
        message: 'Manual adjustment completed',
        transaction,
        newBalance: wallet.balance,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getWalletStats() {
    const walletStats = await this.walletModel.aggregate([
      {
        $group: {
          _id: null,
          totalMainBalance: { $sum: '$balance' },
          totalTradeBalance: { $sum: '$tradeWalletBalance' },
          totalDeposited: { $sum: '$totalDeposited' },
          totalWithdrawn: { $sum: '$totalWithdrawn' },
          frozenCount: {
            $sum: { $cond: [{ $eq: ['$frozen', true] }, 1, 0] },
          },
          suspiciousCount: {
            $sum: { $cond: [{ $eq: ['$suspiciousActivity', true] }, 1, 0] },
          },
          averageMainBalance: { $avg: '$balance' },
          averageTradeBalance: { $avg: '$tradeWalletBalance' },
          activeInvestmentsCount: {
            $sum: { $cond: [{ $eq: ['$hasActiveInvestments', true] }, 1, 0] },
          },
        },
      },
    ]);

    const walletData = walletStats[0] || {
      totalMainBalance: 0,
      totalTradeBalance: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      frozenCount: 0,
      suspiciousCount: 0,
      averageMainBalance: 0,
      averageTradeBalance: 0,
      activeInvestmentsCount: 0,
    };

    return {
      mainWallets: walletData,
      tradingWallets: {
        totalBalance: walletData.totalTradeBalance,
        totalDeposited: 0, // Not tracked separately for trade wallet anymore
        totalWithdrawn: 0, // Not tracked separately for trade wallet anymore
        frozenCount: walletData.frozenCount,
        suspiciousCount: walletData.suspiciousCount,
        averageBalance: walletData.averageTradeBalance,
        activeInvestmentsCount: walletData.activeInvestmentsCount,
      },
      combined: {
        totalBalance:
          walletData.totalMainBalance + walletData.totalTradeBalance,
        totalFrozen: walletData.frozenCount,
        totalSuspicious: walletData.suspiciousCount,
      },
    };
  }

  private buildFilter(query: any) {
    const filter: any = {};

    if (query.status) filter.status = query.status;
    if (query.userId) filter.user = new Types.ObjectId(query.userId);
    if (query.frozen !== undefined) filter.frozen = query.frozen;
    if (query.suspiciousActivity !== undefined)
      filter.suspiciousActivity = query.suspiciousActivity;
    if (query.currency) filter.currency = query.currency;

    if (query.minBalance || query.maxBalance) {
      filter.balance = {};
      if (query.minBalance) filter.balance.$gte = query.minBalance;
      if (query.maxBalance) filter.balance.$lte = query.maxBalance;
    }

    return filter;
  }

  private buildSort(query: any) {
    const sort: any = {};
    sort[query.sortBy || 'createdAt'] = query.sortOrder === 'asc' ? 1 : -1;
    return sort;
  }
}
