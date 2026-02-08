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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WalletService } from './wallet.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { BalanceAdjustmentDto } from './dto/balance-adjustment.dto';
import { FreezeWalletDto } from './dto/freeze-wallet.dto';
import { WithdrawTradeDto } from './dto/withdraw-trade.dto';
import { IsNumber, IsPositive, Min } from 'class-validator';

class FundTradeWalletDto {
  @IsNumber()
  @IsPositive()
  @Min(1)
  amount: number;
}

interface AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

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
    return this.walletService.creditBalance(
      req.user.userId,
      balanceDto.amount,
      balanceDto.description,
    );
  }

  @Post('debit')
  async debitBalance(@Body() balanceDto: BalanceAdjustmentDto, @Request() req) {
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

  // Trade wallet endpoints

  @Post('fund-trade')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fund trade wallet from main wallet' })
  @ApiResponse({ status: 200, description: 'Trade wallet funded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async fundTradeWallet(
    @Request() req: AuthenticatedRequest,
    @Body() fundDto: FundTradeWalletDto,
  ) {
    const result = await this.walletService.fundTradeWallet(
      req.user.userId,
      fundDto.amount,
    );

    return {
      success: true,
      message: 'Trade wallet funded successfully',
      data: {
        transaction: result.transaction,
        wallet: {
          balance: result.wallet.balance,
          tradeBalance: result.wallet.tradeWalletBalance,
          currency: result.wallet.currency,
          status: result.wallet.status,
          hasActiveInvestments: result.wallet.hasActiveInvestments,
        },
      },
    };
  }

  @Get('trade-balance')
  @ApiOperation({ summary: 'Get trade wallet balance' })
  @ApiResponse({
    status: 200,
    description: 'Trade wallet balance retrieved successfully',
  })
  async getTradeBalance(@Request() req: AuthenticatedRequest) {
    console.log(req.user);
    // 695548b9980c17b0b5a4c635
    const balance = await this.walletService.getTradeBalance(req.user.userId);

    return {
      success: true,
      data: balance,
    };
  }

  @Get('balances')
  @ApiOperation({ summary: 'Get both main and trade wallet balances' })
  @ApiResponse({
    status: 200,
    description: 'Balances retrieved successfully',
  })
  async getBalances(@Request() req: AuthenticatedRequest) {
    const balances = await this.walletService.getBalances(req.user.userId);

    return {
      success: true,
      data: balances,
    };
  }

  @Post('withdraw-trade')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Withdraw funds from trade wallet to main wallet' })
  @ApiResponse({
    status: 200,
    description: 'Trade wallet withdrawn successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async withdrawTradeWallet(
    @Request() req: AuthenticatedRequest,
    @Body() withdrawDto: WithdrawTradeDto,
  ) {
    const result = await this.walletService.withdrawTradeWallet(
      req.user.userId,
      withdrawDto.amount,
      withdrawDto.description,
    );

    return {
      success: true,
      message: 'Trade wallet withdrawn successfully',
      data: {
        transaction: result.transaction,
        wallet: {
          balance: result.wallet.balance,
          tradeBalance: result.wallet.tradeWalletBalance,
          currency: result.wallet.currency,
          status: result.wallet.status,
          hasActiveInvestments: result.wallet.hasActiveInvestments,
        },
      },
    };
  }

  @Get('trade-transactions')
  @ApiOperation({ summary: 'Get trade wallet transactions' })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully',
  })
  async getTradeWalletTransactions(@Request() req: AuthenticatedRequest) {
    const transactions =
      await this.walletService.transactionsService.getTransactionsByType(
        req.user.userId,
        'wallet_to_trade',
      );

    return {
      success: true,
      data: transactions,
    };
  }
}
