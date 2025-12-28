import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession, Types } from 'mongoose';
import {
  UserInvestment,
  UserInvestmentDocument,
} from '../investments/schemas/user-investment.schema';
import {
  TradingWallet,
  TradingWalletDocument,
} from '../trade-wallet/schemas/trading-wallet.schema';
import {
  Transaction,
  TransactionDocument,
} from '../transactions/schemas/transaction.schema';
import { InvestmentsService } from '../investments/investments.service';

@Injectable()
export class InvestmentProfitService {
  private readonly logger = new Logger(InvestmentProfitService.name);

  constructor(
    @InjectModel(UserInvestment.name)
    private userInvestmentModel: Model<UserInvestmentDocument>,
    @InjectModel(TradingWallet.name)
    private tradingWalletModel: Model<TradingWalletDocument>,
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    private readonly investmentsService: InvestmentsService,
  ) {}

  // Run every day at midnight (00:00)
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processMaturedInvestments() {
    this.logger.log('Starting to process matured investments...');

    const session = await this.userInvestmentModel.db.startSession();
    session.startTransaction();

    try {
      // Find all active investments that have matured (endDate <= now)
      const maturedInvestments = await this.userInvestmentModel
        .find({
          status: 'active',
          endDate: { $lte: new Date() },
          isProfitCredited: false,
        })
        .populate('investment')
        .session(session);

      this.logger.log(
        `Found ${maturedInvestments.length} matured investments to process`,
      );

      for (const investment of maturedInvestments) {
        try {
          await this.processSingleInvestment(investment, session);
          this.logger.log(
            `Successfully processed investment ${investment._id} for user ${investment.user}`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to process investment ${investment._id} for user ${investment.user}: ${error.message}`,
          );
          // Continue processing other investments
        }
      }

      await session.commitTransaction();
      this.logger.log('Successfully processed all matured investments');
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(
        `Failed to process matured investments: ${error.message}`,
      );
    } finally {
      session.endSession();
    }
  }

  private async processSingleInvestment(
    investment: UserInvestmentDocument,
    session: ClientSession,
  ) {
    const userId = investment.user.toString();
    const profitAmount = investment.expectedProfit;

    // Complete the investment
    await this.investmentsService.completeInvestment(
      investment._id.toString(),
      session,
    );

    // Credit profit to trade wallet
    await this.investmentsService.creditProfit(
      userId,
      investment._id.toString(),
      profitAmount,
      session,
    );

    // Update trade wallet investment status
    const tradeWallet = await this.tradingWalletModel
      .findOne({ user: new Types.ObjectId(userId) })
      .session(session);

    if (tradeWallet) {
      // Check if user has other active investments
      const activeInvestmentsCount = await this.userInvestmentModel
        .countDocuments({
          user: new Types.ObjectId(userId),
          status: 'active',
        })
        .session(session);

      tradeWallet.hasActiveInvestments = activeInvestmentsCount > 0;
      await tradeWallet.save({ session });
    }

    // Create a combined transaction record for the profit crediting
    const transaction = new this.transactionModel({
      user: new Types.ObjectId(userId),
      type: 'investment_profit',
      amount: profitAmount,
      source: 'investment',
      destination: 'trade_wallet',
      reference: `PROFIT_${Date.now()}_${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
      status: 'completed',
      description: `Profit credited from investment - ${profitAmount} USDT`,
      relatedInvestment: investment._id,
      metadata: {
        originalInvestment: investment._id,
        investmentAmount: investment.amount,
        profitRate: (investment.expectedProfit / investment.amount) * 100,
        maturedAt: new Date(),
      },
    });

    await transaction.save({ session });
  }

  // Manual endpoint for testing or emergency processing
  async processMaturedInvestmentsManually(): Promise<{
    processed: number;
    failed: number;
  }> {
    this.logger.log('Starting manual processing of matured investments...');

    const session = await this.userInvestmentModel.db.startSession();
    session.startTransaction();

    let processed = 0;
    let failed = 0;

    try {
      const maturedInvestments = await this.userInvestmentModel
        .find({
          status: 'active',
          endDate: { $lte: new Date() },
          isProfitCredited: false,
        })
        .populate('investment')
        .session(session);

      for (const investment of maturedInvestments) {
        try {
          await this.processSingleInvestment(investment, session);
          processed++;
        } catch (error) {
          failed++;
          this.logger.error(
            `Failed to process investment ${investment._id}: ${error.message}`,
          );
        }
      }

      await session.commitTransaction();
      this.logger.log(
        `Manual processing completed: ${processed} successful, ${failed} failed`,
      );
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(`Manual processing failed: ${error.message}`);
    } finally {
      session.endSession();
    }

    return { processed, failed };
  }

  // Get statistics about investments due for profit crediting
  async getInvestmentStats(): Promise<{
    totalActiveInvestments: number;
    maturedButNotCredited: number;
    dueInNext24Hours: number;
    totalProfitPending: number;
  }> {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const [totalActive, maturedNotCredited, dueNext24Hours, profitStats] =
      await Promise.all([
        this.userInvestmentModel.countDocuments({ status: 'active' }),
        this.userInvestmentModel.countDocuments({
          status: 'active',
          endDate: { $lte: now },
          isProfitCredited: false,
        }),
        this.userInvestmentModel.countDocuments({
          status: 'active',
          endDate: { $lte: tomorrow },
          isProfitCredited: false,
        }),
        this.userInvestmentModel.aggregate([
          {
            $match: {
              status: 'active',
              isProfitCredited: false,
            },
          },
          {
            $group: {
              _id: null,
              totalProfitPending: { $sum: '$expectedProfit' },
            },
          },
        ]),
      ]);

    return {
      totalActiveInvestments: totalActive,
      maturedButNotCredited: maturedNotCredited,
      dueInNext24Hours: dueNext24Hours,
      totalProfitPending: profitStats[0]?.totalProfitPending || 0,
    };
  }
}
