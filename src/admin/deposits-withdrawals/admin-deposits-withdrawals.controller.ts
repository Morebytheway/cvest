import {
  Controller,
  Get,
  Post,
  Patch,
  Query,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/roles.enum';
import { AdminDepositsWithdrawalsService } from './admin-deposits-withdrawals.service';
import { DepositsWithdrawalsQueryDto } from './dto/deposits-withdrawals-query.dto';
import { ApproveRejectWithdrawalDto } from './dto/approve-reject-withdrawal.dto';
import { ManualPayoutDto } from './dto/manual-payout.dto';
import { ReconciliationQueryDto } from './dto/reconciliation.dto';

@ApiTags('Admin Deposits & Withdrawals')
@Controller('admin/deposits-withdrawals')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminDepositsWithdrawalsController {
  constructor(
    private readonly adminDepositsWithdrawalsService: AdminDepositsWithdrawalsService,
  ) {}

  @Get('deposits')
  @ApiOperation({ summary: 'View deposits' })
  @ApiResponse({ status: 200, description: 'Deposits retrieved successfully' })
  async getDeposits(@Query() query: DepositsWithdrawalsQueryDto) {
    const result = await this.adminDepositsWithdrawalsService.getDeposits(query);
    return { success: true, message: 'Deposits retrieved', ...result };
  }

  @Get('withdrawals')
  @ApiOperation({ summary: 'View withdrawals' })
  @ApiResponse({ status: 200, description: 'Withdrawals retrieved successfully' })
  async getWithdrawals(@Query() query: DepositsWithdrawalsQueryDto) {
    const result = await this.adminDepositsWithdrawalsService.getWithdrawals(query);
    return { success: true, message: 'Withdrawals retrieved', ...result };
  }

  @Patch('withdrawals/:transactionId/approve-reject')
  @ApiOperation({ summary: 'Approve or reject withdrawal' })
  @ApiParam({ name: 'transactionId', description: 'Transaction ID' })
  @ApiResponse({ status: 200, description: 'Withdrawal action applied' })
  async approveOrRejectWithdrawal(
    @Param('transactionId') transactionId: string,
    @Body() dto: ApproveRejectWithdrawalDto,
  ) {
    return this.adminDepositsWithdrawalsService.approveOrRejectWithdrawal(
      transactionId,
      dto,
    );
  }

  @Post('manual-payout')
  @ApiOperation({ summary: 'Manual payout to user' })
  @ApiResponse({ status: 201, description: 'Manual payout recorded' })
  async manualPayout(@Body() dto: ManualPayoutDto) {
    return this.adminDepositsWithdrawalsService.manualPayout(dto);
  }

  @Get('reconciliation')
  @ApiOperation({ summary: 'Transaction reconciliation' })
  @ApiResponse({ status: 200, description: 'Reconciliation summary' })
  async reconciliation(@Query() query: ReconciliationQueryDto) {
    const result =
      await this.adminDepositsWithdrawalsService.reconciliation(query);
    return { success: true, data: result };
  }
}
