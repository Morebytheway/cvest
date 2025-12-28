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
import { TransactionQueryDto } from './dto/transaction-query.dto';

@Injectable()
export class AdminTransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
  ) {}

  async getAllTransactions(query: TransactionQueryDto) {
    const filter = this.buildFilter(query);
    const sort = this.buildSort(query);
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.transactionModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email')
        .populate('relatedInvestment')
        .exec(),
      this.transactionModel.countDocuments(filter),
    ]);

    return {
      transactions,
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

  async getFailedTransactions() {
    return this.transactionModel
      .find({ status: 'failed' })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async reverseTransaction(id: string, reason: string, adminId: string) {
    const transaction = await this.transactionModel.findById(id);
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.reversed) {
      throw new BadRequestException('Transaction is already reversed');
    }

    // Update transaction
    transaction.reversed = true;
    transaction.reversedAt = new Date();
    transaction.reversedBy = new Types.ObjectId(adminId);
    transaction.reversalReason = reason;

    await transaction.save();

    return this.getTransactionById(id);
  }

  async createManualTransaction(manualDto: any, adminId: string) {
    const transaction = new this.transactionModel({
      user: new Types.ObjectId(manualDto.userId),
      type: manualDto.type,
      amount: manualDto.amount,
      source: manualDto.source,
      destination: manualDto.destination,
      reference: `MANUAL_${Date.now()}`,
      status: 'completed',
      description: manualDto.description,
      manualTransaction: true,
      createdBy: new Types.ObjectId(adminId),
      adminNotes: manualDto.adminNotes,
    });

    return transaction.save();
  }

  async getTransactionById(id: string) {
    return this.transactionModel
      .findById(id)
      .populate('user', 'name email')
      .populate('relatedInvestment')
      .exec();
  }

  private buildFilter(query: TransactionQueryDto) {
    const filter: any = {};

    if (query.status) filter.status = query.status;
    if (query.type) filter.type = query.type;
    if (query.userId) filter.user = new Types.ObjectId(query.userId);
    if (query.flaggedForReview !== undefined)
      filter.flaggedForReview = query.flaggedForReview;
    if (query.suspiciousActivity !== undefined)
      filter.suspiciousActivity = query.suspiciousActivity;

    if (query.dateFrom || query.dateTo) {
      filter.createdAt = {};
      if (query.dateFrom) filter.createdAt.$gte = new Date(query.dateFrom);
      if (query.dateTo) filter.createdAt.$lte = new Date(query.dateTo);
    }

    if (query.minAmount || query.maxAmount) {
      filter.amount = {};
      if (query.minAmount) filter.amount.$gte = query.minAmount;
      if (query.maxAmount) filter.amount.$lte = query.maxAmount;
    }

    return filter;
  }

  private buildSort(query: TransactionQueryDto) {
    const sort: any = {};
    sort[query.sortBy || 'createdAt'] = query.sortOrder === 'asc' ? 1 : -1;
    return sort;
  }
}
