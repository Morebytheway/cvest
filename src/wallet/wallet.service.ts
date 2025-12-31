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
import { CurrencyService } from '../common/services/currency.service';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet.name)
    private walletModel: Model<WalletDocument>,
    private transactionsService: TransactionsService,
    private currencyService: CurrencyService,
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
      usdtBalance: 0,
      currency: 'NGN',
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
    currency: string = 'NGN',
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

    let usdtAmount = amount;
    if (currency !== 'USDT') {
      usdtAmount = await this.currencyService.convertNgnToUsdt(amount);
    }

    wallet.balance += amount;
    wallet.usdtBalance += usdtAmount;
    wallet.totalDeposited += amount;
    wallet.lastActivity = new Date();

    await wallet.save({ session });

    await this.transactionsService.createTransaction(
      userId,
      'deposit',
      usdtAmount,
      'wallet',
      'wallet',
      description || `Wallet deposit: ${amount} ${currency}`,
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

    const usdtAmount = await this.currencyService.convertNgnToUsdt(amount);

    wallet.balance -= amount;
    wallet.usdtBalance -= usdtAmount;
    wallet.totalWithdrawn += amount;
    wallet.lastActivity = new Date();

    await wallet.save({ session });

    await this.transactionsService.createTransaction(
      userId,
      'withdrawal',
      usdtAmount,
      'wallet',
      'wallet',
      description || `Wallet withdrawal: ${amount} NGN`,
      undefined,
      session,
    );

    return wallet;
  }

  async creditUSDTBalance(
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

    wallet.usdtBalance += amount;
    wallet.lastActivity = new Date();

    await wallet.save({ session });

    await this.transactionsService.createTransaction(
      userId,
      'deposit',
      amount,
      'wallet',
      'wallet',
      description || `USDT wallet deposit: ${amount} USDT`,
      undefined,
      session,
    );

    return wallet;
  }

  async debitUSDTBalance(
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

    if (wallet.usdtBalance < amount) {
      throw new BadRequestException('Insufficient USDT balance');
    }

    wallet.usdtBalance -= amount;
    wallet.lastActivity = new Date();

    await wallet.save({ session });

    await this.transactionsService.createTransaction(
      userId,
      'withdrawal',
      amount,
      'wallet',
      'wallet',
      description || `USDT wallet withdrawal: ${amount} USDT`,
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

  async getBalance(
    userId: string,
  ): Promise<{ balance: number; usdtBalance: number; currency: string }> {
    const wallet = await this.findByUser(userId);

    return {
      balance: wallet.balance,
      usdtBalance: wallet.usdtBalance,
      currency: wallet.currency,
    };
  }

  async walletExists(userId: string): Promise<boolean> {
    const wallet = await this.walletModel
      .findOne({ user: new Types.ObjectId(userId) })
      .exec();
    return !!wallet;
  }
}
