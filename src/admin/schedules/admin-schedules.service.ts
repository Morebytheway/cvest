import { Injectable, Logger } from '@nestjs/common';
import { InvestmentProfitService } from '../../schedules/investment-profit.service';

@Injectable()
export class AdminSchedulesService {
  private readonly logger = new Logger(AdminSchedulesService.name);

  constructor(
    private readonly investmentProfitService: InvestmentProfitService,
  ) {}

  async processMaturedInvestments(): Promise<{
    processed: number;
    failed: number;
  }> {
    this.logger.log('Admin triggered processing of matured investments...');

    return await this.investmentProfitService.processMaturedInvestmentsManually();
  }

  async getInvestmentStats(): Promise<{
    totalActiveInvestments: number;
    maturedButNotCredited: number;
    maturedButNotPrincipalReturned: number;
    dueInNext24Hours: number;
    totalProfitPending: number;
    totalPrincipalPending: number;
  }> {
    return await this.investmentProfitService.getInvestmentStats();
  }
}
