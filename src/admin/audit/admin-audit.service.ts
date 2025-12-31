import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Request } from 'express';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

export interface AuditData {
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
  reason?: string;
  severity?: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
}

@Injectable()
export class AdminAuditService {
  private readonly logger = new Logger(AdminAuditService.name);

  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async logAdminAction(
    adminId: string,
    auditData: AuditData,
    request?: Request,
    successful: boolean = true,
    errorMessage?: string,
  ): Promise<AuditLogDocument> {
    try {
      const audit = new this.auditLogModel({
        admin: adminId,
        ...auditData,
        ipAddress: this.extractIpAddress(request),
        userAgent: this.extractUserAgent(request),
        successful,
        errorMessage,
        severity: auditData.severity || 'INFO',
      });

      const savedAudit = await audit.save();

      this.logger.log(
        `Admin action logged: ${auditData.action} on ${auditData.resource}`,
      );
      return savedAudit;
    } catch (error) {
      this.logger.error(`Failed to log admin action: ${error.message}`);
      throw error;
    }
  }

  async getAuditTrail(filters?: {
    adminId?: string;
    action?: string;
    resource?: string;
    resourceId?: string;
    severity?: string;
    dateFrom?: string;
    dateTo?: string;
    successful?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    audits: AuditLogDocument[];
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
      adminId,
      action,
      resource,
      resourceId,
      severity,
      dateFrom,
      dateTo,
      successful,
      page = 1,
      limit = 50,
    } = filters || {};

    // Build filter
    const filter: any = {};
    if (adminId) filter.admin = adminId;
    if (action) filter.action = action;
    if (resource) filter.resource = resource;
    if (resourceId) filter.resourceId = resourceId;
    if (severity) filter.severity = severity;
    if (successful !== undefined) filter.successful = successful;

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;

    const [audits, total] = await Promise.all([
      this.auditLogModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('admin', 'name email')
        .exec(),
      this.auditLogModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      audits,
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

  async getAdminAuditSummary(
    adminId?: string,
    days: number = 30,
  ): Promise<{
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    actionsByType: any;
    actionsByResource: any;
    criticalActions: number;
    recentActions: AuditLogDocument[];
  }> {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const filter: any = {
      createdAt: { $gte: dateFrom },
    };

    if (adminId) filter.admin = adminId;

    const [summary, recentActions] = await Promise.all([
      this.auditLogModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalActions: { $sum: 1 },
            successfulActions: {
              $sum: { $cond: [{ $eq: ['$successful', true] }, 1, 0] },
            },
            failedActions: {
              $sum: { $cond: [{ $eq: ['$successful', false] }, 1, 0] },
            },
            criticalActions: {
              $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] },
            },
            actionsByType: {
              $push: {
                action: '$action',
                count: 1,
              },
            },
            actionsByResource: {
              $push: {
                resource: '$resource',
                count: 1,
              },
            },
          },
        },
        {
          $addFields: {
            actionsByType: {
              $reduce: {
                input: '$actionsByType',
                initialValue: {},
                in: {
                  $let: {
                    vars: { item: '$$this' },
                    in: {
                      $mergeObjects: [
                        '$$value',
                        {
                          k: '$$item.action',
                          v: {
                            $add: [
                              {
                                $ifNull: [
                                  {
                                    $arrayElemAt: ['$$value.$$item.action', 0],
                                  },
                                  0,
                                ],
                              },
                              1,
                            ],
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
            actionsByResource: {
              $reduce: {
                input: '$actionsByResource',
                initialValue: {},
                in: {
                  $let: {
                    vars: { item: '$$this' },
                    in: {
                      $mergeObjects: [
                        '$$value',
                        {
                          k: '$$item.resource',
                          v: {
                            $add: [
                              {
                                $ifNull: [
                                  {
                                    $arrayElemAt: [
                                      '$$value.$$item.resource',
                                      0,
                                    ],
                                  },
                                  0,
                                ],
                              },
                              1,
                            ],
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      ]),
      this.auditLogModel
        .find({ ...filter, successful: false, severity: 'CRITICAL' })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('admin', 'name email')
        .exec(),
    ]);

    const summaryData = summary[0] || {
      totalActions: 0,
      successfulActions: 0,
      failedActions: 0,
      criticalActions: 0,
      actionsByType: {},
      actionsByResource: {},
    };

    return {
      ...summaryData,
      recentActions,
    };
  }

  async generateComplianceReport(days: number = 30): Promise<{
    reportPeriod: string;
    totalAdminActions: number;
    highRiskActions: any[];
    failedActions: any[];
    actionTrends: any;
    topActiveAdmins: any[];
  }> {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const [highRiskActions, failedActions, adminActivity, trends] =
      await Promise.all([
        this.auditLogModel
          .find({
            createdAt: { $gte: dateFrom },
            severity: { $in: ['WARNING', 'ERROR', 'CRITICAL'] },
          })
          .sort({ createdAt: -1 })
          .limit(20)
          .populate('admin', 'name email')
          .exec(),

        this.auditLogModel
          .find({
            createdAt: { $gte: dateFrom },
            successful: false,
          })
          .sort({ createdAt: -1 })
          .limit(20)
          .populate('admin', 'name email')
          .exec(),

        this.auditLogModel.aggregate([
          { $match: { createdAt: { $gte: dateFrom } } },
          {
            $group: {
              _id: '$admin',
              actionCount: { $sum: 1 },
              lastAction: { $max: '$createdAt' },
            },
          },
          { $sort: { actionCount: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'adminDetails',
            },
          },
          { $unwind: '$adminDetails' },
          {
            $project: {
              adminId: '$_id',
              name: '$adminDetails.name',
              email: '$adminDetails.email',
              actionCount: 1,
              lastAction: 1,
            },
          },
        ]),

        this.auditLogModel.aggregate([
          { $match: { createdAt: { $gte: dateFrom } } },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
              },
              actionCount: { $sum: 1 },
              criticalCount: {
                $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] },
              },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

    return {
      reportPeriod: `Last ${days} days (${dateFrom.toISOString().split('T')[0]} to ${new Date().toISOString().split('T')[0]})`,
      totalAdminActions: await this.auditLogModel.countDocuments({
        createdAt: { $gte: dateFrom },
      }),
      highRiskActions,
      failedActions,
      topActiveAdmins: adminActivity,
      actionTrends: trends,
    };
  }

  async clearAuditLogs(daysToKeep: number = 365): Promise<{ deleted: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.auditLogModel.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    this.logger.log(
      `Cleared ${result.deletedCount} audit logs older than ${daysToKeep} days`,
    );

    return { deleted: result.deletedCount };
  }

  private extractIpAddress(request?: Request): string | undefined {
    if (!request) return undefined;

    return (
      request.ip ||
      (Array.isArray(request.headers['x-forwarded-for'])
        ? request.headers['x-forwarded-for'][0]
        : request.headers['x-forwarded-for']) ||
      (request.headers['x-real-ip'] as string | undefined) ||
      undefined
    );
  }

  private extractUserAgent(request?: Request): string | undefined {
    if (!request) return undefined;

    return request.headers['user-agent'];
  }

  // Helper methods for common actions
  async logInvestmentPlanAction(
    adminId: string,
    action: string,
    investmentId: string,
    oldValues?: any,
    newValues?: any,
    request?: Request,
  ) {
    return this.logAdminAction(
      adminId,
      {
        action,
        resource: 'InvestmentPlan',
        resourceId: investmentId,
        oldValues,
        newValues,
        severity: action.includes('DELETE') ? 'WARNING' : 'INFO',
      },
      request,
    );
  }

  async logUserInvestmentAction(
    adminId: string,
    action: string,
    userInvestmentId: string,
    reason?: string,
    request?: Request,
  ) {
    return this.logAdminAction(
      adminId,
      {
        action,
        resource: 'UserInvestment',
        resourceId: userInvestmentId,
        reason,
        severity: action.includes('TERMINATE') ? 'WARNING' : 'INFO',
      },
      request,
    );
  }

  async logTransactionAction(
    adminId: string,
    action: string,
    transactionId: string,
    reason?: string,
    request?: Request,
  ) {
    return this.logAdminAction(
      adminId,
      {
        action,
        resource: 'Transaction',
        resourceId: transactionId,
        reason,
        severity: action.includes('REVERSE') ? 'WARNING' : 'INFO',
      },
      request,
    );
  }

  async logWalletAction(
    adminId: string,
    action: string,
    userId: string,
    amount?: number,
    reason?: string,
    request?: Request,
  ) {
    return this.logAdminAction(
      adminId,
      {
        action,
        resource: 'Wallet',
        resourceId: userId,
        newValues: { amount },
        reason,
        severity: action.includes('FREEZE') ? 'WARNING' : 'INFO',
      },
      request,
    );
  }

  async getAuditEntry(id: string) {
    try {
      const auditEntry = await this.auditLogModel
        .findById(id)
        .populate('adminId', 'email firstName lastName')
        .exec();

      if (!auditEntry) {
        throw new Error('Audit log entry not found');
      }

      return auditEntry;
    } catch (error) {
      this.logger.error(`Failed to get audit entry: ${error.message}`);
      throw error;
    }
  }
}
