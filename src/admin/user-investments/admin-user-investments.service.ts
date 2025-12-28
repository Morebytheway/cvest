import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import {
  UserInvestment,
  UserInvestmentDocument,
} from '../../investments/schemas/user-investment.schema';
import {
  Investment,
  InvestmentDocument,
} from '../../investments/schemas/investment.schema';
import {
  TradingWallet,
  TradingWalletDocument,
} from '../../trade-wallet/schemas/trading-wallet.schema';
import {
  Transaction,
  TransactionDocument,
} from '../../transactions/schemas/transaction.schema';
import { UserInvestmentQueryDto } from './dto/user-investment-query.dto';
import { ProfitAdjustmentDto } from './dto/profit-adjustment.dto';
import { FreezeInvestmentDto } from './dto/freeze-investment.dto';
import { InvestmentsService } from '../../investments/investments.service';

@Injectable()
export class AdminUserInvestmentsService {
  constructor(
    @InjectModel(UserInvestment.name)
    private userInvestmentModel: Model<UserInvestmentDocument>,
    @InjectModel(Investment.name)
    private investmentModel: Model<InvestmentDocument>,
    @InjectModel(TradingWallet.name)
    private tradingWalletModel: Model<TradingWalletDocument>,
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    private readonly investmentsService: InvestmentsService,
  ) {}

  async getAllUserInvestments(query: UserInvestmentQueryDto): Promise<{
    investments: UserInvestmentDocument[];
    total: number;
    pagination: {
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const {
      page = 1,
      limit = 10,
      status,
      riskFlag,
      userId,
      investmentId,
      isFrozen,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // Build filter
    const filter: any = {};
    if (status) filter.status = status;
    if (riskFlag) filter.riskFlag = riskFlag;
    if (userId) filter.user = new Types.ObjectId(userId);
    if (investmentId) filter.investment = new Types.ObjectId(investmentId);
    if (isFrozen !== undefined) filter.isFrozen = isFrozen;

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = minAmount;
      if (maxAmount) filter.amount.$lte = maxAmount;
    }

    // Build sort
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [investments, total] = await Promise.all([
      this.userInvestmentModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email')
        .populate('investment', 'name rate durationDays')
        .populate('frozenBy', 'name email')
        .populate('completedBy', 'name email')
        .populate('reviewedBy', 'name email')
        .exec(),
      this.userInvestmentModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      investments,
      total,
      pagination: {
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getUserInvestmentById(id: string): Promise<UserInvestmentDocument> {
    const investment = await this.userInvestmentModel
      .findById(id)
      .populate('user', 'name email')
      .populate('investment', 'name rate durationDays')
      .populate('frozenBy', 'name email')
      .populate('completedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .exec();

    if (!investment) {
      throw new NotFoundException('User investment not found');
    }

    return investment;
  }

  async getUserInvestmentHistory(
    userId: string,
  ): Promise<UserInvestmentDocument[]> {
    const investments = await this.userInvestmentModel
      .find({ user: new Types.ObjectId(userId) })
      .populate('investment', 'name rate durationDays')
      .sort({ createdAt: -1 })
      .exec();

    return investments;
  }

  async completeInvestmentManually(
    id: string,
    adminId: string,
  ): Promise<UserInvestmentDocument> {
    const session = await this.userInvestmentModel.db.startSession();
    session.startTransaction();

    try {
      const investment = await this.userInvestmentModel
        .findById(id)
        .populate('investment')
        .session(session);

      if (!investment) {
        throw new NotFoundException('User investment not found');
      }

      if (investment.status !== 'active') {
        throw new BadRequestException('Investment is not active');
      }

      if (investment.isFrozen) {
        throw new BadRequestException('Cannot complete a frozen investment');
      }

      // Complete the investment
      investment.status = 'completed';
      investment.manuallyCompleted = true;
      investment.completedBy = new Types.ObjectId(adminId);
      investment.profitCreditedAt = new Date();
      investment.isProfitCredited = true;

      // Credit profit to user's trade wallet
      await this.investmentsService.creditProfit(
        investment.user.toString(),
        id,
        investment.expectedProfit,
        session,
      );

      await investment.save({ session });

      await session.commitTransaction();

      // Return populated investment
      return await this.getUserInvestmentById(id);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async freezeInvestment(
    id: string,
    freezeDto: FreezeInvestmentDto,
    adminId: string,
  ): Promise<UserInvestmentDocument> {
    const investment = await this.getUserInvestmentById(id);

    if (investment.status !== 'active') {
      throw new BadRequestException('Only active investments can be frozen');
    }

    if (investment.isFrozen) {
      throw new BadRequestException('Investment is already frozen');
    }

    investment.isFrozen = true;
    investment.frozenAt = new Date();
    investment.frozenBy = new Types.ObjectId(adminId);
    investment.freezeReason = freezeDto.freezeReason;
    investment.adminNotes = freezeDto.adminNotes;

    await investment.save();

    // Return populated investment
    return await this.getUserInvestmentById(id);
  }

  async unfreezeInvestment(
    id: string,
    adminId: string,
  ): Promise<UserInvestmentDocument> {
    const investment = await this.getUserInvestmentById(id);

    if (!investment.isFrozen) {
      throw new BadRequestException('Investment is not frozen');
    }

    investment.isFrozen = false;
    investment.frozenAt = undefined;
    investment.frozenBy = undefined;
    investment.freezeReason = undefined;

    await investment.save();

    // Return populated investment
    return await this.getUserInvestmentById(id);
  }

  async terminateInvestment(
    id: string,
    adminId: string,
    reason?: string,
  ): Promise<UserInvestmentDocument> {
    const session = await this.userInvestmentModel.db.startSession();
    session.startTransaction();

    try {
      const investment = await this.userInvestmentModel
        .findById(id)
        .session(session);

      if (!investment) {
        throw new NotFoundException('User investment not found');
      }

      if (investment.status === 'completed') {
        throw new BadRequestException(
          'Cannot terminate a completed investment',
        );
      }

      // Mark as cancelled
      investment.status = 'cancelled';
      investment.adminNotes = reason || 'Terminated by admin';

      await investment.save({ session });

      await session.commitTransaction();

      // Return populated investment
      return await this.getUserInvestmentById(id);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async adjustInvestmentProfit(
    id: string,
    adjustmentDto: ProfitAdjustmentDto,
    adminId: string,
  ): Promise<UserInvestmentDocument> {
    const session = await this.userInvestmentModel.db.startSession();
    session.startTransaction();

    try {
      const investment = await this.userInvestmentModel
        .findById(id)
        .session(session);

      if (!investment) {
        throw new NotFoundException('User investment not found');
      }

      if (investment.status !== 'completed') {
        throw new BadRequestException(
          'Only completed investments can have profit adjusted',
        );
      }

      const oldProfit = investment.actualProfit;
      const profitDifference = adjustmentDto.newProfitAmount - oldProfit;

      // Update profit
      investment.actualProfit = adjustmentDto.newProfitAmount;
      investment.adminNotes = adjustmentDto.reason || adjustmentDto.adminNotes;
      investment.reviewedBy = new Types.ObjectId(adminId);
      investment.lastReviewed = new Date();

      await investment.save({ session });

      // Credit additional profit if positive
      if (profitDifference > 0) {
        await this.investmentsService.creditProfit(
          investment.user.toString(),
          id,
          profitDifference,
          session,
        );
      }

      await session.commitTransaction();

      // Return populated investment
      return await this.getUserInvestmentById(id);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async generateInvestmentReport(query: UserInvestmentQueryDto): Promise<{
    summary: {
      totalInvestments: number;
      totalAmount: number;
      totalProfit: number;
      activeInvestments: number;
      completedInvestments: number;
      cancelledInvestments: number;
      frozenInvestments: number;
      averageInvestmentAmount: number;
      averageProfitAmount: number;
    };
    investments: UserInvestmentDocument[];
  }> {
    // Get investments with filters
    const result = await this.getAllUserInvestments({
      ...query,
      limit: 10000, // Large limit for report
    });

    const investments = result.investments;

    const summary = {
      totalInvestments: investments.length,
      totalAmount: investments.reduce((sum, inv) => sum + inv.amount, 0),
      totalProfit: investments.reduce(
        (sum, inv) => sum + (inv.actualProfit || 0),
        0,
      ),
      activeInvestments: investments.filter((inv) => inv.status === 'active')
        .length,
      completedInvestments: investments.filter(
        (inv) => inv.status === 'completed',
      ).length,
      cancelledInvestments: investments.filter(
        (inv) => inv.status === 'cancelled',
      ).length,
      frozenInvestments: investments.filter((inv) => inv.isFrozen).length,
      averageInvestmentAmount:
        investments.length > 0
          ? investments.reduce((sum, inv) => sum + inv.amount, 0) /
            investments.length
          : 0,
      averageProfitAmount:
        investments.length > 0
          ? investments.reduce((sum, inv) => sum + (inv.actualProfit || 0), 0) /
            investments.length
          : 0,
    };

    return {
      summary,
      investments,
    };
  }

  async validateInvestmentAction(
    id: string,
    action: string,
    adminId: string,
  ): Promise<{ valid: boolean; message?: string }> {
    const investment = await this.userInvestmentModel.findById(id);

    if (!investment) {
      return { valid: false, message: 'Investment not found' };
    }

    switch (action) {
      case 'complete':
        if (investment.status !== 'active') {
          return { valid: false, message: 'Investment is not active' };
        }
        if (investment.isFrozen) {
          return { valid: false, message: 'Investment is frozen' };
        }
        break;

      case 'freeze':
        if (investment.status !== 'active') {
          return {
            valid: false,
            message: 'Only active investments can be frozen',
          };
        }
        if (investment.isFrozen) {
          return { valid: false, message: 'Investment is already frozen' };
        }
        break;

      case 'unfreeze':
        if (!investment.isFrozen) {
          return { valid: false, message: 'Investment is not frozen' };
        }
        break;

      case 'terminate':
        if (investment.status === 'completed') {
          return {
            valid: false,
            message: 'Cannot terminate completed investment',
          };
        }
        break;

      case 'adjust':
        if (investment.status !== 'completed') {
          return {
            valid: false,
            message: 'Only completed investments can be adjusted',
          };
        }
        break;

      default:
        return { valid: false, message: 'Invalid action' };
    }

    return { valid: true };
  }
}
