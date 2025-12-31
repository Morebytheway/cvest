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
import { AdminInvestmentsService } from './admin-investments.service';
import { CreateInvestmentPlanDto } from './dto/create-investment-plan.dto';
import { UpdateInvestmentPlanDto } from './dto/update-investment-plan.dto';
import { InvestmentPlanQueryDto } from './dto/investment-plan-query.dto';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@ApiTags('Admin Investment Plans')
@Controller('admin/investments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminInvestmentsController {
  constructor(
    private readonly adminInvestmentsService: AdminInvestmentsService,
  ) {}

  @Post('plans')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new investment plan' })
  @ApiResponse({
    status: 201,
    description: 'Investment plan created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Plan already exists' })
  async createInvestmentPlan(
    @Body() createDto: CreateInvestmentPlanDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const investmentPlan =
      await this.adminInvestmentsService.createInvestmentPlan(
        createDto,
        req.user.userId,
      );

    return {
      success: true,
      message: 'Investment plan created successfully',
      data: investmentPlan,
    };
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get all investment plans' })
  @ApiResponse({
    status: 200,
    description: 'Investment plans retrieved successfully',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'inactive', 'archived'],
  })
  @ApiQuery({
    name: 'visibility',
    required: false,
    enum: ['public', 'private', 'archived'],
  })
  @ApiQuery({
    name: 'riskLevel',
    required: false,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
  })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async getAllInvestmentPlans(@Query() query: InvestmentPlanQueryDto) {
    const result =
      await this.adminInvestmentsService.getAllInvestmentPlans(query);

    return {
      success: true,
      message: 'Investment plans retrieved successfully',
      ...result,
    };
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Get specific investment plan' })
  @ApiResponse({
    status: 200,
    description: 'Investment plan retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Investment plan not found' })
  @ApiParam({ name: 'id', description: 'Investment plan ID' })
  async getInvestmentPlanById(@Param('id') id: string) {
    const investmentPlan =
      await this.adminInvestmentsService.getInvestmentPlanById(id);

    return {
      success: true,
      message: 'Investment plan retrieved successfully',
      data: investmentPlan,
    };
  }

  @Get('plans/:id/stats')
  @ApiOperation({ summary: 'Get investment plan statistics' })
  @ApiResponse({
    status: 200,
    description: 'Investment plan statistics retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Investment plan not found' })
  @ApiParam({ name: 'id', description: 'Investment plan ID' })
  async getInvestmentPlanStats(@Param('id') id: string) {
    const result =
      await this.adminInvestmentsService.getInvestmentPlanStats(id);

    return {
      success: true,
      message: 'Investment plan statistics retrieved successfully',
      ...result,
    };
  }

  @Patch('plans/:id')
  @ApiOperation({ summary: 'Update investment plan' })
  @ApiResponse({
    status: 200,
    description: 'Investment plan updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Investment plan not found' })
  @ApiParam({ name: 'id', description: 'Investment plan ID' })
  async updateInvestmentPlan(
    @Param('id') id: string,
    @Body() updateDto: UpdateInvestmentPlanDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const updatedPlan = await this.adminInvestmentsService.updateInvestmentPlan(
      id,
      updateDto,
      req.user.userId,
    );

    return {
      success: true,
      message: 'Investment plan updated successfully',
      data: updatedPlan,
    };
  }

  @Patch('plans/:id/toggle')
  @ApiOperation({ summary: 'Toggle investment plan status (active/inactive)' })
  @ApiResponse({
    status: 200,
    description: 'Investment plan status toggled successfully',
  })
  @ApiResponse({ status: 404, description: 'Investment plan not found' })
  @ApiParam({ name: 'id', description: 'Investment plan ID' })
  async toggleInvestmentPlan(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const updatedPlan = await this.adminInvestmentsService.toggleInvestmentPlan(
      id,
      req.user.userId,
    );

    return {
      success: true,
      message: `Investment plan ${updatedPlan.status} successfully`,
      data: updatedPlan,
    };
  }

  @Patch('plans/:id/archive')
  @ApiOperation({ summary: 'Archive investment plan' })
  @ApiResponse({
    status: 200,
    description: 'Investment plan archived successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot archive plan with active investments',
  })
  @ApiResponse({ status: 404, description: 'Investment plan not found' })
  @ApiParam({ name: 'id', description: 'Investment plan ID' })
  async archiveInvestmentPlan(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const archivedPlan = await this.adminInvestmentsService.archiveOldPlan(
      id,
      req.user.userId,
    );

    return {
      success: true,
      message: 'Investment plan archived successfully',
      data: archivedPlan,
    };
  }

  @Delete('plans/:id')
  @ApiOperation({ summary: 'Delete investment plan' })
  @ApiResponse({
    status: 200,
    description: 'Investment plan deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete plan with user investments',
  })
  @ApiResponse({ status: 404, description: 'Investment plan not found' })
  @ApiParam({ name: 'id', description: 'Investment plan ID' })
  async deleteInvestmentPlan(@Param('id') id: string) {
    await this.adminInvestmentsService.deleteInvestmentPlan(id);

    return {
      success: true,
      message: 'Investment plan deleted successfully',
    };
  }

  @Patch('plans/:id/stats')
  @ApiOperation({ summary: 'Update investment plan statistics' })
  @ApiResponse({
    status: 200,
    description: 'Investment plan statistics updated successfully',
  })
  @ApiParam({ name: 'id', description: 'Investment plan ID' })
  async updatePlanStats(@Param('id') id: string) {
    await this.adminInvestmentsService.updatePlanStats(id);

    return {
      success: true,
      message: 'Investment plan statistics updated successfully',
    };
  }
}
