import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession, Types } from 'mongoose';
import {
  UserInvestment,
  UserInvestmentDocument,
} from '../investments/schemas/user-investment.schema';
import { Wallet, WalletDocument } from '../wallet/schema/wallet.schema';
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
    @InjectModel(Wallet.name)
    private walletModel: Model<WalletDocument>,
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
          $or: [{ isProfitCredited: false }, { isPrincipalReturned: false }],
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
    const principalAmount = investment.amount;

    // Complete the investment
    await this.investmentsService.completeInvestment(
      String(investment._id),
      session,
    );

    // Credit profit to trade wallet if not already credited
    if (!investment.isProfitCredited) {
      await this.investmentsService.creditProfit(
        userId,
        String(investment._id),
        profitAmount,
        session,
      );
    }

    // Return principal to trade wallet if not already returned
    if (!investment.isPrincipalReturned) {
      await this.investmentsService.returnPrincipal(
        userId,
        String(investment._id),
        principalAmount,
        session,
      );
    }

    // Update wallet investment status
    const wallet = await this.walletModel
      .findOne({ user: new Types.ObjectId(userId) })
      .session(session);

    if (wallet) {
      // Check if user has other active investments
      const activeInvestmentsCount = await this.userInvestmentModel
        .countDocuments({
          user: new Types.ObjectId(userId),
          status: 'active',
        })
        .session(session);

      wallet.hasActiveInvestments = activeInvestmentsCount > 0;
      wallet.lastActivity = new Date();
      await wallet.save({ session });
    }
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
          $or: [{ isProfitCredited: false }, { isPrincipalReturned: false }],
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
    maturedButNotPrincipalReturned: number;
    dueInNext24Hours: number;
    totalProfitPending: number;
    totalPrincipalPending: number;
  }> {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const [
      totalActive,
      maturedNotCredited,
      maturedNotPrincipalReturned,
      dueNext24Hours,
      profitStats,
      principalStats,
    ] = await Promise.all([
      this.userInvestmentModel.countDocuments({ status: 'active' }),
      this.userInvestmentModel.countDocuments({
        status: 'active',
        endDate: { $lte: now },
        isProfitCredited: false,
      }),
      this.userInvestmentModel.countDocuments({
        status: 'active',
        endDate: { $lte: now },
        isPrincipalReturned: false,
      }),
      this.userInvestmentModel.countDocuments({
        status: 'active',
        endDate: { $lte: tomorrow },
        $or: [{ isProfitCredited: false }, { isPrincipalReturned: false }],
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
      this.userInvestmentModel.aggregate([
        {
          $match: {
            status: 'active',
            isPrincipalReturned: false,
          },
        },
        {
          $group: {
            _id: null,
            totalPrincipalPending: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    return {
      totalActiveInvestments: totalActive,
      maturedButNotCredited: maturedNotCredited,
      maturedButNotPrincipalReturned: maturedNotPrincipalReturned,
      dueInNext24Hours: dueNext24Hours,
      totalProfitPending: profitStats[0]?.totalProfitPending || 0,
      totalPrincipalPending: principalStats[0]?.totalPrincipalPending || 0,
    };
  }
}
