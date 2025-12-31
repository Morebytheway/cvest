import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WalletService } from './wallet.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { BalanceAdjustmentDto } from './dto/balance-adjustment.dto';
import { FreezeWalletDto } from './dto/freeze-wallet.dto';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post()
  async create(@Request() req) {
    return this.walletService.create(req.user.userId);
  }

  @Get()
  async findAll(@Request() req) {
    if (req.user.role === 'admin') {
      return this.walletService.findAll();
    }
    throw new Error('Admin access required');
  }

  @Get('my-wallet')
  async getMyWallet(@Request() req) {
    return this.walletService.findByUser(req.user.userId);
  }

  @Get('balance')
  async getBalance(@Request() req) {
    return this.walletService.getBalance(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    if (req.user.role === 'admin') {
      return this.walletService.findOne(id);
    }
    const wallet = await this.walletService.findByUser(req.user.userId);
    const walletId = (wallet._id as any).toString();
    if (walletId !== id) {
      throw new Error('Access denied');
    }
    return wallet;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateWalletDto: UpdateWalletDto,
    @Request() req,
  ) {
    if (req.user.role === 'admin') {
      return this.walletService.update(id, updateWalletDto);
    }
    const wallet = await this.walletService.findByUser(req.user.userId);
    const walletId = (wallet._id as any).toString();
    if (walletId !== id) {
      throw new Error('Access denied');
    }
    return this.walletService.update(id, updateWalletDto);
  }

  @Post('credit')
  async creditBalance(
    @Body() balanceDto: BalanceAdjustmentDto,
    @Request() req,
  ) {
    if (balanceDto.currency === 'USDT') {
      return this.walletService.creditUSDTBalance(
        req.user.userId,
        balanceDto.amount,
        balanceDto.description,
      );
    }
    return this.walletService.creditBalance(
      req.user.userId,
      balanceDto.amount,
      balanceDto.currency,
      balanceDto.description,
    );
  }

  @Post('debit')
  async debitBalance(@Body() balanceDto: BalanceAdjustmentDto, @Request() req) {
    if (balanceDto.currency === 'USDT') {
      return this.walletService.debitUSDTBalance(
        req.user.userId,
        balanceDto.amount,
        balanceDto.description,
      );
    }
    return this.walletService.debitBalance(
      req.user.userId,
      balanceDto.amount,
      balanceDto.description,
    );
  }

  @Post('freeze')
  async freezeWallet(@Body() freezeDto: FreezeWalletDto, @Request() req) {
    if (req.user.role !== 'admin') {
      throw new Error('Admin access required');
    }
    return this.walletService.freezeWallet(
      req.user.userId,
      freezeDto.reason,
      freezeDto.frozenBy || req.user.userId,
    );
  }

  @Post('unfreeze')
  async unfreezeWallet(@Request() req) {
    if (req.user.role !== 'admin') {
      throw new Error('Admin access required');
    }
    return this.walletService.unfreezeWallet(req.user.userId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    if (req.user.role === 'admin') {
      return this.walletService.remove(id);
    }
    throw new Error('Admin access required');
  }
}
