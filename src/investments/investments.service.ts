import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession, Types } from 'mongoose';
import { Investment, InvestmentDocument } from './schemas/investment.schema';
import {
  UserInvestment,
  UserInvestmentDocument,
} from './schemas/user-investment.schema';
import {
  TradingWallet,
  TradingWalletDocument,
} from '../trade-wallet/schemas/trading-wallet.schema';
import {
  Transaction,
  TransactionDocument,
} from '../transactions/schemas/transaction.schema';
import { InvestDto, GetInvestmentsDto } from './dto/invest.dto';

@Injectable()
export class InvestmentsService {
  constructor(
    @InjectModel(Investment.name)
    private investmentModel: Model<InvestmentDocument>,
    @InjectModel(UserInvestment.name)
    private userInvestmentModel: Model<UserInvestmentDocument>,
    @InjectModel(TradingWallet.name)
    private tradingWalletModel: Model<TradingWalletDocument>,
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
  ) {}

  async getAvailableInvestmentPlans(): Promise<InvestmentDocument[]> {
    return this.investmentModel
      .find({ status: 'active' })
      .sort({ rate: 1 })
      .exec();
  }

  async invest(userId: string, investDto: InvestDto) {
    const session = await this.userInvestmentModel.db.startSession();
    session.startTransaction();

    try {
      // Get investment plan
      const investmentPlan = await this.investmentModel
        .findOne({ _id: investDto.investmentId, status: 'active' })
        .session(session);

      if (!investmentPlan) {
        throw new NotFoundException('Investment plan not found or inactive');
      }

      // Check minimum investment
      if (investDto.amount < investmentPlan.minAmount) {
        throw new BadRequestException(
          `Minimum investment amount is ${investmentPlan.minAmount} USDT`,
        );
      }

      // Check if user already has this investment type
      const existingInvestment = await this.userInvestmentModel
        .findOne({
          user: new Types.ObjectId(userId),
          investment: new Types.ObjectId(investDto.investmentId),
          status: 'active',
        })
        .session(session);

      if (existingInvestment) {
        throw new BadRequestException(
          'You already have an active investment of this type',
        );
      }

      // Get user's trade wallet
      const tradeWallet = await this.tradingWalletModel
        .findOne({ user: userId })
        .session(session);

      if (!tradeWallet) {
        throw new NotFoundException('Trade wallet not found');
      }

      // Check sufficient balance
      if (tradeWallet.balance < investDto.amount) {
        throw new BadRequestException('Insufficient balance in trade wallet');
      }

      // Calculate investment dates and profit
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + investmentPlan.durationDays);

      const expectedProfit = investDto.amount * (investmentPlan.rate / 100);

      // Create user investment
      const userInvestment = new this.userInvestmentModel({
        user: new Types.ObjectId(userId),
        investment: new Types.ObjectId(investDto.investmentId),
        amount: investDto.amount,
        startDate,
        endDate,
        expectedProfit,
        status: 'active',
      });

      await userInvestment.save({ session });

      // Create transaction record
      const transaction = new this.transactionModel({
        user: new Types.ObjectId(userId),
        type: 'trade_to_investment',
        amount: investDto.amount,
        source: 'trade_wallet',
        destination: 'investment',
        reference: `INV_${Date.now()}_${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
        status: 'pending',
        description: `Investment in ${investmentPlan.name} - ${investDto.amount} USDT`,
        relatedInvestment: userInvestment._id,
      });

      await transaction.save({ session });

      // Update trade wallet balance
      tradeWallet.balance -= investDto.amount;
      tradeWallet.hasActiveInvestments = true;
      await tradeWallet.save({ session });

      // Mark transaction as completed
      transaction.status = 'completed';
      await transaction.save({ session });

      await session.commitTransaction();

      return {
        userInvestment,
        transaction,
        tradeWallet,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getUserInvestments(userId: string, queryDto: GetInvestmentsDto) {
    const { status, limit = 10, offset = 0 } = queryDto;

    const filter: any = { user: new Types.ObjectId(userId) };

    if (status) {
      filter.status = status;
    }

    const investments = await this.userInvestmentModel
      .find(filter)
      .populate('investment')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .exec();

    const total = await this.userInvestmentModel.countDocuments(filter);

    return {
      investments,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  async getActiveInvestments(
    userId: string,
  ): Promise<UserInvestmentDocument[]> {
    return this.userInvestmentModel
      .find({
        user: new Types.ObjectId(userId),
        status: 'active',
      })
      .populate('investment')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getCompletedInvestments(
    userId: string,
  ): Promise<UserInvestmentDocument[]> {
    return this.userInvestmentModel
      .find({
        user: new Types.ObjectId(userId),
        status: 'completed',
      })
      .populate('investment')
      .sort({ updatedAt: -1 })
      .exec();
  }

  async getInvestmentById(
    userId: string,
    investmentId: string,
  ): Promise<UserInvestmentDocument> {
    if (investmentId === 'summary') {
      throw new Error(
        'Invalid investment ID: "summary" is not a valid ObjectId',
      );
    }

    const investment = await this.userInvestmentModel
      .findOne({
        _id: investmentId,
        user: new Types.ObjectId(userId),
      })
      .populate('investment')
      .exec();

    if (!investment) {
      throw new NotFoundException('Investment not found');
    }

    return investment;
  }

  async completeInvestment(userInvestmentId: string, session?: ClientSession) {
    const userInvestment = await this.userInvestmentModel
      .findById(userInvestmentId)
      .session(session || null)
      .populate('investment');

    if (!userInvestment) {
      throw new NotFoundException('User investment not found');
    }

    if (userInvestment.status !== 'active') {
      throw new BadRequestException('Investment is not active');
    }

    const now = new Date();
    if (now < userInvestment.endDate) {
      throw new BadRequestException('Investment has not matured yet');
    }

    // Calculate actual profit (same as expected for now)
    userInvestment.actualProfit = userInvestment.expectedProfit;
    userInvestment.status = 'completed';
    userInvestment.profitCreditedAt = now;
    userInvestment.isProfitCredited = true;

    return userInvestment.save({ session });
  }

  async creditProfit(
    userId: string,
    userInvestmentId: string,
    profitAmount: number,
    session?: ClientSession,
  ) {
    // Update trade wallet balance
    const tradeWallet = await this.tradingWalletModel
      .findOne({ user: userId })
      .session(session || null);

    if (!tradeWallet) {
      throw new NotFoundException('Trade wallet not found');
    }

    tradeWallet.balance += profitAmount;
    await tradeWallet.save({ session });

    // Create profit transaction
    const transaction = new this.transactionModel({
      user: new Types.ObjectId(userId),
      type: 'investment_profit',
      amount: profitAmount,
      source: 'investment',
      destination: 'trade_wallet',
      reference: `PROFIT_${Date.now()}_${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
      status: 'completed',
      description: `Profit credited from investment - ${profitAmount} USDT`,
      relatedInvestment: new Types.ObjectId(userInvestmentId),
    });

    return transaction.save({ session });
  }

  async getInvestmentSummary(userId: string): Promise<{
    totalInvested: number;
    activeInvestments: number;
    completedInvestments: number;
    totalProfitEarned: number;
    pendingProfit: number;
  }> {
    const summary = await this.userInvestmentModel.aggregate([
      { $match: { user: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalInvested: { $sum: '$amount' },
          activeInvestments: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
          },
          completedInvestments: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          totalProfitEarned: {
            $sum: {
              $cond: [{ $eq: ['$isProfitCredited', true] }, '$actualProfit', 0],
            },
          },
          pendingProfit: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'active'] },
                    { $eq: ['$isProfitCredited', false] },
                  ],
                },
                '$expectedProfit',
                0,
              ],
            },
          },
        },
      },
    ]);

    return (
      summary[0] || {
        totalInvested: 0,
        activeInvestments: 0,
        completedInvestments: 0,
        totalProfitEarned: 0,
        pendingProfit: 0,
      }
    );
  }

  async checkInvestmentTypeExists(
    userId: string,
    investmentId: string,
  ): Promise<boolean> {
    const existingInvestment = await this.userInvestmentModel
      .findOne({
        user: new Types.ObjectId(userId),
        investment: new Types.ObjectId(investmentId),
        status: 'active',
      })
      .exec();

    return !!existingInvestment;
  }
}
