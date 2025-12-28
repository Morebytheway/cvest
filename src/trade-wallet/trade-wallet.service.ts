import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession, Types } from 'mongoose';
import {
  TradingWallet,
  TradingWalletDocument,
} from './schemas/trading-wallet.schema';
import { Wallet, WalletDocument } from '../wallet/schema/wallet.schema';
import {
  Transaction,
  TransactionDocument,
} from '../transactions/schemas/transaction.schema';
import {
  UserInvestment,
  UserInvestmentDocument,
} from '../investments/schemas/user-investment.schema';
import { FundTradeWalletDto } from './dto/fund-trade-wallet.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TradeWalletService {
  constructor(
    @InjectModel(TradingWallet.name)
    private tradingWalletModel: Model<TradingWalletDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    @InjectModel(UserInvestment.name)
    private userInvestmentModel: Model<UserInvestmentDocument>,
  ) {}

  async findByUser(userId: string) {
    let tradeWallet = await this.tradingWalletModel
      .findOne({ user: userId })
      .exec();

    if (!tradeWallet) {
      tradeWallet = await this.createTradeWallet(userId);
    }

    return tradeWallet;
  }

  async createTradeWallet(userId: string) {
    const tradeWallet = new this.tradingWalletModel({
      user: new Types.ObjectId(userId),
      balance: 0,
      currency: 'USDT',
      status: 'active',
      hasActiveInvestments: false,
    });

    return tradeWallet.save();
  }

  async fundTradeWallet(userId: string, fundDto: FundTradeWalletDto) {
    const session = await this.tradingWalletModel.db.startSession();
    session.startTransaction();

    try {
      // Get user's main wallet
      const mainWallet = await this.walletModel
        .findOne({ user: userId })
        .session(session);
      if (!mainWallet) {
        throw new NotFoundException('Main wallet not found');
      }

      // Check if user has sufficient balance
      if (mainWallet.balance < fundDto.amount) {
        throw new BadRequestException('Insufficient balance in main wallet');
      }

      // Check if user has active investments (withdrawal restriction)
      const activeInvestments = await this.userInvestmentModel
        .countDocuments({
          user: new Types.ObjectId(userId),
          status: 'active',
        })
        .session(session);

      if (activeInvestments > 0) {
        throw new BadRequestException(
          'Cannot fund trade wallet while having active investments',
        );
      }

      // Get or create trade wallet
      let tradeWallet = await this.tradingWalletModel
        .findOne({ user: userId })
        .session(session);
      if (!tradeWallet) {
        tradeWallet = await this.createTradeWallet(userId);
        // Re-fetch with session
        tradeWallet = await this.tradingWalletModel
          .findOne({ user: userId })
          .session(session);
      }

      if (!tradeWallet) {
        throw new NotFoundException('Trade wallet not found');
      }

      // Create transaction record
      const reference = `TW_${uuidv4().replace(/-/g, '').toUpperCase()}`;
      const transaction = new this.transactionModel({
        user: new Types.ObjectId(userId),
        type: 'wallet_to_trade',
        amount: fundDto.amount,
        source: 'wallet',
        destination: 'trade_wallet',
        reference,
        status: 'pending',
        description: `Funding trade wallet with ${fundDto.amount} USDT`,
      });

      await transaction.save({ session });

      // Update balances
      mainWallet.balance -= fundDto.amount;
      tradeWallet.balance += fundDto.amount;

      await mainWallet.save({ session });
      await tradeWallet.save({ session });

      // Mark transaction as completed
      transaction.status = 'completed';
      await transaction.save({ session });

      await session.commitTransaction();

      return { transaction, tradeWallet };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getBalance(userId: string): Promise<{
    balance: number;
    currency: string;
    status: string;
    hasActiveInvestments: boolean;
  }> {
    const tradeWallet = await this.findByUser(userId);

    // Check for active investments
    const activeInvestments = await this.userInvestmentModel.countDocuments({
      user: new Types.ObjectId(userId),
      status: 'active',
    });

    if (tradeWallet) {
      tradeWallet.hasActiveInvestments = activeInvestments > 0;
      await tradeWallet.save();

      return {
        balance: tradeWallet.balance,
        currency: tradeWallet.currency,
        status: tradeWallet.status,
        hasActiveInvestments: tradeWallet.hasActiveInvestments,
      };
    }

    return {
      balance: 0,
      currency: 'USDT',
      status: 'active',
      hasActiveInvestments: false,
    };
  }

  async updateBalance(userId: string, amount: number, session?: ClientSession) {
    const tradeWallet = await this.tradingWalletModel
      .findOne({ user: userId })
      .session(session || null);

    if (!tradeWallet) {
      throw new NotFoundException('Trade wallet not found');
    }

    tradeWallet.balance += amount;

    // Ensure balance doesn't go negative
    if (tradeWallet.balance < 0) {
      throw new BadRequestException('Insufficient balance in trade wallet');
    }

    return tradeWallet.save({ session });
  }

  async checkActiveInvestments(userId: string): Promise<boolean> {
    const activeInvestments = await this.userInvestmentModel.countDocuments({
      user: new Types.ObjectId(userId),
      status: 'active',
    });

    return activeInvestments > 0;
  }

  async updateInvestmentStatus(
    userId: string,
    hasActiveInvestments: boolean,
  ): Promise<void> {
    await this.tradingWalletModel.updateOne(
      { user: new Types.ObjectId(userId) },
      { hasActiveInvestments },
    );
  }
}
