import { Schema, model } from 'mongoose';

const smsReminderLogSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    fixtureId: { type: String, required: true, unique: true, index: true },
    venueId: { type: String, required: true, index: true },
    sentAt: { type: String, required: true },
    recipientCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const SmsReminderLogModel = model('SmsReminderLog', smsReminderLogSchema);
