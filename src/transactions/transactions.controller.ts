import {
  Controller,
  Get,
  UseGuards,
  Request,
  Query,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TransactionsService } from './transactions.service';
import { GetTransactionsDto } from './dto/get-transactions.dto';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@ApiTags('Transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user transactions' })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully',
  })
  async getTransactions(
    @Request() req: AuthenticatedRequest,
    @Query() queryDto: GetTransactionsDto,
  ) {
    const transactions = await this.transactionsService.getUserTransactions(
      req.user.userId,
      queryDto,
    );

    return {
      success: true,
      data: transactions,
    };
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get transaction summary' })
  @ApiResponse({
    status: 200,
    description: 'Transaction summary retrieved successfully',
  })
  async getTransactionSummary(@Request() req: AuthenticatedRequest) {
    const summary = await this.transactionsService.getTransactionSummary(
      req.user.userId,
    );

    return {
      success: true,
      data: summary,
    };
  }

  @Get(':reference')
  @ApiOperation({ summary: 'Get transaction by reference' })
  @ApiResponse({
    status: 200,
    description: 'Transaction retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async getTransactionByReference(@Param('reference') reference: string) {
    const transaction =
      await this.transactionsService.getTransactionByReference(reference);

    return {
      success: true,
      data: transaction,
    };
  }

  @Get('type/:type')
  @ApiOperation({ summary: 'Get transactions by type' })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully',
  })
  async getTransactionsByType(
    @Request() req: AuthenticatedRequest,
    @Param('type') type: string,
  ) {
    const transactions = await this.transactionsService.getTransactionsByType(
      req.user.userId,
      type,
    );

    return {
      success: true,
      data: transactions,
    };
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get transactions by status' })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully',
  })
  async getTransactionsByStatus(
    @Request() req: AuthenticatedRequest,
    @Param('status') status: string,
  ) {
    const transactions = await this.transactionsService.getTransactionsByStatus(
      req.user.userId,
      status,
    );

    return {
      success: true,
      data: transactions,
    };
  }
}
