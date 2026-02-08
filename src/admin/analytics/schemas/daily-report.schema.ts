import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DailyReportDocument = DailyReport & Document;

@Schema({ timestamps: true })
export class DailyReport {
  @Prop({ required: true, unique: true })
  date: Date;

  @Prop({ default: 0 })
  totalInvested: number;

  @Prop({ default: 0 })
  totalProfit: number;

  @Prop({ default: 0 })
  newInvestments: number;

  @Prop({ default: 0 })
  completedInvestments: number;

  @Prop({ default: 0 })
  activeUsers: number;

  @Prop({ default: 0 })
  totalUsers: number;

  @Prop({ default: 0 })
  failedTransactions: number;

  @Prop({ default: 0 })
  pendingTransactions: number;

  @Prop({ type: Map, of: Number })
  planBreakdown: Map<string, number>;

  @Prop({ type: Map, of: Number })
  investmentStatusBreakdown: Map<string, number>;

  @Prop({ type: Object, default: {} })
  metrics: {
    averageInvestmentAmount?: number;
    averageProfitAmount?: number;
    roiPercentage?: number;
    newUsers?: number;
    activeInvestments?: number;
    completedInvestments?: number;
    cancelledInvestments?: number;
    frozenInvestments?: number;
    totalTransactions?: number;
    successfulTransactions?: number;
    totalRevenue?: number;
  };
}

export const DailyReportSchema = SchemaFactory.createForClass(DailyReport);
