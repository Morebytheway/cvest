import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SystemSettings,
  SystemSettingsDocument,
} from './schemas/system-settings.schema';
import { PlatformFeesDto } from './dto/platform-fees.dto';
import { RoiRulesDto } from './dto/roi-rules.dto';
import { InvestmentLimitsDto } from './dto/investment-limits.dto';
import { SystemSettingsUpdateDto } from './dto/system-settings.dto';

@Injectable()
export class AdminSettingsService {
  constructor(
    @InjectModel(SystemSettings.name)
    private systemSettingsModel: Model<SystemSettingsDocument>,
  ) {}

  async getByKey(key: string) {
    const doc = await this.systemSettingsModel.findOne({ key }).lean();
    if (!doc) throw new NotFoundException(`Setting "${key}" not found`);
    return doc;
  }

  async getAllSettings() {
    const list = await this.systemSettingsModel.find().lean();
    return list.reduce((acc, { key, value, description }) => {
      acc[key] = { value, description };
      return acc;
    }, {} as Record<string, { value: Record<string, unknown>; description?: string }>);
  }

  async upsertPlatformFees(dto: PlatformFeesDto) {
    const value = { ...dto };
    await this.systemSettingsModel.findOneAndUpdate(
      { key: 'platform_fees' },
      { key: 'platform_fees', value, description: 'Platform fees configuration' },
      { upsert: true, new: true },
    );
    return { success: true, message: 'Platform fees updated' };
  }

  async upsertRoiRules(dto: RoiRulesDto) {
    const value = { ...dto };
    await this.systemSettingsModel.findOneAndUpdate(
      { key: 'roi_rules' },
      { key: 'roi_rules', value, description: 'ROI rules configuration' },
      { upsert: true, new: true },
    );
    return { success: true, message: 'ROI rules updated' };
  }

  async upsertInvestmentLimits(dto: InvestmentLimitsDto) {
    const value = { ...dto };
    await this.systemSettingsModel.findOneAndUpdate(
      { key: 'investment_limits' },
      {
        key: 'investment_limits',
        value,
        description: 'Investment limits configuration',
      },
      { upsert: true, new: true },
    );
    return { success: true, message: 'Investment limits updated' };
  }

  async upsertSystemSetting(dto: SystemSettingsUpdateDto) {
    await this.systemSettingsModel.findOneAndUpdate(
      { key: dto.key },
      {
        key: dto.key,
        value: dto.value,
        description: dto.description,
      },
      { upsert: true, new: true },
    );
    return { success: true, message: 'System setting updated' };
  }
}
