import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WalletDocument = Wallet & Document;

@Schema({ timestamps: true })
export class Wallet {
  @Prop({ type: Types.ObjectId, ref: 'User', unique: true })
  user: Types.ObjectId;

  @Prop({ default: 0 })
  balance: number;

  @Prop({ default: 'NGN' })
  currency: string;

  @Prop({ default: 0 })
  usdtBalance: number; // USDT balance for trading

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
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
