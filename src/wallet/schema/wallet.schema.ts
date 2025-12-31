import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WalletDocument = Wallet & Document;

@Schema({ timestamps: true })
export class Wallet {
  @Prop({ type: Types.ObjectId, ref: 'User', unique: true })
  user: Types.ObjectId;

  @Prop({ default: 0 })
  balance: number; // USDT balance

  // Admin management fields
  @Prop({ default: false })
  frozen: boolean;

  @Prop()
  frozenAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  frozenBy?: Types.ObjectId;

  @Prop()
  freezeReason?: string;

  @Prop({ default: 0 })
  totalDeposited: number;

  @Prop({ default: 0 })
  totalWithdrawn: number;

  @Prop()
  lastActivity?: Date;

  @Prop({ default: false })
  suspiciousActivity: boolean;
  @Prop()
  adminNotes?: string;

  // Trade wallet integration fields
  @Prop({ default: 0 })
  tradeWalletBalance: number; // USDT balance for trading

  @Prop({ default: 'USDT' })
  currency: string;

  @Prop({ default: 'active', enum: ['active', 'frozen', 'closed'] })
  status: string;

  @Prop({ default: false })
  hasActiveInvestments: boolean;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
