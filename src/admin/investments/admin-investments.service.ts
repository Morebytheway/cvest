import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Investment,
  InvestmentDocument,
} from '../../investments/schemas/investment.schema';
import {
  UserInvestment,
  UserInvestmentDocument,
} from '../../investments/schemas/user-investment.schema';
import { CreateInvestmentPlanDto } from './dto/create-investment-plan.dto';
import { UpdateInvestmentPlanDto } from './dto/update-investment-plan.dto';
import { InvestmentPlanQueryDto } from './dto/investment-plan-query.dto';

@Injectable()
export class AdminInvestmentsService {
  constructor(
    @InjectModel(Investment.name)
    private investmentModel: Model<InvestmentDocument>,
    @InjectModel(UserInvestment.name)
    private userInvestmentModel: Model<UserInvestmentDocument>,
  ) {}

  async createInvestmentPlan(
    createDto: CreateInvestmentPlanDto,
    adminId: string,
  ): Promise<InvestmentDocument> {
    // Validate business rules
    await this.validateInvestmentPlan(createDto);

    const investmentPlan = new this.investmentModel({
      ...createDto,
      createdBy: new Types.ObjectId(adminId),
      status: 'active',
    });

    return investmentPlan.save();
  }

  async getAllInvestmentPlans(query: InvestmentPlanQueryDto): Promise<{
    plans: InvestmentDocument[];
    total: number;
    pagination: {
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const {
      page = 1,
      limit = 10,
      status,
      visibility,
      riskLevel,
      category,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // Build filter
    const filter: any = {};
    if (status) filter.status = status;
    if (visibility) filter.visibility = visibility;
    if (riskLevel) filter.riskLevel = riskLevel;
    if (category) filter.category = category;

    // Build sort
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [plans, total] = await Promise.all([
      this.investmentModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .exec(),
      this.investmentModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      plans,
      total,
      pagination: {
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getInvestmentPlanById(id: string): Promise<InvestmentDocument> {
    const investment = await this.investmentModel
      .findById(id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .exec();

    if (!investment) {
      throw new NotFoundException('Investment plan not found');
    }

    return investment;
  }

  async updateInvestmentPlan(
    id: string,
    updateDto: UpdateInvestmentPlanDto,
    adminId: string,
  ): Promise<InvestmentDocument> {
    // Validate business rules for updates
    if (updateDto.rate || updateDto.durationDays || updateDto.minAmount) {
      // Check if there are active investments
      const activeInvestments = await this.userInvestmentModel.countDocuments({
        investment: new Types.ObjectId(id),
        status: 'active',
      });

      if (activeInvestments > 0) {
        throw new BadRequestException(
          'Cannot modify core investment parameters while there are active investments',
        );
      }
    }

    if (
      updateDto.maxAmount &&
      updateDto.minAmount &&
      updateDto.maxAmount < updateDto.minAmount
    ) {
      throw new BadRequestException(
        'Maximum amount cannot be less than minimum amount',
      );
    }

    // Update investment plan
    const updatedInvestment = await this.investmentModel
      .findByIdAndUpdate(
        id,
        {
          ...updateDto,
          updatedBy: new Types.ObjectId(adminId),
        },
        { new: true, runValidators: true },
      )
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .exec();

    if (!updatedInvestment) {
      throw new NotFoundException('Investment plan not found');
    }

    return updatedInvestment;
  }

  async deleteInvestmentPlan(id: string): Promise<void> {
    const investment = await this.getInvestmentPlanById(id);

    // Check if there are any user investments
    const userInvestments = await this.userInvestmentModel.countDocuments({
      investment: new Types.ObjectId(id),
    });

    if (userInvestments > 0) {
      throw new ConflictException(
        'Cannot delete investment plan with existing user investments. Archive it instead.',
      );
    }

    await this.investmentModel.findByIdAndDelete(id);
  }

  async toggleInvestmentPlan(
    id: string,
    adminId: string,
  ): Promise<InvestmentDocument> {
    const investment = await this.getInvestmentPlanById(id);

    const newStatus = investment.status === 'active' ? 'inactive' : 'active';

    const updatedInvestment = await this.investmentModel
      .findByIdAndUpdate(
        id,
        {
          status: newStatus,
          updatedBy: new Types.ObjectId(adminId),
        },
        { new: true, runValidators: true },
      )
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .exec();

    if (!updatedInvestment) {
      throw new NotFoundException('Investment plan not found');
    }

    return updatedInvestment;
  }

  async getInvestmentPlanStats(id: string): Promise<{
    plan: InvestmentDocument;
    stats: {
      totalInvested: number;
      activeInvestments: number;
      completedInvestments: number;
      totalProfitPaid: number;
      averageInvestmentAmount: number;
      roi: number;
      userCount: number;
    };
  }> {
    const plan = await this.getInvestmentPlanById(id);

    const stats = await this.userInvestmentModel.aggregate([
      { $match: { investment: new Types.ObjectId(id) } },
      {
        $group: {
          _id: null,
          totalInvested: { $sum: '$amount' },
          activeInvestments: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
          },
          completedInvestments: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          totalProfitPaid: {
            $sum: {
              $cond: [{ $eq: ['$isProfitCredited', true] }, '$actualProfit', 0],
            },
          },
          averageInvestmentAmount: { $avg: '$amount' },
          userCount: { $addToSet: '$user' },
        },
      },
      {
        $addFields: {
          userCount: { $size: '$userCount' },
          roi: {
            $cond: [
              { $gt: ['$totalInvested', 0] },
              {
                $multiply: [
                  { $divide: ['$totalProfitPaid', '$totalInvested'] },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $project: {
          userCount: 1,
          totalInvested: 1,
          activeInvestments: 1,
          completedInvestments: 1,
          totalProfitPaid: 1,
          averageInvestmentAmount: 1,
          roi: 1,
        },
      },
    ]);

    return {
      plan,
      stats: stats[0] || {
        totalInvested: 0,
        activeInvestments: 0,
        completedInvestments: 0,
        totalProfitPaid: 0,
        averageInvestmentAmount: 0,
        roi: 0,
        userCount: 0,
      },
    };
  }

  async archiveOldPlan(
    id: string,
    adminId: string,
  ): Promise<InvestmentDocument> {
    // Check if there are active investments
    const activeInvestments = await this.userInvestmentModel.countDocuments({
      investment: new Types.ObjectId(id),
      status: 'active',
    });

    if (activeInvestments > 0) {
      throw new BadRequestException(
        'Cannot archive plan with active investments. Wait for all investments to complete.',
      );
    }

    const updatedPlan = await this.investmentModel
      .findByIdAndUpdate(
        id,
        {
          status: 'archived',
          visibility: 'archived',
          updatedBy: new Types.ObjectId(adminId),
        },
        { new: true, runValidators: true },
      )
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .exec();

    if (!updatedPlan) {
      throw new NotFoundException('Investment plan not found');
    }

    return updatedPlan;
  }

  private async validateInvestmentPlan(
    createDto: CreateInvestmentPlanDto,
  ): Promise<void> {
    // Validate min/max amounts
    if (
      createDto.maxAmount &&
      createDto.minAmount &&
      createDto.maxAmount < createDto.minAmount
    ) {
      throw new BadRequestException(
        'Maximum amount cannot be less than minimum amount',
      );
    }

    // Check for duplicate plan names
    const existingPlan = await this.investmentModel.findOne({
      name: createDto.name,
      status: { $ne: 'archived' },
    });

    if (existingPlan) {
      throw new ConflictException(
        `Investment plan with name "${createDto.name}" already exists`,
      );
    }

    // Validate reasonable investment parameters
    if (createDto.rate > 50) {
      throw new BadRequestException('Investment rate cannot exceed 50%');
    }

    if (createDto.durationDays > 365) {
      throw new BadRequestException(
        'Investment duration cannot exceed 365 days',
      );
    }

    if (createDto.minAmount < 1) {
      throw new BadRequestException(
        'Minimum investment amount must be at least 1 USDT',
      );
    }
  }

  async getAllPlansPerformanceMetrics(): Promise<{
    summary: {
      totalPlans: number;
      activePlans: number;
      totalInvested: number;
      totalProfitPaid: number;
      activeInvestmentsCount: number;
      completedInvestmentsCount: number;
      uniqueInvestors: number;
      overallRoiPercent: number;
    };
    byPlan: Array<{
      planId: string;
      planName: string;
      rate: number;
      status: string;
      totalInvested: number;
      totalProfitPaid: number;
      activeCount: number;
      completedCount: number;
      userCount: number;
      roiPercent: number;
    }>;
  }> {
    const [plans, byPlanAgg] = await Promise.all([
      this.investmentModel.find().lean(),
      this.userInvestmentModel.aggregate([
        {
          $group: {
            _id: '$investment',
            totalInvested: { $sum: '$amount' },
            totalProfitPaid: {
              $sum: {
                $cond: [
                  { $eq: ['$isProfitCredited', true] },
                  '$actualProfit',
                  0,
                ],
              },
            },
            activeCount: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
            },
            completedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
            },
            userCount: { $addToSet: '$user' },
          },
        },
        {
          $addFields: {
            userCount: { $size: '$userCount' },
            roiPercent: {
              $cond: [
                { $gt: ['$totalInvested', 0] },
                {
                  $multiply: [
                    { $divide: ['$totalProfitPaid', '$totalInvested'] },
                    100,
                  ],
                },
                0,
              ],
            },
          },
        },
      ]),
    ]);

    const planMap = new Map(plans.map((p: any) => [p._id.toString(), p]));
    const byPlan = byPlanAgg.map((row: any) => {
      const plan = planMap.get(row._id?.toString());
      return {
        planId: row._id?.toString(),
        planName: plan?.name ?? 'Unknown',
        rate: plan?.rate ?? 0,
        status: plan?.status ?? 'unknown',
        totalInvested: row.totalInvested ?? 0,
        totalProfitPaid: row.totalProfitPaid ?? 0,
        activeCount: row.activeCount ?? 0,
        completedCount: row.completedCount ?? 0,
        userCount: row.userCount ?? 0,
        roiPercent: Math.round((row.roiPercent ?? 0) * 100) / 100,
      };
    });

    const summary = {
      totalPlans: plans.length,
      activePlans: plans.filter((p: any) => p.status === 'active').length,
      totalInvested: byPlan.reduce((s, p) => s + p.totalInvested, 0),
      totalProfitPaid: byPlan.reduce((s, p) => s + p.totalProfitPaid, 0),
      activeInvestmentsCount: byPlan.reduce((s, p) => s + p.activeCount, 0),
      completedInvestmentsCount: byPlan.reduce((s, p) => s + p.completedCount, 0),
      uniqueInvestors: new Set(byPlanAgg.flatMap((r: any) => r.userCount || [])).size,
      overallRoiPercent: 0,
    };
    summary.overallRoiPercent =
      summary.totalInvested > 0
        ? Math.round((summary.totalProfitPaid / summary.totalInvested) * 10000) / 100
        : 0;

    return { summary, byPlan };
  }

  async updatePlanStats(id: string): Promise<void> {
    const stats = await this.userInvestmentModel.aggregate([
      { $match: { investment: new Types.ObjectId(id) } },
      {
        $group: {
          _id: null,
          totalInvested: { $sum: '$amount' },
          activeInvestments: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
          },
        },
      },
    ]);

    const updateData = {
      totalInvested: stats[0]?.totalInvested || 0,
      activeInvestments: stats[0]?.activeInvestments || 0,
    };

    await this.investmentModel.findByIdAndUpdate(id, updateData);
  }
}
