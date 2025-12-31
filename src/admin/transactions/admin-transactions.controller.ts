import {
  Controller,
  Get,
  Post,
  Patch,
  Query,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/roles.enum';
import { AdminTransactionsService } from './admin-transactions.service';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { TransactionReversalDto } from './dto/transaction-reversal.dto';
import { ManualTransactionDto } from './dto/manual-transaction.dto';

interface AuthenticatedRequest {
  user: { userId: string; email: string; role: string };
}

@ApiTags('Admin Transactions')
@Controller('admin/transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminTransactionsController {
  constructor(
    private readonly adminTransactionsService: AdminTransactionsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all transactions with filters' })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully',
  })
  async getAllTransactions(@Query() query: TransactionQueryDto) {
    const result =
      await this.adminTransactionsService.getAllTransactions(query);
    return {
      success: true,
      message: 'Transactions retrieved successfully',
      ...result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific transaction by ID' })
  @ApiResponse({
    status: 200,
    description: 'Transaction retrieved successfully',
  })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  async getTransactionById(@Param('id') id: string) {
    const transaction =
      await this.adminTransactionsService.getTransactionById(id);
    return {
      success: true,
      message: 'Transaction retrieved successfully',
      data: transaction,
    };
  }

  @Get('failed')
  @ApiOperation({ summary: 'Get all failed transactions' })
  @ApiResponse({
    status: 200,
    description: 'Failed transactions retrieved successfully',
  })
  async getFailedTransactions() {
    const transactions =
      await this.adminTransactionsService.getFailedTransactions();
    return {
      success: true,
      message: 'Failed transactions retrieved successfully',
      data: transactions,
    };
  }

  @Patch(':id/reverse')
  @ApiOperation({ summary: 'Reverse a transaction' })
  @ApiResponse({
    status: 200,
    description: 'Transaction reversed successfully',
  })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  async reverseTransaction(
    @Param('id') id: string,
    @Body() reversalDto: TransactionReversalDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const transaction = await this.adminTransactionsService.reverseTransaction(
      id,
      reversalDto.reversalReason,
      req.user.userId,
    );
    return {
      success: true,
      message: 'Transaction reversed successfully',
      data: transaction,
    };
  }

  @Post('manual')
  @ApiOperation({ summary: 'Create manual transaction' })
  @ApiResponse({
    status: 201,
    description: 'Manual transaction created successfully',
  })
  async createManualTransaction(
    @Body() manualDto: ManualTransactionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const transaction =
      await this.adminTransactionsService.createManualTransaction(
        manualDto,
        req.user.userId,
      );
    return {
      success: true,
      message: 'Manual transaction created successfully',
      data: transaction,
    };
  }

  @Patch(':id/retry')
  @ApiOperation({ summary: 'Retry failed transaction' })
  @ApiResponse({
    status: 200,
    description: 'Transaction retry initiated successfully',
  })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  async retryTransaction(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const transaction = await this.adminTransactionsService.reverseTransaction(
      id,
      'Admin retry',
      req.user.userId,
    );
    return {
      success: true,
      message: 'Transaction retry initiated successfully',
      data: transaction,
    };
  }
}
