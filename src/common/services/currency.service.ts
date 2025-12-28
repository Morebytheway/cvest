import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wallet, WalletDocument } from '../../wallet/schema/wallet.schema';

@Injectable()
export class CurrencyService {
  private readonly USDT_TO_NGN_RATE = 750; // Example rate: 1 USDT = 750 NGN

  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
  ) {}

  async convertNgnToUsdt(ngnAmount: number): Promise<number> {
    // Convert NGN to USDT
    return ngnAmount / this.USDT_TO_NGN_RATE;
  }

  async convertUsdtToNgn(usdtAmount: number): Promise<number> {
    // Convert USDT to NGN
    return usdtAmount * this.USDT_TO_NGN_RATE;
  }

  async addUsdtToWallet(
    userId: string,
    usdtAmount: number,
  ): Promise<WalletDocument> {
    const wallet = await this.walletModel.findOne({ user: userId });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Add USDT balance
    wallet.usdtBalance = (wallet.usdtBalance || 0) + usdtAmount;

    return wallet.save();
  }

  async deductUsdtFromWallet(
    userId: string,
    usdtAmount: number,
  ): Promise<WalletDocument> {
    const wallet = await this.walletModel.findOne({ user: userId });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    if ((wallet.usdtBalance || 0) < usdtAmount) {
      throw new Error('Insufficient USDT balance');
    }

    // Deduct USDT balance
    wallet.usdtBalance = (wallet.usdtBalance || 0) - usdtAmount;

    return wallet.save();
  }

  async getWalletBalances(userId: string): Promise<{
    ngnBalance: number;
    usdtBalance: number;
    totalInNgn: number;
    totalInUsdt: number;
  }> {
    const wallet = await this.walletModel.findOne({ user: userId });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const ngnBalance = wallet.balance || 0;
    const usdtBalance = wallet.usdtBalance || 0;

    const totalInUsdt = ngnBalance / this.USDT_TO_NGN_RATE + usdtBalance;
    const totalInNgn = ngnBalance + usdtBalance * this.USDT_TO_NGN_RATE;

    return {
      ngnBalance,
      usdtBalance,
      totalInNgn,
      totalInUsdt,
    };
  }

  getCurrentRate(): number {
    return this.USDT_TO_NGN_RATE;
  }

  // For future implementation with real-time rates
  async getRealTimeRate(): Promise<number> {
    // TODO: Implement API call to get real-time USDT/NGN rate
    // For now, return the fixed rate
    return this.USDT_TO_NGN_RATE;
  }
}
