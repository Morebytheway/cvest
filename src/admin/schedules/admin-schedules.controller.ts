import {
  Controller,
  Get,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/roles.enum';
import { AdminSchedulesService } from './admin-schedules.service';

@ApiTags('Admin Schedules')
@Controller('admin/schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminSchedulesController {
  constructor(private readonly adminSchedulesService: AdminSchedulesService) {}

  @Post('process-matured-investments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process all matured investments manually' })
  @ApiResponse({
    status: 200,
    description: 'Matured investments processed successfully',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async processMaturedInvestments() {
    const result = await this.adminSchedulesService.processMaturedInvestments();

    return {
      success: true,
      message: 'Matured investments processed successfully',
      data: result,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get investment maturity statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getInvestmentStats() {
    const stats = await this.adminSchedulesService.getInvestmentStats();

    return {
      success: true,
      message: 'Investment statistics retrieved successfully',
      data: stats,
    };
  }
}
