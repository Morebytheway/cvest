import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TradingWalletDocument = TradingWallet & Document;

@Schema({ timestamps: true })
export class TradingWallet {
  @Prop({ type: Types.ObjectId, ref: 'User', unique: true })
  user: Types.ObjectId;

  @Prop({ default: 0 })
  balance: number; // USDT amount

  @Prop({ default: 'USDT' })
  currency: string;

  @Prop({ default: 'active', enum: ['active', 'frozen', 'closed'] })
  status: string;

  @Prop({ default: false })
  hasActiveInvestments: boolean;

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
}

export const TradingWalletSchema = SchemaFactory.createForClass(TradingWallet);
