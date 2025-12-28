import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  adminId: Types.ObjectId;

  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  resource: string;

  @Prop({ type: Types.ObjectId })
  resourceId?: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  oldValues?: any;

  @Prop({ type: Object, default: {} })
  newValues?: any;

  @Prop({ default: 'INFO', enum: ['INFO', 'WARNING', 'ERROR', 'CRITICAL'] })
  severity: string;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;

  @Prop()
  reason?: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
