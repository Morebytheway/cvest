import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession, Types } from 'mongoose';
import { Wallet, WalletDocument } from './schema/wallet.schema';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { TransactionsService } from '../transactions/transactions.service';
import {
  UserInvestment,
  UserInvestmentDocument,
} from '../investments/schemas/user-investment.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet.name)
    private walletModel: Model<WalletDocument>,
    public transactionsService: TransactionsService,
    @InjectModel(UserInvestment.name)
    private userInvestmentModel: Model<UserInvestmentDocument>,
  ) {}

  async create(
    userId: string,
    session?: ClientSession,
  ): Promise<WalletDocument> {
    const existingWallet = await this.walletModel
      .findOne({ user: new Types.ObjectId(userId) })
      .session(session || null);

    if (existingWallet) {
      throw new ConflictException('User already has a wallet');
    }

    const wallet = new this.walletModel({
      user: new Types.ObjectId(userId),
      balance: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      lastActivity: new Date(),
    });

    return wallet.save({ session });
  }

  async findAll(): Promise<WalletDocument[]> {
    return this.walletModel.find().populate('user').exec();
  }

  async findByUser(userId: string): Promise<WalletDocument> {
    const wallet = await this.walletModel
      .findOne({ user: new Types.ObjectId(userId) })
      .populate('user')
      .exec();

    if (!wallet) {
      throw new NotFoundException('Wallet not found for this user');
    }

    return wallet;
  }

  async findOne(walletId: string): Promise<WalletDocument> {
    const wallet = await this.walletModel
      .findById(walletId)
      .populate('user')
      .exec();

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  async update(
    walletId: string,
    updateWalletDto: UpdateWalletDto,
  ): Promise<WalletDocument> {
    const wallet = await this.walletModel.findById(walletId).exec();

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    Object.assign(wallet, updateWalletDto);
    wallet.lastActivity = new Date();

    return wallet.save();
  }

  async remove(walletId: string): Promise<void> {
    const result = await this.walletModel.findByIdAndDelete(walletId).exec();

    if (!result) {
      throw new NotFoundException('Wallet not found');
    }
  }

  async creditBalance(
    userId: string,
    amount: number,
    description?: string,
    session?: ClientSession,
  ): Promise<WalletDocument> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const wallet = await this.findByUser(userId);

    if (wallet.frozen) {
      throw new BadRequestException('Wallet is frozen');
    }

    wallet.balance += amount;
    wallet.totalDeposited += amount;
    wallet.lastActivity = new Date();

    await wallet.save({ session });

    await this.transactionsService.createTransaction(
      userId,
      'deposit',
      amount,
      'wallet',
      'wallet',
      description || `Wallet deposit: ${amount} USDT`,
      undefined,
      session,
    );

    return wallet;
  }

  async debitBalance(
    userId: string,
    amount: number,
    description?: string,
    session?: ClientSession,
  ): Promise<WalletDocument> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const wallet = await this.findByUser(userId);

    if (wallet.frozen) {
      throw new BadRequestException('Wallet is frozen');
    }

    if (wallet.balance < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    wallet.balance -= amount;
    wallet.totalWithdrawn += amount;
    wallet.lastActivity = new Date();

    await wallet.save({ session });

    await this.transactionsService.createTransaction(
      userId,
      'withdrawal',
      amount,
      'wallet',
      'wallet',
      description || `Wallet withdrawal: ${amount} USDT`,
      undefined,
      session,
    );

    return wallet;
  }

  async freezeWallet(
    userId: string,
    reason: string,
    frozenBy?: string,
  ): Promise<WalletDocument> {
    const wallet = await this.findByUser(userId);

    if (wallet.frozen) {
      throw new ConflictException('Wallet is already frozen');
    }

    wallet.frozen = true;
    wallet.frozenAt = new Date();
    wallet.freezeReason = reason;
    wallet.frozenBy = frozenBy ? new Types.ObjectId(frozenBy) : undefined;
    wallet.lastActivity = new Date();

    return wallet.save();
  }

  async unfreezeWallet(userId: string): Promise<WalletDocument> {
    const wallet = await this.findByUser(userId);

    if (!wallet.frozen) {
      throw new ConflictException('Wallet is not frozen');
    }

    wallet.frozen = false;
    wallet.frozenAt = undefined;
    wallet.freezeReason = undefined;
    wallet.frozenBy = undefined;
    wallet.lastActivity = new Date();

    return wallet.save();
  }

  async getBalance(userId: string): Promise<{ balance: number }> {
    const wallet = await this.findByUser(userId);

    return {
      balance: wallet.balance,
    };
  }

  async walletExists(userId: string): Promise<boolean> {
    const wallet = await this.walletModel
      .findOne({ user: new Types.ObjectId(userId) })
      .exec();
    return !!wallet;
  }

  // Trade wallet integration methods

  async fundTradeWallet(
    userId: string,
    amount: number,
    session?: ClientSession,
  ): Promise<{ transaction: any; wallet: WalletDocument }> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const sessionToUse = session || (await this.walletModel.db.startSession());

    if (!session) {
      sessionToUse.startTransaction();
    }

    try {
      // Get user's main wallet
      const wallet = await this.walletModel
        .findOne({ user: new Types.ObjectId(userId) })
        .session(sessionToUse);

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      if (wallet.frozen) {
        throw new BadRequestException('Wallet is frozen');
      }

      // Check if user has sufficient balance
      if (wallet.balance < amount) {
        throw new BadRequestException('Insufficient balance in main wallet');
      }

      // Check if user has active investments (withdrawal restriction)
      const activeInvestments = await this.userInvestmentModel
        .countDocuments({
          user: new Types.ObjectId(userId),
          status: 'active',
        })
        .session(sessionToUse);

      if (activeInvestments > 0) {
        throw new BadRequestException(
          'Cannot fund trade wallet while having active investments',
        );
      }

      // Create transaction record
      const reference = `TW_${uuidv4().replace(/-/g, '').toUpperCase()}`;
      const transaction = await this.transactionsService.createTransaction(
        userId,
        'wallet_to_trade',
        amount,
        'wallet',
        'trade_wallet',
        `Funding trade wallet with ${amount} USDT`,
        reference,
        sessionToUse,
      );

      // Update balances
      wallet.balance -= amount;
      wallet.tradeWalletBalance += amount;
      wallet.lastActivity = new Date();

      await wallet.save({ session: sessionToUse });

      if (!session) {
        await sessionToUse.commitTransaction();
      }

      return { transaction, wallet };
    } catch (error) {
      if (!session) {
        await sessionToUse.abortTransaction();
        await sessionToUse.endSession();
      }
      throw error;
    } finally {
      if (!session) {
        sessionToUse.endSession();
      }
    }
  }

  async getTradeBalance(userId: string): Promise<{
    balance: number;
    currency: string;
    status: string;
    hasActiveInvestments: boolean;
  }> {
    const wallet = await this.findByUser(userId);

    // Check for active investments
    const activeInvestments = await this.checkActiveInvestments(userId);

    // Update hasActiveInvestments flag if needed
    if (wallet.hasActiveInvestments !== activeInvestments) {
      wallet.hasActiveInvestments = activeInvestments;
      await wallet.save();
    }

    return {
      balance: wallet.tradeWalletBalance,
      currency: wallet.currency,
      status: wallet.status,
      hasActiveInvestments: wallet.hasActiveInvestments,
    };
  }

  async updateTradeBalance(
    userId: string,
    amount: number,
    session?: ClientSession,
  ): Promise<WalletDocument> {
    const wallet = await this.walletModel
      .findOne({ user: new Types.ObjectId(userId) })
      .session(session || null);

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (wallet.frozen) {
      throw new BadRequestException('Wallet is frozen');
    }

    wallet.tradeWalletBalance += amount;

    // Ensure balance doesn't go negative
    if (wallet.tradeWalletBalance < 0) {
      throw new BadRequestException('Insufficient balance in trade wallet');
    }

    wallet.lastActivity = new Date();

    return wallet.save({ session });
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
    await this.walletModel.updateOne(
      { user: new Types.ObjectId(userId) },
      { hasActiveInvestments },
    );
  }

  async getBalances(userId: string): Promise<{
    mainBalance: number;
    tradeBalance: number;
    currency: string;
    status: string;
    hasActiveInvestments: boolean;
  }> {
    const wallet = await this.findByUser(userId);
    const activeInvestments = await this.checkActiveInvestments(userId);

    // Update hasActiveInvestments flag if needed
    if (wallet.hasActiveInvestments !== activeInvestments) {
      wallet.hasActiveInvestments = activeInvestments;
      await wallet.save();
    }

    return {
      mainBalance: wallet.balance,
      tradeBalance: wallet.tradeWalletBalance,
      currency: wallet.currency,
      status: wallet.status,
      hasActiveInvestments: wallet.hasActiveInvestments,
    };
  }
}
