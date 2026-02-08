import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
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
import { AdminSettingsService } from './admin-settings.service';
import { PlatformFeesDto } from './dto/platform-fees.dto';
import { RoiRulesDto } from './dto/roi-rules.dto';
import { InvestmentLimitsDto } from './dto/investment-limits.dto';
import { SystemSettingsUpdateDto } from './dto/system-settings.dto';

@ApiTags('Admin Fees, ROI & Configuration Settings')
@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminSettingsController {
  constructor(private readonly adminSettingsService: AdminSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all system settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved' })
  async getAllSettings() {
    const data = await this.adminSettingsService.getAllSettings();
    return { success: true, data };
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get setting by key' })
  @ApiParam({ name: 'key', description: 'Setting key' })
  @ApiResponse({ status: 200, description: 'Setting retrieved' })
  async getByKey(@Param('key') key: string) {
    const data = await this.adminSettingsService.getByKey(key);
    return { success: true, data };
  }

  @Put('platform-fees')
  @ApiOperation({ summary: 'Update platform fees' })
  @ApiResponse({ status: 200, description: 'Platform fees updated' })
  async updatePlatformFees(@Body() dto: PlatformFeesDto) {
    return this.adminSettingsService.upsertPlatformFees(dto);
  }

  @Put('roi-rules')
  @ApiOperation({ summary: 'Update ROI rules' })
  @ApiResponse({ status: 200, description: 'ROI rules updated' })
  async updateRoiRules(@Body() dto: RoiRulesDto) {
    return this.adminSettingsService.upsertRoiRules(dto);
  }

  @Put('investment-limits')
  @ApiOperation({ summary: 'Update investment limits' })
  @ApiResponse({ status: 200, description: 'Investment limits updated' })
  async updateInvestmentLimits(@Body() dto: InvestmentLimitsDto) {
    return this.adminSettingsService.upsertInvestmentLimits(dto);
  }

  @Post()
  @ApiOperation({ summary: 'Create or update any system setting' })
  @ApiResponse({ status: 200, description: 'System setting updated' })
  async upsertSystemSetting(@Body() dto: SystemSettingsUpdateDto) {
    return this.adminSettingsService.upsertSystemSetting(dto);
  }
}
