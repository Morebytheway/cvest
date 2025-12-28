import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession, Types } from 'mongoose';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { GetTransactionsDto } from './dto/get-transactions.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
  ) {}

  async createTransaction(
    userId: string,
    type: string,
    amount: number,
    source: string,
    destination: string,
    description?: string,
    relatedInvestment?: string,
    session?: ClientSession,
  ): Promise<TransactionDocument> {
    const reference = this.generateReference(type);

    const transaction = new this.transactionModel({
      user: new Types.ObjectId(userId),
      type,
      amount,
      source,
      destination,
      reference,
      status: 'pending',
      description,
      relatedInvestment: relatedInvestment
        ? new Types.ObjectId(relatedInvestment)
        : undefined,
    });

    return transaction.save({ session });
  }

  async completeTransaction(
    reference: string,
    session?: ClientSession,
  ): Promise<TransactionDocument> {
    const transaction = await this.transactionModel
      .findOne({ reference })
      .session(session || null);

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    transaction.status = 'completed';
    return transaction.save({ session });
  }

  async failTransaction(
    reference: string,
    session?: ClientSession,
  ): Promise<TransactionDocument> {
    const transaction = await this.transactionModel
      .findOne({ reference })
      .session(session || null);

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    transaction.status = 'failed';
    return transaction.save({ session });
  }

  async getUserTransactions(userId: string, queryDto: GetTransactionsDto) {
    const {
      type,
      status,
      limit = 10,
      offset = 0,
      startDate,
      endDate,
    } = queryDto;

    const filter: any = { user: new Types.ObjectId(userId) };

    if (type) {
      filter.type = type;
    }

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    const transactions = await this.transactionModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .populate('relatedInvestment')
      .exec();

    const total = await this.transactionModel.countDocuments(filter);

    return {
      transactions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  async getTransactionByReference(
    reference: string,
  ): Promise<TransactionDocument> {
    const transaction = await this.transactionModel
      .findOne({ reference })
      .populate('relatedInvestment')
      .exec();

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async getTransactionsByType(
    userId: string,
    type: string,
  ): Promise<TransactionDocument[]> {
    return this.transactionModel
      .find({ user: new Types.ObjectId(userId), type })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getTransactionsByStatus(
    userId: string,
    status: string,
  ): Promise<TransactionDocument[]> {
    return this.transactionModel
      .find({ user: new Types.ObjectId(userId), status })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getTransactionSummary(userId: string): Promise<{
    totalTransactions: number;
    totalAmount: number;
    successfulTransactions: number;
    failedTransactions: number;
    pendingTransactions: number;
  }> {
    const summary = await this.transactionModel.aggregate([
      { $match: { user: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          successfulTransactions: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          failedTransactions: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
          },
          pendingTransactions: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
        },
      },
    ]);

    return (
      summary[0] || {
        totalTransactions: 0,
        totalAmount: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        pendingTransactions: 0,
      }
    );
  }

  private generateReference(type: string): string {
    const prefix = type.toUpperCase().replace(/_/g, '_');
    const uuid = uuidv4().replace(/-/g, '').toUpperCase();
    return `${prefix}_${uuid}`;
  }

  async checkReferenceExists(reference: string): Promise<boolean> {
    const transaction = await this.transactionModel
      .findOne({ reference })
      .exec();
    return !!transaction;
  }
}
