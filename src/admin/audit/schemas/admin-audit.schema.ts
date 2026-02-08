import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type AdminAuditDocument = AdminAudit & Document;

@Schema({ timestamps: true })
export class AdminAudit {
  @Prop({ type: String, required: true })
  admin: string; // Admin user ID

  @Prop({ required: true })
  action: string; // Action performed (CREATE, UPDATE, DELETE, etc.)

  @Prop({ required: true })
  resource: string; // Resource type (Investment, UserInvestment, Transaction, etc.)

  @Prop()
  resourceId?: string; // ID of the resource that was acted upon
  @Prop({ type: mongoose.Schema.Types.Mixed })
  oldValues?: any;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  newValues?: any;
  // @Prop()
  // oldValues?: any; // Previous values before update

  // @Prop()
  // newValues?: any; // New values after update

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;

  @Prop()
  reason?: string; // Reason for the action (especially for deletions/modifications)

  @Prop({ default: false })
  successful: boolean; // Whether the action was successful

  @Prop()
  errorMessage?: string; // Error message if action failed

  @Prop({ default: 'INFO', enum: ['INFO', 'WARNING', 'ERROR', 'CRITICAL'] })
  severity: string; // Severity level of the action
}

export const AdminAuditSchema = SchemaFactory.createForClass(AdminAudit);
