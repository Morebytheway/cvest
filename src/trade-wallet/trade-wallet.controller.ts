import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TradeWalletService } from './trade-wallet.service';
import { TransactionsService } from '../transactions/transactions.service';
import { FundTradeWalletDto } from './dto/fund-trade-wallet.dto';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@ApiTags('Trade Wallet')
@Controller('trade-wallet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TradeWalletController {
  constructor(
    private readonly tradeWalletService: TradeWalletService,
    private readonly transactionsService: TransactionsService,
  ) {}

  @Post('fund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fund trade wallet from main wallet' })
  @ApiResponse({ status: 200, description: 'Trade wallet funded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Main wallet not found' })
  async fundTradeWallet(
    @Request() req: AuthenticatedRequest,
    @Body() fundDto: FundTradeWalletDto,
  ) {
    const result = await this.tradeWalletService.fundTradeWallet(
      req.user.userId,
      fundDto,
    );

    return {
      success: true,
      message: 'Trade wallet funded successfully',
      data: {
        transaction: result.transaction,
        tradeWallet: {
          balance: result.tradeWallet.balance,
          currency: result.tradeWallet.currency,
          status: result.tradeWallet.status,
          hasActiveInvestments: result.tradeWallet.hasActiveInvestments,
        },
      },
    };
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get trade wallet balance' })
  @ApiResponse({
    status: 200,
    description: 'Trade wallet balance retrieved successfully',
  })
  async getBalance(@Request() req: AuthenticatedRequest) {
    const balance = await this.tradeWalletService.getBalance(req.user.userId);

    return {
      success: true,
      data: balance,
    };
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get trade wallet transactions' })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully',
  })
  async getTradeWalletTransactions(@Request() req: AuthenticatedRequest) {
    const transactions = await this.transactionsService.getTransactionsByType(
      req.user.userId,
      'wallet_to_trade',
    );

    return {
      success: true,
      data: transactions,
    };
  }
}
