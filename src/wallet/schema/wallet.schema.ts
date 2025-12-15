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
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
