import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DailyReport,
  DailyReportDocument,
} from './schemas/daily-report.schema';
import {
  UserInvestment,
  UserInvestmentDocument,
} from '../../investments/schemas/user-investment.schema';
import {
  Investment,
  InvestmentDocument,
} from '../../investments/schemas/investment.schema';
import { User, UserDocument } from '../../users/schemas/user.schema';
import {
  Transaction,
  TransactionDocument,
} from '../../transactions/schemas/transaction.schema';
import { InvestmentsService } from '../../investments/investments.service';

@Injectable()
export class DailyReportService {
  private readonly logger = new Logger(DailyReportService.name);

  constructor(
    @InjectModel(DailyReport.name)
    private dailyReportModel: Model<DailyReportDocument>,
    @InjectModel(UserInvestment.name)
    private userInvestmentModel: Model<UserInvestmentDocument>,
    @InjectModel(Investment.name)
    private investmentModel: Model<InvestmentDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    private readonly investmentsService: InvestmentsService,
  ) {}

  // Run every day at 1 AM
  @Cron('0 1 * * *')
  async generateDailyReport(): Promise<DailyReportDocument> {
    this.logger.log('Starting daily report generation...');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reportDate = yesterday;

    try {
      // Check if report already exists for this date
      const existingReport = await this.dailyReportModel.findOne({
        date: reportDate,
      });
      if (existingReport) {
        this.logger.log(
          `Daily report for ${reportDate.toISOString().split('T')[0]} already exists`,
        );
        return existingReport;
      }

      // Generate report data
      const reportData = await this.calculateDailyMetrics(yesterday, today);

      const dailyReport = new this.dailyReportModel({
        date: reportDate,
        ...reportData,
      });

      const savedReport = await dailyReport.save();

      this.logger.log(
        `Daily report generated successfully for ${reportDate.toISOString().split('T')[0]}`,
      );
      return savedReport;
    } catch (error) {
      this.logger.error(`Failed to generate daily report: ${error.message}`);
      throw error;
    }
  }

  private async calculateDailyMetrics(startDate: Date, endDate: Date) {
    // Get daily investment metrics
    const [
      totalInvestedStats,
      newInvestmentsCount,
      completedInvestmentsCount,
      investmentStatusBreakdown,
      planBreakdown,
    ] = await Promise.all([
      this.userInvestmentModel.aggregate([
        { $match: { createdAt: { $gte: startDate, $lt: endDate } } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
      this.userInvestmentModel.countDocuments({
        createdAt: { $gte: startDate, $lt: endDate },
      }),
      this.userInvestmentModel.countDocuments({
        updatedAt: { $gte: startDate, $lt: endDate },
        status: 'completed',
      }),
      this.userInvestmentModel.aggregate([
        { $match: { createdAt: { $gte: startDate, $lt: endDate } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.userInvestmentModel.aggregate([
        { $match: { createdAt: { $gte: startDate, $lt: endDate } } },
        {
          $lookup: {
            from: 'investments',
            localField: 'investment',
            foreignField: '_id',
            as: 'investmentDetails',
          },
        },
        { $unwind: '$investmentDetails' },
        {
          $group: {
            _id: '$investmentDetails.name',
            count: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    // Get profit metrics
    const profitStats = await this.userInvestmentModel.aggregate([
      {
        $match: {
          updatedAt: { $gte: startDate, $lt: endDate },
          isProfitCredited: true,
        },
      },
      { $group: { _id: null, totalProfit: { $sum: '$actualProfit' } } },
    ]);

    // Get user metrics
    const [totalUsers, activeUsers, newUsers] = await Promise.all([
      this.userModel.countDocuments(),
      this.userInvestmentModel
        .distinct('user', { status: 'active' })
        .then((users) => users.length),
      this.userModel.countDocuments({
        createdAt: { $gte: startDate, $lt: endDate },
      }),
    ]);

    // Get transaction metrics
    const [
      totalTransactions,
      successfulTransactions,
      failedTransactions,
      pendingTransactions,
    ] = await Promise.all([
      this.transactionModel.countDocuments({
        createdAt: { $gte: startDate, $lt: endDate },
      }),
      this.transactionModel.countDocuments({
        createdAt: { $gte: startDate, $lt: endDate },
        status: 'completed',
      }),
      this.transactionModel.countDocuments({
        createdAt: { $gte: startDate, $lt: endDate },
        status: 'failed',
      }),
      this.transactionModel.countDocuments({
        createdAt: { $gte: startDate, $lt: endDate },
        status: 'pending',
      }),
    ]);

    // Calculate additional metrics
    const averageInvestmentAmount =
      totalInvestedStats[0]?.count > 0
        ? totalInvestedStats[0]?.totalAmount / totalInvestedStats[0]?.count
        : 0;

    const averageProfitAmount =
      completedInvestmentsCount > 0 && profitStats[0]?.totalProfit > 0
        ? profitStats[0]?.totalProfit / completedInvestmentsCount
        : 0;

    const roiPercentage =
      totalInvestedStats[0]?.totalAmount > 0 && profitStats[0]?.totalProfit > 0
        ? (profitStats[0]?.totalProfit / totalInvestedStats[0]?.totalAmount) *
          100
        : 0;

    // Get total investments counts
    const [activeInvestments, completedInvestmentsTotal, cancelledInvestments] =
      await Promise.all([
        this.userInvestmentModel.countDocuments({ status: 'active' }),
        this.userInvestmentModel.countDocuments({ status: 'completed' }),
        this.userInvestmentModel.countDocuments({ status: 'cancelled' }),
      ]);

    // Get frozen investments count
    const frozenInvestments = await this.userInvestmentModel.countDocuments({
      isFrozen: true,
    });

    // Get revenue (profit + any fees if applicable)
    const totalRevenue = profitStats[0]?.totalProfit || 0;

    // Create plan breakdown map
    const planBreakdownMap = new Map<string, number>();
    planBreakdown.forEach((item) => {
      planBreakdownMap.set(item._id, item.count);
    });

    // Create status breakdown map
    const statusBreakdownMap = new Map<string, number>();
    investmentStatusBreakdown.forEach((item) => {
      statusBreakdownMap.set(item._id, item.count);
    });

    return {
      totalInvested: totalInvestedStats[0]?.totalAmount || 0,
      totalProfit: profitStats[0]?.totalProfit || 0,
      newInvestments: newInvestmentsCount,
      completedInvestments: completedInvestmentsCount,
      activeUsers,
      totalUsers,
      failedTransactions,
      pendingTransactions,
      planBreakdown: planBreakdownMap,
      investmentStatusBreakdown: statusBreakdownMap,
      metrics: {
        averageInvestmentAmount,
        averageProfitAmount,
        roiPercentage,
        newUsers,
        activeInvestments,
        completedInvestments: completedInvestmentsTotal,
        cancelledInvestments,
        frozenInvestments,
        totalTransactions,
        successfulTransactions,
        totalRevenue,
      },
    };
  }

  async getDailyReport(date?: string): Promise<DailyReportDocument> {
    const reportDate = date ? new Date(date) : new Date();
    reportDate.setHours(0, 0, 0, 0);

    const report = await this.dailyReportModel.findOne({ date: reportDate });

    if (!report) {
      throw new Error(
        `Daily report not found for ${reportDate.toISOString().split('T')[0]}`,
      );
    }

    return report;
  }

  async getDailyReports(
    dateFrom?: string,
    dateTo?: string,
  ): Promise<DailyReportDocument[]> {
    const query: any = {};

    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }

    return this.dailyReportModel.find(query).sort({ date: -1 }).exec();
  }

  async getWeeklySummary(): Promise<any> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const reports = await this.dailyReportModel
      .find({ date: { $gte: oneWeekAgo } })
      .sort({ date: -1 })
      .exec();

    if (reports.length === 0) {
      return { message: 'No data available for the past week' };
    }

    const summary = reports.reduce(
      (acc, report) => {
        return {
          totalInvested: acc.totalInvested + report.totalInvested,
          totalProfit: acc.totalProfit + report.totalProfit,
          newInvestments: acc.newInvestments + report.newInvestments,
          completedInvestments:
            acc.completedInvestments + report.completedInvestments,
          failedTransactions:
            acc.failedTransactions + report.failedTransactions,
          pendingTransactions:
            acc.pendingTransactions + report.pendingTransactions,
        };
      },
      {
        totalInvested: 0,
        totalProfit: 0,
        newInvestments: 0,
        completedInvestments: 0,
        failedTransactions: 0,
        pendingTransactions: 0,
      },
    );

    return {
      period: 'Last 7 days',
      reportsCount: reports.length,
      ...summary,
      dailyAverage: {
        invested: summary.totalInvested / reports.length,
        profit: summary.totalProfit / reports.length,
        newInvestments: summary.newInvestments / reports.length,
      },
    };
  }

  async regenerateReport(date: string): Promise<DailyReportDocument> {
    const reportDate = new Date(date);
    reportDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(reportDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Delete existing report
    await this.dailyReportModel.deleteOne({ date: reportDate });

    // Generate new report
    const reportData = await this.calculateDailyMetrics(reportDate, nextDay);

    const dailyReport = new this.dailyReportModel({
      date: reportDate,
      ...reportData,
    });

    return dailyReport.save();
  }
}
