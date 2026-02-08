import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Investment,
  InvestmentDocument,
} from '../../investments/schemas/investment.schema';

@Injectable()
export class InvestmentSeedsService {
  private readonly logger = new Logger(InvestmentSeedsService.name);

  constructor(
    @InjectModel(Investment.name)
    private investmentModel: Model<InvestmentDocument>,
  ) {}

  async seedInvestmentPlans(): Promise<void> {
    this.logger.log('Seeding investment plans...');

    const investmentPlans = [
      {
        name: 'Conservative 10%',
        rate: 10,
        durationDays: 14,
        minAmount: 500,
        maxAmount: 10000,
        status: 'active',
        description:
          'Low-risk investment plan with 10% return after 14 days. Minimum investment: $500 USDT.',
      },
      {
        name: 'Balanced 15%',
        rate: 15,
        durationDays: 14,
        minAmount: 500,
        maxAmount: 25000,
        status: 'active',
        description:
          'Medium-risk investment plan with 15% return after 14 days. Minimum investment: $500 USDT.',
      },
      {
        name: 'Aggressive 20%',
        rate: 20,
        durationDays: 14,
        minAmount: 500,
        maxAmount: 50000,
        status: 'active',
        description:
          'High-risk investment plan with 20% return after 14 days. Minimum investment: $500 USDT.',
      },
    ];

    try {
      // Check if investment plans already exist
      const existingPlans = await this.investmentModel.countDocuments();

      if (existingPlans > 0) {
        this.logger.log(
          `${existingPlans} investment plans already exist. Skipping seeding.`,
        );
        return;
      }

      // Insert investment plans
      const insertedPlans =
        await this.investmentModel.insertMany(investmentPlans);

      this.logger.log(
        `Successfully seeded ${insertedPlans.length} investment plans:`,
      );
      insertedPlans.forEach((plan) => {
        this.logger.log(
          `- ${plan.name}: ${plan.rate}% return, $${plan.minAmount} minimum`,
        );
      });
    } catch (error) {
      this.logger.error(`Failed to seed investment plans: ${error.message}`);
      throw error;
    }
  }

  async clearInvestmentPlans(): Promise<void> {
    this.logger.log('Clearing all investment plans...');

    try {
      const result = await this.investmentModel.deleteMany({});
      this.logger.log(`Deleted ${result.deletedCount} investment plans`);
    } catch (error) {
      this.logger.error(`Failed to clear investment plans: ${error.message}`);
      throw error;
    }
  }

  async getInvestmentPlansCount(): Promise<number> {
    return this.investmentModel.countDocuments();
  }

  async getAllInvestmentPlans(): Promise<InvestmentDocument[]> {
    return this.investmentModel.find().sort({ rate: 1 });
  }
}
