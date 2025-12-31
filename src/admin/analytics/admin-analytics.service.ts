import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
// Removed TradingWallet import - now using enhanced Wallet schema
import { DailyReportService } from './daily-report.service';
import { DateRangeDto } from './dto/date-range.dto';

@Injectable()
export class AdminAnalyticsService {
  constructor(
    @InjectModel(UserInvestment.name)
    private userInvestmentModel: Model<UserInvestmentDocument>,
    @InjectModel(Investment.name)
    private investmentModel: Model<InvestmentDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    // Removed TradingWallet injection - now using enhanced Wallet schema
    private readonly dailyReportService: DailyReportService,
  ) {}

  async getFinancialOverview(dateRange?: DateRangeDto): Promise<{
    totalInvested: number;
    totalProfit: number;
    activeInvestments: number;
    completedInvestments: number;
    totalUsers: number;
    activeUsers: number;
    totalRevenue: number;
    averageROI: number;
    portfolioValue: number;
  }> {
    const dateFilter = this.buildDateFilter(dateRange);

    const [
      investmentStats,
      userStats,
      transactionStats,
      activeInvestmentsCount,
    ] = await Promise.all([
      this.userInvestmentModel.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            totalInvested: { $sum: '$amount' },
            totalProfit: { $sum: '$actualProfit' },
            completedInvestments: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
            },
          },
        },
      ]),
      this.userModel.aggregate([
        { $group: { _id: null, totalUsers: { $sum: 1 } } },
      ]),
      this.transactionModel.aggregate([
        ...(dateFilter
          ? [{ $match: { ...dateFilter, status: 'completed' } }]
          : [{ $match: { status: 'completed' } }]),
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' },
          },
        },
      ]),
      this.userInvestmentModel.countDocuments({ status: 'active' }),
    ]);

    const activeUsers = await this.userInvestmentModel
      .distinct('user', { status: 'active' })
      .then((users) => users.length);

    const stats = investmentStats[0] || {
      totalInvested: 0,
      totalProfit: 0,
      completedInvestments: 0,
    };
    const userTotal = userStats[0]?.totalUsers || 0;
    const revenue = transactionStats[0]?.totalRevenue || 0;

    return {
      totalInvested: stats.totalInvested,
      totalProfit: stats.totalProfit,
      activeInvestments: activeInvestmentsCount,
      completedInvestments: stats.completedInvestments,
      totalUsers: userTotal,
      activeUsers,
      totalRevenue: revenue,
      averageROI:
        stats.totalInvested > 0
          ? (stats.totalProfit / stats.totalInvested) * 100
          : 0,
      portfolioValue: stats.totalInvested + stats.totalProfit,
    };
  }

  async getInvestmentAnalytics(dateRange?: DateRangeDto): Promise<{
    investmentStats: any;
    planPerformance: any[];
    investmentTrends: any[];
    riskDistribution: any;
  }> {
    const dateFilter = this.buildDateFilter(dateRange);

    const [investmentStats, planPerformance, riskDistribution] =
      await Promise.all([
        this.userInvestmentModel.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: null,
              totalInvestments: { $sum: 1 },
              totalAmount: { $sum: '$amount' },
              totalProfit: { $sum: '$actualProfit' },
              averageAmount: { $avg: '$amount' },
              averageProfit: { $avg: '$actualProfit' },
              activeCount: {
                $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
              },
              completedCount: {
                $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
              },
              cancelledCount: {
                $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
              },
            },
          },
        ]),
        this.userInvestmentModel.aggregate([
          { $match: dateFilter },
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
              planId: { $first: '$investmentDetails._id' },
              rate: { $first: '$investmentDetails.rate' },
              totalInvestments: { $sum: 1 },
              totalAmount: { $sum: '$amount' },
              totalProfit: { $sum: '$actualProfit' },
              averageAmount: { $avg: '$amount' },
              roi: {
                $avg: {
                  $cond: [
                    { $gt: ['$amount', 0] },
                    {
                      $multiply: [
                        { $divide: ['$actualProfit', '$amount'] },
                        100,
                      ],
                    },
                    0,
                  ],
                },
              },
            },
          },
          { $sort: { totalAmount: -1 } },
        ]),
        this.userInvestmentModel.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: '$riskFlag',
              count: { $sum: 1 },
              totalAmount: { $sum: '$amount' },
            },
          },
          { $sort: { count: -1 } },
        ]),
      ]);

    // Get investment trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const investmentTrends = await this.userInvestmentModel.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          amount: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return {
      investmentStats: investmentStats[0] || {},
      planPerformance,
      investmentTrends,
      riskDistribution,
    };
  }

  async getProfitAnalytics(dateRange?: DateRangeDto): Promise<{
    totalProfitPaid: number;
    profitByMonth: any[];
    profitByPlan: any[];
    averageProfitPerInvestment: number;
    profitGrowth: number;
  }> {
    const dateFilter = this.buildDateFilter(dateRange);

    const [profitStats, profitByMonth, profitByPlan] = await Promise.all([
      this.userInvestmentModel.aggregate([
        { $match: { ...dateFilter, isProfitCredited: true } },
        {
          $group: {
            _id: null,
            totalProfitPaid: { $sum: '$actualProfit' },
            investmentCount: { $sum: 1 },
            averageProfit: { $avg: '$actualProfit' },
          },
        },
      ]),
      this.userInvestmentModel.aggregate([
        { $match: { ...dateFilter, isProfitCredited: true } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m', date: '$profitCreditedAt' },
            },
            profit: { $sum: '$actualProfit' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      this.userInvestmentModel.aggregate([
        { $match: { ...dateFilter, isProfitCredited: true } },
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
            planId: { $first: '$investmentDetails._id' },
            profit: { $sum: '$actualProfit' },
            count: { $sum: 1 },
            rate: { $first: '$investmentDetails.rate' },
          },
        },
        { $sort: { profit: -1 } },
      ]),
    ]);

    // Calculate profit growth (compare with previous period)
    const profitGrowth = await this.calculateProfitGrowth(dateFilter);

    const stats = profitStats[0] || {
      totalProfitPaid: 0,
      investmentCount: 0,
      averageProfit: 0,
    };

    return {
      totalProfitPaid: stats.totalProfitPaid,
      profitByMonth,
      profitByPlan,
      averageProfitPerInvestment: stats.averageProfit || 0,
      profitGrowth,
    };
  }

  async getRevenueAnalytics(dateRange?: DateRangeDto): Promise<{
    totalRevenue: number;
    revenueByType: any[];
    revenueByDay: any[];
    monthlyRevenue: any[];
    revenueGrowth: number;
  }> {
    const dateFilter = this.buildDateFilter(dateRange);

    const [revenueStats, revenueByType, revenueByDay] = await Promise.all([
      this.transactionModel.aggregate([
        { $match: { ...dateFilter, status: 'completed' } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' },
            transactionCount: { $sum: 1 },
          },
        },
      ]),
      this.transactionModel.aggregate([
        { $match: { ...dateFilter, status: 'completed' } },
        {
          $group: {
            _id: '$type',
            amount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { amount: -1 } },
      ]),
      this.transactionModel.aggregate([
        { $match: { ...dateFilter, status: 'completed' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Get monthly revenue
    const monthlyRevenue = await this.transactionModel.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]);

    // Calculate revenue growth
    const revenueGrowth = await this.calculateRevenueGrowth(dateFilter);

    const stats = revenueStats[0] || { totalRevenue: 0, transactionCount: 0 };

    return {
      totalRevenue: stats.totalRevenue,
      revenueByType,
      revenueByDay,
      monthlyRevenue,
      revenueGrowth,
    };
  }

  async getUserBehaviorAnalytics(dateRange?: DateRangeDto): Promise<{
    userAcquisition: any[];
    userActivity: any;
    userSegments: any[];
    topInvestors: any[];
  }> {
    const dateFilter = this.buildDateFilter(dateRange);

    const [userAcquisition, userActivity, topInvestors] = await Promise.all([
      this.userModel.aggregate([
        { $match: dateFilter || {} },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            newUsers: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),
      this.userInvestmentModel.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            totalUsers: { $addToSet: '$user' },
            activeUsers: {
              $addToSet: {
                $cond: [{ $eq: ['$status', 'active'] }, '$user', null],
              },
            },
            totalInvestments: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $addFields: {
            totalUsers: { $size: '$totalUsers' },
            activeUsers: { $size: '$activeUsers' },
            averageInvestmentsPerUser: {
              $divide: ['$totalInvestments', { $size: '$totalUsers' }],
            },
            averageAmountPerUser: {
              $divide: ['$totalAmount', { $size: '$totalUsers' }],
            },
          },
        },
      ]),
      this.userInvestmentModel.aggregate([
        { $match: dateFilter },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'userDetails',
          },
        },
        { $unwind: '$userDetails' },
        {
          $group: {
            _id: '$user',
            name: { $first: '$userDetails.name' },
            email: { $first: '$userDetails.email' },
            totalInvestments: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            totalProfit: { $sum: '$actualProfit' },
            averageInvestment: { $avg: '$amount' },
          },
        },
        { $sort: { totalAmount: -1 } },
        { $limit: 10 },
      ]),
    ]);

    // Create user segments based on investment amount
    const userSegments = await this.userInvestmentModel.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$user',
          totalAmount: { $sum: '$amount' },
          investmentCount: { $sum: 1 },
        },
      },
      {
        $bucket: {
          groupBy: '$totalAmount',
          boundaries: [0, 500, 2000, 10000, Infinity],
          default: 'Other',
          output: {
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' },
          },
        },
      },
    ]);

    return {
      userAcquisition,
      userActivity: userActivity[0] || {},
      userSegments,
      topInvestors,
    };
  }

  async getPlanPerformance(dateRange?: DateRangeDto): Promise<{
    planComparison: any[];
    bestPerformingPlan: any;
    worstPerformingPlan: any;
    planUtilization: any[];
  }> {
    const dateFilter = this.buildDateFilter(dateRange);

    const [planComparison] = await Promise.all([
      this.userInvestmentModel.aggregate([
        { $match: dateFilter },
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
            planId: { $first: '$investmentDetails._id' },
            rate: { $first: '$investmentDetails.rate' },
            riskLevel: { $first: '$investmentDetails.riskLevel' },
            totalInvestments: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            totalProfit: { $sum: '$actualProfit' },
            averageAmount: { $avg: '$amount' },
            averageProfit: { $avg: '$actualProfit' },
            activeInvestments: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
            },
            completedInvestments: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
            },
            roi: {
              $avg: {
                $cond: [
                  { $gt: ['$amount', 0] },
                  {
                    $multiply: [{ $divide: ['$actualProfit', '$amount'] }, 100],
                  },
                  0,
                ],
              },
            },
          },
        },
        { $sort: { totalAmount: -1 } },
      ]),
    ]);

    const bestPerformingPlan = planComparison.reduce(
      (best, current) => (current.roi > (best?.roi || 0) ? current : best),
      null,
    );
    const worstPerformingPlan = planComparison.reduce(
      (worst, current) =>
        current.roi < (worst?.roi || Infinity) ? current : worst,
      null,
    );

    // Get plan utilization (how close to max users)
    const planUtilization = await this.investmentModel.aggregate([
      {
        $lookup: {
          from: 'userinvestments',
          localField: '_id',
          foreignField: 'investment',
          as: 'userInvestments',
        },
      },
      {
        $addFields: {
          currentUsers: { $size: '$userInvestments' },
          utilizationRate: {
            $cond: [
              { $gt: ['$maxActiveUsers', 0] },
              {
                $multiply: [
                  {
                    $divide: [{ $size: '$userInvestments' }, '$maxActiveUsers'],
                  },
                  100,
                ],
              },
              null,
            ],
          },
        },
      },
      {
        $project: {
          name: 1,
          rate: 1,
          maxActiveUsers: 1,
          currentUsers: 1,
          utilizationRate: 1,
        },
      },
    ]);

    return {
      planComparison,
      bestPerformingPlan,
      worstPerformingPlan,
      planUtilization,
    };
  }

  async getCashFlowProjections(days: number = 30): Promise<{
    projectedInflows: number;
    projectedOutflows: number;
    netCashFlow: number;
    dailyProjections: Array<{
      date: string;
      projectedInflow: number;
      projectedOutflow: number;
    }>;
  }> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    // Get investments maturing in the next 30 days
    const maturingInvestments = await this.userInvestmentModel.aggregate([
      { $match: { status: 'active', endDate: { $lte: futureDate } } },
      {
        $group: {
          _id: null,
          totalProfit: { $sum: '$expectedProfit' },
          totalPrincipal: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get projected new investments based on recent trends
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentInvestmentTrend = await this.userInvestmentModel.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: null,
          dailyAverage: { $avg: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const dailyAverageInvestment = recentInvestmentTrend[0]?.dailyAverage || 0;
    const projectedNewInvestments = dailyAverageInvestment * days;

    const inflows =
      (maturingInvestments[0]?.totalProfit || 0) +
      (maturingInvestments[0]?.totalPrincipal || 0);
    const outflows = projectedNewInvestments;

    // Create daily projections
    const dailyProjections: Array<{
      date: string;
      projectedInflow: number;
      projectedOutflow: number;
    }> = [];
    for (let i = 1; i <= days; i++) {
      const projectionDate = new Date();
      projectionDate.setDate(projectionDate.getDate() + i);

      dailyProjections.push({
        date: projectionDate.toISOString().split('T')[0],
        projectedInflow: 0, // Would need to calculate based on actual maturity dates
        projectedOutflow: Number(dailyAverageInvestment),
      });
    }

    return {
      projectedInflows: inflows,
      projectedOutflows: outflows,
      netCashFlow: inflows - outflows,
      dailyProjections,
    };
  }

  async getRiskExposureMetrics(dateRange?: DateRangeDto): Promise<{
    totalRiskExposure: number;
    riskByPlan: any[];
    riskByUser: any[];
    highRiskInvestments: number;
    riskConcentration: any[];
  }> {
    const dateFilter = this.buildDateFilter(dateRange);

    const [riskByPlan, highRiskCount] = await Promise.all([
      this.userInvestmentModel.aggregate([
        { $match: { ...dateFilter, status: 'active' } },
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
            _id: '$investmentDetails.riskLevel',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
            percentage: {
              $sum: '$investmentDetails.rate',
            },
          },
        },
        { $sort: { totalAmount: -1 } },
      ]),
      this.userInvestmentModel.countDocuments({
        ...dateFilter,
        status: 'active',
        riskFlag: 'HIGH',
      }),
    ]);

    const totalRiskExposure = riskByPlan.reduce(
      (total, risk) => total + risk.totalAmount,
      0,
    );

    // Get risk concentration by top users
    const riskByUser = await this.userInvestmentModel.aggregate([
      { $match: { ...dateFilter, status: 'active' } },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      { $unwind: '$userDetails' },
      {
        $group: {
          _id: '$user',
          name: { $first: '$userDetails.name' },
          email: { $first: '$userDetails.email' },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 },
    ]);

    // Calculate risk concentration
    const riskConcentration = riskByUser.map((user) => ({
      ...user,
      concentration:
        totalRiskExposure > 0
          ? (user.totalAmount / totalRiskExposure) * 100
          : 0,
    }));

    return {
      totalRiskExposure,
      riskByPlan,
      riskByUser,
      highRiskInvestments: highRiskCount,
      riskConcentration,
    };
  }

  async generateCSVReport(query: any): Promise<string> {
    // This would generate CSV data based on the query
    // For now, return a placeholder
    return 'CSV report generation not implemented yet';
  }

  private buildDateFilter(dateRange?: DateRangeDto): any {
    if (!dateRange || (!dateRange.dateFrom && !dateRange.dateTo)) {
      return {};
    }

    const filter: any = {};
    if (dateRange.dateFrom || dateRange.dateTo) {
      filter.createdAt = {};
      if (dateRange.dateFrom)
        filter.createdAt.$gte = new Date(dateRange.dateFrom);
      if (dateRange.dateTo) filter.createdAt.$lte = new Date(dateRange.dateTo);
    }

    return filter;
  }

  private async calculateProfitGrowth(dateFilter: any): Promise<number> {
    // Calculate growth by comparing with previous period
    // This is a simplified implementation
    const currentPeriod = await this.userInvestmentModel.aggregate([
      { $match: { ...dateFilter, isProfitCredited: true } },
      { $group: { _id: null, totalProfit: { $sum: '$actualProfit' } } },
    ]);

    return 0; // Placeholder
  }

  private async calculateRevenueGrowth(dateFilter: any): Promise<number> {
    // Calculate growth by comparing with previous period
    // This is a simplified implementation
    return 0; // Placeholder
  }
}
