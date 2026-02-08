import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserInvestmentDocument = UserInvestment & Document;

@Schema({ timestamps: true })
export class UserInvestment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Investment', required: true })
  investment: Types.ObjectId;

  @Prop({ required: true })
  amount: number; // USDT invested

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date; // startDate + 14 days

  @Prop({ required: true })
  expectedProfit: number; // amount * (rate/100)

  @Prop({ default: 0 })
  actualProfit: number;

  @Prop({ default: 'active', enum: ['active', 'completed', 'cancelled'] })
  status: string;

  @Prop({ default: false })
  isProfitCredited: boolean;

  @Prop({ default: false })
  isPrincipalReturned: boolean;

  @Prop()
  profitCreditedAt?: Date;

  @Prop()
  principalReturnedAt?: Date;

  // Admin management fields
  @Prop({ default: false })
  isFrozen: boolean;

  @Prop()
  frozenAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  frozenBy?: Types.ObjectId;

  @Prop()
  freezeReason?: string;

  @Prop({ default: false })
  manuallyCompleted: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  completedBy?: Types.ObjectId;

  @Prop()
  adminNotes?: string;

  @Prop({ default: 'LOW', enum: ['LOW', 'MEDIUM', 'HIGH'] })
  riskFlag?: string;

  @Prop()
  lastReviewed?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy?: Types.ObjectId;
}

export const UserInvestmentSchema =
  SchemaFactory.createForClass(UserInvestment);
