import {
  Controller,
  Param,
  Get,
  Post,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/roles.enum';
import { AdminAuditService } from './admin-audit.service';

interface AuthenticatedRequest {
  user: { userId: string; email: string; role: string };
}

@ApiTags('Admin Audit')
@Controller('admin/audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminAuditController {
  constructor(private readonly adminAuditService: AdminAuditService) {}

  @Get('logs')
  @ApiOperation({ summary: 'Get audit trail logs' })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
  })
  @ApiQuery({ name: 'adminId', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'resource', required: false })
  @ApiQuery({ name: 'severity', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAuditTrail(
    @Query() query: any,
    @Request() req: AuthenticatedRequest,
  ) {
    const result = await this.adminAuditService.getAuditTrail(query);
    return {
      success: true,
      message: 'Audit logs retrieved successfully',
      ...result,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get admin audit summary' })
  @ApiResponse({
    status: 200,
    description: 'Audit statistics retrieved successfully',
  })
  @ApiQuery({ name: 'adminId', required: false })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getAuditStats(@Query() query: any) {
    const stats = await this.adminAuditService.getAdminAuditSummary(
      query.adminId,
      query.days,
    );
    return {
      success: true,
      message: 'Audit statistics retrieved successfully',
      data: stats,
    };
  }

  @Get('compliance-report')
  @ApiOperation({ summary: 'Generate compliance report' })
  @ApiResponse({
    status: 200,
    description: 'Compliance report generated successfully',
  })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getComplianceReport(@Query('days') days?: number) {
    const report = await this.adminAuditService.generateComplianceReport(days);
    return {
      success: true,
      message: 'Compliance report generated successfully',
      data: report,
    };
  }

  @Post('clear-logs')
  @ApiOperation({ summary: 'Clear old audit logs' })
  @ApiResponse({ status: 200, description: 'Audit logs cleared successfully' })
  @ApiQuery({ name: 'daysToKeep', required: false, type: Number })
  async clearAuditLogs(@Query('daysToKeep') daysToKeep?: number) {
    const result = await this.adminAuditService.clearAuditLogs(daysToKeep);
    return {
      success: true,
      message: 'Audit logs cleared successfully',
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific audit log entry' })
  @ApiResponse({
    status: 200,
    description: 'Audit entry retrieved successfully',
  })
  async getAuditEntry(@Param('id') id: string) {
    const audit = await this.adminAuditService.getAuditEntry(id);
    return {
      success: true,
      message: 'Audit entry retrieved successfully',
      data: audit,
    };
  }
}
