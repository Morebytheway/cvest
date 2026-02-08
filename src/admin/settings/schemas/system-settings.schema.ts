import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SystemSettingsDocument = SystemSettings & Document;

@Schema({ timestamps: true })
export class SystemSettings {
  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ type: Object, required: true })
  value: Record<string, unknown>;

  @Prop()
  description?: string;
}

export const SystemSettingsSchema =
  SchemaFactory.createForClass(SystemSettings);
