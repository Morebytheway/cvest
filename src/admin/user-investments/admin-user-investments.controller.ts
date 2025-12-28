import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
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
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/roles.enum';
import { AdminUserInvestmentsService } from './admin-user-investments.service';
import { UserInvestmentQueryDto } from './dto/user-investment-query.dto';
import { ProfitAdjustmentDto } from './dto/profit-adjustment.dto';
import { FreezeInvestmentDto } from './dto/freeze-investment.dto';

interface AuthenticatedRequest {
  user: {
    id: string;
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
  @ApiOperation({ summary: 'Get all user investments with filters' })
  @ApiResponse({
    status: 200,
    description: 'User investments retrieved successfully',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'completed', 'cancelled'],
  })
  @ApiQuery({
    name: 'riskFlag',
    required: false,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
  })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'investmentId', required: false })
  @ApiQuery({ name: 'isFrozen', required: false, type: Boolean })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'minAmount', required: false, type: Number })
  @ApiQuery({ name: 'maxAmount', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async getAllUserInvestments(@Query() query: UserInvestmentQueryDto) {
    const result =
      await this.adminUserInvestmentsService.getAllUserInvestments(query);

    return {
      success: true,
      message: 'User investments retrieved successfully',
      ...result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific user investment by ID' })
  @ApiResponse({
    status: 200,
    description: 'User investment retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'User investment not found' })
  @ApiParam({ name: 'id', description: 'User investment ID' })
  async getUserInvestmentById(@Param('id') id: string) {
    const investment =
      await this.adminUserInvestmentsService.getUserInvestmentById(id);

    return {
      success: true,
      message: 'User investment retrieved successfully',
      data: investment,
    };
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user investment history' })
  @ApiResponse({
    status: 200,
    description: 'User investment history retrieved successfully',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async getUserInvestmentHistory(@Param('userId') userId: string) {
    const investments =
      await this.adminUserInvestmentsService.getUserInvestmentHistory(userId);

    return {
      success: true,
      message: 'User investment history retrieved successfully',
      data: investments,
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
        req.user.id,
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
      req.user.id,
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
        req.user.id,
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
        req.user.id,
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
        req.user.id,
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
        req.user.id,
      );

    return {
      success: true,
      message: 'Action validation completed',
      data: validation,
    };
  }
}
