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
import { AdminWalletsService } from './admin-wallets.service';
import { WalletQueryDto } from './dto/wallet-query.dto';
import { BalanceAdjustmentDto } from './dto/balance-adjustment.dto';
import { WalletFreezeDto } from './dto/wallet-freeze.dto';
import { ManualAdjustmentDto } from './dto/manual-adjustment.dto';

interface AuthenticatedRequest {
  user: { userId: string; email: string; role: string };
}

@ApiTags('Admin Wallets')
@Controller('admin/wallets')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminWalletsController {
  constructor(private readonly adminWalletsService: AdminWalletsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all user wallets',
    description: 'List all wallets with optional filters. Use query params for userId, status, frozen, minBalance, maxBalance, page, limit.',
  })
  @ApiResponse({ status: 200, description: 'Wallets retrieved successfully' })
  async getAllWallets(@Query() query: WalletQueryDto) {
    const result = await this.adminWalletsService.getAllWallets(query);
    return {
      success: true,
      message: 'Wallets retrieved successfully',
      ...result,
    };
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'View specific user wallet by userId',
    description: 'Get a single user’s wallet by their user ID. Returns balance, trade balance, status, frozen state.',
  })
  @ApiResponse({
    status: 200,
    description: 'User wallet retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Wallet not found for this user' })
  @ApiParam({ name: 'userId', description: 'User ID', example: '507f1f77bcf86cd799439011' })
  async getUserWallets(@Param('userId') userId: string) {
    const wallets = await this.adminWalletsService.getUserWallets(userId);
    return {
      success: true,
      message: 'User wallet retrieved successfully',
      data: wallets,
    };
  }

  @Patch('user/:userId/balance')
  @ApiOperation({
    summary: 'Adjust user wallet balance',
    description: 'Credit or debit a user’s wallet by userId. Use example body to proceed.',
  })
  @ApiResponse({ status: 200, description: 'Balance adjusted successfully' })
  @ApiParam({ name: 'userId', description: 'User ID', example: '507f1f77bcf86cd799439011' })
  async adjustWalletBalance(
    @Param('userId') userId: string,
    @Body() adjustmentDto: BalanceAdjustmentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const result = await this.adminWalletsService.adjustWalletBalance(
      userId,
      adjustmentDto,
      req.user.userId,
    );
    return {
      success: true,
      message: 'Balance adjusted successfully',
      data: result,
    };
  }

  @Patch('user/:userId/freeze')
  @ApiOperation({
    summary: 'Freeze user wallet by userId',
    description: 'Lock the user’s wallet so they cannot withdraw or transfer. Use example body to proceed.',
  })
  @ApiResponse({ status: 200, description: 'Wallet frozen successfully' })
  @ApiParam({ name: 'userId', description: 'User ID', example: '507f1f77bcf86cd799439011' })
  async freezeWallet(
    @Param('userId') userId: string,
    @Body() freezeDto: WalletFreezeDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const result = await this.adminWalletsService.freezeWallet(
      userId,
      freezeDto,
      req.user.userId,
    );
    return {
      success: true,
      message: 'Wallet frozen successfully',
      data: result,
    };
  }

  @Patch('user/:userId/unfreeze')
  @ApiOperation({ summary: 'Unfreeze user wallet' })
  @ApiResponse({ status: 200, description: 'Wallet unfrozen successfully' })
  @ApiParam({ name: 'userId', description: 'User ID', example: '507f1f77bcf86cd799439011' })
  async unfreezeWallet(
    @Param('userId') userId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const result = await this.adminWalletsService.unfreezeWallet(
      userId,
      req.user.userId,
    );
    return {
      success: true,
      message: 'Wallet unfrozen successfully',
      data: result,
    };
  }

  @Get('by-wallet/:walletId')
  @ApiOperation({
    summary: 'Get specific wallet by walletId',
    description: 'Fetch a single wallet by its MongoDB _id (walletId).',
  })
  @ApiResponse({ status: 200, description: 'Wallet retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  @ApiParam({ name: 'walletId', description: 'Wallet ID', example: '507f1f77bcf86cd799439012' })
  async getWalletById(@Param('walletId') walletId: string) {
    const data = await this.adminWalletsService.getWalletById(walletId);
    return {
      success: true,
      message: 'Wallet retrieved successfully',
      data,
    };
  }

  @Get('suspicious')
  @ApiOperation({ summary: 'Get suspicious activity reports' })
  @ApiResponse({
    status: 200,
    description: 'Suspicious activity retrieved successfully',
  })
  async getSuspiciousActivity() {
    const result = await this.adminWalletsService.detectSuspiciousActivity();
    return {
      success: true,
      message: 'Suspicious activity retrieved successfully',
      data: result,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get wallet statistics' })
  @ApiResponse({
    status: 200,
    description: 'Wallet statistics retrieved successfully',
  })
  async getWalletStats() {
    const stats = await this.adminWalletsService.getWalletStats();
    return {
      success: true,
      message: 'Wallet statistics retrieved successfully',
      data: stats,
    };
  }

  @Post('manual-adjustment')
  @ApiOperation({
    summary: 'Create manual balance adjustment',
    description: 'Adjust any user’s wallet by userId. Use the example body to proceed.',
  })
  @ApiResponse({
    status: 201,
    description: 'Manual adjustment created successfully',
  })
  async createManualAdjustment(
    @Body() adjustmentDto: ManualAdjustmentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const result = await this.adminWalletsService.createManualAdjustment(
      adjustmentDto,
      req.user.userId,
    );
    return {
      success: true,
      message: 'Manual adjustment created successfully',
      data: result,
    };
  }
}
