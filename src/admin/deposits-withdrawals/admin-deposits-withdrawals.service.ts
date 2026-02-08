import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Transaction,
  TransactionDocument,
} from '../../transactions/schemas/transaction.schema';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { DepositsWithdrawalsQueryDto } from './dto/deposits-withdrawals-query.dto';
import { ApproveRejectWithdrawalDto } from './dto/approve-reject-withdrawal.dto';
import { ManualPayoutDto } from './dto/manual-payout.dto';
import { ReconciliationQueryDto } from './dto/reconciliation.dto';

@Injectable()
export class AdminDepositsWithdrawalsService {
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async getDeposits(query: DepositsWithdrawalsQueryDto) {
    const filter: Record<string, unknown> = { type: 'deposit' };
    if (query.status) filter.status = query.status;
    if (query.userId) filter.user = new Types.ObjectId(query.userId);
    return this.paginateTransactions(filter, query);
  }

  async getWithdrawals(query: DepositsWithdrawalsQueryDto) {
    const filter: Record<string, unknown> = { type: 'withdrawal' };
    if (query.status) filter.status = query.status;
    if (query.userId) filter.user = new Types.ObjectId(query.userId);
    return this.paginateTransactions(filter, query);
  }

  private async paginateTransactions(
    filter: Record<string, unknown>,
    query: DepositsWithdrawalsQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.transactionModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email')
        .lean(),
      this.transactionModel.countDocuments(filter),
    ]);
    return {
      items,
      total,
      pagination: { page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async approveOrRejectWithdrawal(
    transactionId: string,
    dto: ApproveRejectWithdrawalDto,
  ) {
    const tx = await this.transactionModel.findById(transactionId);
    if (!tx) throw new NotFoundException('Transaction not found');
    if (tx.type !== 'withdrawal')
      throw new BadRequestException('Not a withdrawal transaction');
    if (tx.status !== 'pending')
      throw new BadRequestException('Transaction already processed');
    tx.status = dto.approve ? 'completed' : 'failed';
    if (dto.reason) (tx as any).rejectionReason = dto.reason;
    await tx.save();
    return {
      success: true,
      message: dto.approve ? 'Withdrawal approved' : 'Withdrawal rejected',
    };
  }

  async manualPayout(dto: ManualPayoutDto) {
    const user = await this.userModel.findById(dto.userId);
    if (!user) throw new NotFoundException('User not found');
    // Create a manual deposit/credit transaction and update wallet balance
    // Integrate with your wallet service for actual balance update
    const ref = `MANUAL-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const tx = await this.transactionModel.create({
      user: dto.userId,
      type: 'deposit',
      amount: dto.amount,
      source: 'wallet',
      destination: 'wallet',
      reference: ref,
      status: 'completed',
      description: dto.description ?? 'Manual payout by admin',
      manualTransaction: true,
    });
    return { success: true, message: 'Manual payout recorded', transactionId: tx._id };
  }

  async reconciliation(query: ReconciliationQueryDto) {
    const filter: Record<string, unknown> = {};
    if (query.type) filter.type = query.type;
    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) (filter.createdAt as any).$gte = new Date(query.startDate);
      if (query.endDate) (filter.createdAt as any).$lte = new Date(query.endDate);
    }
    const [deposits, withdrawals] = await Promise.all([
      this.transactionModel
        .aggregate([
          { $match: { ...filter, type: 'deposit', status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ])
        .then((r) => r[0] ?? { total: 0, count: 0 }),
      this.transactionModel
        .aggregate([
          { $match: { ...filter, type: 'withdrawal', status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ])
        .then((r) => r[0] ?? { total: 0, count: 0 }),
    ]);
    return {
      deposits: { total: deposits.total, count: deposits.count },
      withdrawals: { total: withdrawals.total, count: withdrawals.count },
    };
  }
}
