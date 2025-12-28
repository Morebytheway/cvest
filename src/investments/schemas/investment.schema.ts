import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InvestmentDocument = Investment & Document;

@Schema({ timestamps: true })
export class Investment {
  @Prop({ required: true })
  name: string; // "Conservative 10%", "Balanced 15%", "Aggressive 20%"

  @Prop({ required: true })
  rate: number; // 10, 15, or 20

  @Prop({ required: true, default: 14 })
  durationDays: number;

  @Prop({ required: true, default: 500 })
  minAmount: number; // $500 USDT

  @Prop()
  maxAmount?: number;

  @Prop({ default: 'active', enum: ['active', 'inactive', 'archived'] })
  status: string;

  @Prop()
  description?: string;

  @Prop({ default: 0 })
  totalInvested: number;

  @Prop({ default: 0 })
  activeInvestments: number;

  @Prop({ default: 'public', enum: ['public', 'private', 'archived'] })
  visibility: string;

  @Prop()
  maxActiveUsers?: number;

  @Prop({ default: false })
  allowMultipleInvestments: boolean;

  @Prop({ default: 'LOW', enum: ['LOW', 'MEDIUM', 'HIGH'] })
  riskLevel: string;

  @Prop()
  category?: string;

  @Prop()
  adminNotes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;
}

export const InvestmentSchema = SchemaFactory.createForClass(Investment);
