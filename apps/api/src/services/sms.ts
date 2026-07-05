import twilio from 'twilio';
import { TIER_LIMITS } from '@sportsync/shared';
import type { ProductTier } from '@sportsync/shared';
import { VenueModel } from '../models/venue.js';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;

export function isSmsConfigured(): boolean {
  return Boolean(accountSid && authToken && fromNumber);
}

function getClient() {
  if (!isSmsConfigured()) throw new Error('SMS is not configured on this server');
  return twilio(accountSid!, authToken!);
}

export async function canVenueSendSms(venueId: string): Promise<{ ok: boolean; error?: string }> {
  const venue = await VenueModel.findOne({ id: venueId });
  if (!venue) return { ok: false, error: 'Venue not found' };

  const tier = venue.productTier as ProductTier;
  if (!TIER_LIMITS[tier].smsNotifications) {
    return { ok: false, error: 'SMS notifications require Stadium tier' };
  }
  if (!venue.smsEnabled) {
    return { ok: false, error: 'SMS is disabled for this venue. Enable it in Venue Settings.' };
  }
  if (!isSmsConfigured()) {
    return { ok: false, error: 'SMS provider is not configured on this server' };
  }
  return { ok: true };
}

export async function sendSms(to: string, body: string): Promise<{ sid: string }> {
  const client = getClient();
  const message = await client.messages.create({
    to,
    from: fromNumber!,
    body,
  });
  return { sid: message.sid };
}

export async function sendBulkSms(
  recipients: string[],
  body: string
): Promise<{ sent: number; failed: string[] }> {
  const failed: string[] = [];
  let sent = 0;
  for (const phone of recipients) {
    try {
      await sendSms(phone, body);
      sent += 1;
    } catch {
      failed.push(phone);
    }
  }
  return { sent, failed };
}

export function formatFixtureReminder(data: {
  homeTeam: string;
  awayTeam: string;
  scheduledAt?: string;
  courtName?: string;
  competitionName?: string;
}): string {
  const when = data.scheduledAt
    ? new Date(data.scheduledAt).toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'TBC';
  const court = data.courtName ? ` on ${data.courtName}` : '';
  return `SportSync: ${data.homeTeam} vs ${data.awayTeam}${court} — ${when}. ${data.competitionName || ''}`.trim();
}
