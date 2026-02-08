import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({
    required: true,
    enum: [
      'wallet_to_trade',
      'trade_to_wallet',
      'trade_to_investment',
      'investment_profit',
      'investment_principal',
      'deposit',
      'withdrawal',
      'admin_adjustment',
    ],
  })
  type: string;

  @Prop({ required: true })
  amount: number; // USDT

  @Prop({ required: true, enum: ['wallet', 'trade_wallet', 'investment'] })
  source: string;

  @Prop({ required: true, enum: ['wallet', 'trade_wallet', 'investment'] })
  destination: string;

  @Prop({ required: true, unique: true })
  reference: string;

  @Prop({ default: 'pending', enum: ['pending', 'completed', 'failed'] })
  status: string;

  @Prop()
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'UserInvestment' })
  relatedInvestment?: Types.ObjectId;

  // Admin management fields
  @Prop({ default: false })
  reversed: boolean;

  @Prop()
  reversedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reversedBy?: Types.ObjectId;

  @Prop()
  reversalReason?: string;

  @Prop({ default: false })
  manualTransaction: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop()
  adminNotes?: string;

  @Prop({ default: false })
  flaggedForReview: boolean;

  @Prop({ default: false })
  suspiciousActivity: boolean;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
