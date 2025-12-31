import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Request,
  Param,
  Body,
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
import { AdminAnalyticsService } from './admin-analytics.service';
import { DailyReportService } from './daily-report.service';
import { DateRangeDto } from './dto/date-range.dto';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { ReportGenerationDto } from './dto/report-generation.dto';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@ApiTags('Admin Analytics')
@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminAnalyticsController {
  constructor(
    private readonly adminAnalyticsService: AdminAnalyticsService,
    private readonly dailyReportService: DailyReportService,
  ) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get financial overview' })
  @ApiResponse({
    status: 200,
    description: 'Financial overview retrieved successfully',
  })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  async getFinancialOverview(@Query() query: DateRangeDto) {
    const overview =
      await this.adminAnalyticsService.getFinancialOverview(query);

    return {
      success: true,
      message: 'Financial overview retrieved successfully',
      data: overview,
    };
  }

  @Get('investments')
  @ApiOperation({ summary: 'Get investment analytics' })
  @ApiResponse({
    status: 200,
    description: 'Investment analytics retrieved successfully',
  })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  async getInvestmentAnalytics(@Query() query: DateRangeDto) {
    const analytics =
      await this.adminAnalyticsService.getInvestmentAnalytics(query);

    return {
      success: true,
      message: 'Investment analytics retrieved successfully',
      data: analytics,
    };
  }

  @Get('profits')
  @ApiOperation({ summary: 'Get profit analytics' })
  @ApiResponse({
    status: 200,
    description: 'Profit analytics retrieved successfully',
  })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  async getProfitAnalytics(@Query() query: DateRangeDto) {
    const analytics =
      await this.adminAnalyticsService.getProfitAnalytics(query);

    return {
      success: true,
      message: 'Profit analytics retrieved successfully',
      data: analytics,
    };
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue analytics' })
  @ApiResponse({
    status: 200,
    description: 'Revenue analytics retrieved successfully',
  })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  async getRevenueAnalytics(@Query() query: DateRangeDto) {
    const analytics =
      await this.adminAnalyticsService.getRevenueAnalytics(query);

    return {
      success: true,
      message: 'Revenue analytics retrieved successfully',
      data: analytics,
    };
  }

  @Get('user-behavior')
  @ApiOperation({ summary: 'Get user behavior analytics' })
  @ApiResponse({
    status: 200,
    description: 'User behavior analytics retrieved successfully',
  })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  async getUserBehaviorAnalytics(@Query() query: DateRangeDto) {
    const analytics =
      await this.adminAnalyticsService.getUserBehaviorAnalytics(query);

    return {
      success: true,
      message: 'User behavior analytics retrieved successfully',
      data: analytics,
    };
  }

  @Get('plan-performance')
  @ApiOperation({ summary: 'Get investment plan performance comparison' })
  @ApiResponse({
    status: 200,
    description: 'Plan performance analytics retrieved successfully',
  })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  async getPlanPerformance(@Query() query: DateRangeDto) {
    const performance =
      await this.adminAnalyticsService.getPlanPerformance(query);

    return {
      success: true,
      message: 'Plan performance analytics retrieved successfully',
      data: performance,
    };
  }

  @Get('cash-flow')
  @ApiOperation({ summary: 'Get cash flow projections' })
  @ApiResponse({
    status: 200,
    description: 'Cash flow projections retrieved successfully',
  })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getCashFlowProjections(@Query('days') days?: number) {
    const projections = await this.adminAnalyticsService.getCashFlowProjections(
      days || 30,
    );

    return {
      success: true,
      message: 'Cash flow projections retrieved successfully',
      data: projections,
    };
  }

  @Get('risk-exposure')
  @ApiOperation({ summary: 'Get risk exposure metrics' })
  @ApiResponse({
    status: 200,
    description: 'Risk exposure metrics retrieved successfully',
  })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  async getRiskExposure(@Query() query: DateRangeDto) {
    const riskMetrics =
      await this.adminAnalyticsService.getRiskExposureMetrics(query);

    return {
      success: true,
      message: 'Risk exposure metrics retrieved successfully',
      data: riskMetrics,
    };
  }

  @Get('daily-report/:date')
  @ApiOperation({ summary: 'Get daily financial report' })
  @ApiResponse({
    status: 200,
    description: 'Daily report retrieved successfully',
  })
  @ApiQuery({ name: 'date', required: false })
  async getDailyReport(@Param('date') date?: string) {
    const report = await this.dailyReportService.getDailyReport(date);

    return {
      success: true,
      message: 'Daily report retrieved successfully',
      data: report,
    };
  }

  @Get('daily-reports')
  @ApiOperation({ summary: 'Get daily reports for date range' })
  @ApiResponse({
    status: 200,
    description: 'Daily reports retrieved successfully',
  })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  async getDailyReports(
    @Query() query: { dateFrom?: string; dateTo?: string },
  ) {
    const reports = await this.dailyReportService.getDailyReports(
      query.dateFrom,
      query.dateTo,
    );

    return {
      success: true,
      message: 'Daily reports retrieved successfully',
      data: reports,
    };
  }

  @Get('weekly-summary')
  @ApiOperation({ summary: 'Get weekly summary' })
  @ApiResponse({
    status: 200,
    description: 'Weekly summary retrieved successfully',
  })
  async getWeeklySummary() {
    const summary = await this.dailyReportService.getWeeklySummary();

    return {
      success: true,
      message: 'Weekly summary retrieved successfully',
      data: summary,
    };
  }

  @Post('reports/generate')
  @ApiOperation({ summary: 'Generate custom report' })
  @ApiResponse({
    status: 201,
    description: 'Report generated successfully',
  })
  async generateReport(@Body() reportDto: ReportGenerationDto) {
    // For now, return a placeholder implementation
    const reportData = {
      reportType: reportDto.reportType,
      dateFrom: reportDto.dateFrom,
      dateTo: reportDto.dateTo,
      format: reportDto.format,
      generatedAt: new Date().toISOString(),
      status: 'generated',
      downloadUrl: `/api/admin/reports/download/${Date.now()}`,
    };

    return {
      success: true,
      message: 'Report generated successfully',
      data: reportData,
    };
  }

  @Post('reports/export-csv')
  @ApiOperation({ summary: 'Export data as CSV' })
  @ApiResponse({
    status: 200,
    description: 'Data exported successfully',
  })
  async exportCSV(@Body() query: AnalyticsQueryDto) {
    const csvData = await this.adminAnalyticsService.generateCSVReport(query);

    return {
      success: true,
      message: 'Data exported successfully',
      data: csvData,
    };
  }

  @Post('daily-report/regenerate/:date')
  @ApiOperation({ summary: 'Regenerate daily report for specific date' })
  @ApiResponse({
    status: 200,
    description: 'Daily report regenerated successfully',
  })
  @ApiQuery({ name: 'date', required: true })
  async regenerateReport(@Param('date') date: string) {
    const report = await this.dailyReportService.regenerateReport(date);

    return {
      success: true,
      message: 'Daily report regenerated successfully',
      data: report,
    };
  }
}
