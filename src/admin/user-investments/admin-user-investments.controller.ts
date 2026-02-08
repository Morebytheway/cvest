import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Role } from '../../auth/roles.enum';
import { AdminUserInvestmentsService } from './admin-user-investments.service';
import { FreezeInvestmentDto } from './dto/freeze-investment.dto';
import { ProfitAdjustmentDto } from './dto/profit-adjustment.dto';
import { UserInvestmentQueryDto } from './dto/user-investment-query.dto';
import { InvestmentPlanQueryDto } from './dto/investment-plan-query.dto';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@ApiTags('Admin User Investments')
@Controller('admin/user-investments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminUserInvestmentsController {
  constructor(
    private readonly adminUserInvestmentsService: AdminUserInvestmentsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get all user investments with filters',
    description:
      'List user investments with optional filters. Use query params: status, riskFlag, userId, investmentId, isFrozen, dateFrom, dateTo, minAmount, maxAmount, page, limit, sortBy, sortOrder. Example values are in the schema.',
  })
  @ApiResponse({
    status: 200,
    description: 'User investments retrieved successfully',
  })
  async getAllUserInvestments(@Query() query: UserInvestmentQueryDto) {
    const result =
      await this.adminUserInvestmentsService.getAllUserInvestments(query);

    return {
      success: true,
      message: 'User investments retrieved successfully',
      ...result,
    };
  }

  @Get('plans')
  @ApiOperation({
    summary: 'Get all investment plans (simplified)',
    description:
      'List investment plans with reduced parameters: status, page, limit. Use example values to proceed.',
  })
  @ApiResponse({
    status: 200,
    description: 'Investment plans retrieved successfully',
  })
  async getAllInvestmentPlans(@Query() query: InvestmentPlanQueryDto) {
    const result =
      await this.adminUserInvestmentsService.getAllInvestmentPlans(query);

    return {
      success: true,
      message: 'Investment plans retrieved successfully',
      ...result,
    };
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get user investment history',
    description: 'Get all investments for a user by userId.',
  })
  @ApiResponse({
    status: 200,
    description: 'User investment history retrieved successfully',
  })
  @ApiParam({ name: 'userId', description: 'User ID', example: '507f1f77bcf86cd799439011' })
  async getUserInvestmentHistory(@Param('userId') userId: string) {
    const investments =
      await this.adminUserInvestmentsService.getUserInvestmentHistory(userId);

    return {
      success: true,
      message: 'User investment history retrieved successfully',
      data: investments,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific user investment by ID' })
  @ApiResponse({
    status: 200,
    description: 'User investment retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'User investment not found' })
  @ApiParam({ name: 'id', description: 'User investment ID', example: '507f1f77bcf86cd799439013' })
  async getUserInvestmentById(@Param('id') id: string) {
    const investment =
      await this.adminUserInvestmentsService.getUserInvestmentById(id);

    return {
      success: true,
      message: 'User investment retrieved successfully',
      data: investment,
    };
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Manually complete an investment' })
  @ApiResponse({
    status: 200,
    description: 'Investment completed successfully',
  })
  @ApiResponse({ status: 400, description: 'Cannot complete investment' })
  @ApiResponse({ status: 404, description: 'User investment not found' })
  @ApiParam({ name: 'id', description: 'User investment ID' })
  async completeInvestmentManually(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const investment =
      await this.adminUserInvestmentsService.completeInvestmentManually(
        id,
        req.user.userId,
      );

    return {
      success: true,
      message: 'Investment completed successfully',
      data: investment,
    };
  }

  @Patch(':id/freeze')
  @ApiOperation({ summary: 'Freeze a user investment' })
  @ApiResponse({
    status: 200,
    description: 'Investment frozen successfully',
  })
  @ApiResponse({ status: 400, description: 'Cannot freeze investment' })
  @ApiResponse({ status: 404, description: 'User investment not found' })
  @ApiParam({ name: 'id', description: 'User investment ID' })
  async freezeInvestment(
    @Param('id') id: string,
    @Body() freezeDto: FreezeInvestmentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const investment = await this.adminUserInvestmentsService.freezeInvestment(
      id,
      freezeDto,
      req.user.userId,
    );

    return {
      success: true,
      message: 'Investment frozen successfully',
      data: investment,
    };
  }

  @Patch(':id/unfreeze')
  @ApiOperation({ summary: 'Unfreeze a user investment' })
  @ApiResponse({
    status: 200,
    description: 'Investment unfrozen successfully',
  })
  @ApiResponse({ status: 400, description: 'Cannot unfreeze investment' })
  @ApiResponse({ status: 404, description: 'User investment not found' })
  @ApiParam({ name: 'id', description: 'User investment ID' })
  async unfreezeInvestment(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const investment =
      await this.adminUserInvestmentsService.unfreezeInvestment(
        id,
        req.user.userId,
      );

    return {
      success: true,
      message: 'Investment unfrozen successfully',
      data: investment,
    };
  }

  @Patch(':id/terminate')
  @ApiOperation({ summary: 'Emergency termination of investment' })
  @ApiResponse({
    status: 200,
    description: 'Investment terminated successfully',
  })
  @ApiResponse({ status: 400, description: 'Cannot terminate investment' })
  @ApiResponse({ status: 404, description: 'User investment not found' })
  @ApiParam({ name: 'id', description: 'User investment ID' })
  async terminateInvestment(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Request() req: AuthenticatedRequest,
  ) {
    const investment =
      await this.adminUserInvestmentsService.terminateInvestment(
        id,
        req.user.userId,
        body.reason,
      );

    return {
      success: true,
      message: 'Investment terminated successfully',
      data: investment,
    };
  }

  @Post(':id/adjust-profit')
  @ApiOperation({ summary: 'Adjust profit amount for completed investment' })
  @ApiResponse({
    status: 200,
    description: 'Profit adjusted successfully',
  })
  @ApiResponse({ status: 400, description: 'Cannot adjust profit' })
  @ApiResponse({ status: 404, description: 'User investment not found' })
  @ApiParam({ name: 'id', description: 'User investment ID' })
  async adjustInvestmentProfit(
    @Param('id') id: string,
    @Body() adjustmentDto: ProfitAdjustmentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const investment =
      await this.adminUserInvestmentsService.adjustInvestmentProfit(
        id,
        adjustmentDto,
        req.user.userId,
      );

    return {
      success: true,
      message: 'Profit adjusted successfully',
      data: investment,
    };
  }

  @Post('export')
  @ApiOperation({ summary: 'Export investment data with filters' })
  @ApiResponse({
    status: 200,
    description: 'Investment data exported successfully',
  })
  async exportInvestmentData(@Body() query: UserInvestmentQueryDto) {
    const result =
      await this.adminUserInvestmentsService.generateInvestmentReport(query);

    return {
      success: true,
      message: 'Investment data exported successfully',
      ...result,
    };
  }

  @Post(':id/validate-action')
  @ApiOperation({
    summary: 'Validate if an investment action can be performed',
  })
  @ApiResponse({
    status: 200,
    description: 'Action validation completed',
  })
  @ApiResponse({ status: 404, description: 'User investment not found' })
  @ApiParam({ name: 'id', description: 'User investment ID' })
  async validateInvestmentAction(
    @Param('id') id: string,
    @Body() body: { action: string },
    @Request() req: AuthenticatedRequest,
  ) {
    const validation =
      await this.adminUserInvestmentsService.validateInvestmentAction(
        id,
        body.action,
        req.user.userId,
      );

    return {
      success: true,
      message: 'Action validation completed',
      data: validation,
    };
  }
}
