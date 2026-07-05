import { FixtureModel } from '../models/fixture.js';
import { TeamModel } from '../models/team.js';
import { PlayerModel } from '../models/player.js';
import { CourtModel } from '../models/court.js';
import { CompetitionModel } from '../models/competition.js';
import { VenueModel } from '../models/venue.js';
import { SmsReminderLogModel } from '../models/sms-reminder-log.js';
import { canVenueSendSms, sendBulkSms, formatFixtureReminder } from './sms.js';
import { newId } from '../utils/id.js';

const CHECK_INTERVAL_MS = 15 * 60 * 1000;
const REMINDER_WINDOW_MS = 30 * 60 * 1000;

export async function processScheduledSmsReminders(): Promise<{ processed: number; sent: number }> {
  const venues = await VenueModel.find({ smsEnabled: true, smsAutoRemindersEnabled: true });
  let processed = 0;
  let totalSent = 0;

  for (const venue of venues) {
    const check = await canVenueSendSms(venue.id);
    if (!check.ok) continue;

    const hoursBefore = venue.smsReminderHoursBefore ?? 24;
    const now = Date.now();
    const fixtures = await FixtureModel.find({
      venueId: venue.id,
      status: 'scheduled',
      scheduledAt: { $exists: true },
    });

    for (const fixture of fixtures) {
      if (!fixture.scheduledAt) continue;
      const scheduledMs = new Date(fixture.scheduledAt).getTime();
      const reminderMs = scheduledMs - hoursBefore * 60 * 60 * 1000;

      if (now < reminderMs || now > reminderMs + REMINDER_WINDOW_MS) continue;

      const alreadySent = await SmsReminderLogModel.findOne({ fixtureId: fixture.id });
      if (alreadySent) continue;

      const phones = await collectFixturePhones(fixture.homeTeamId, fixture.awayTeamId);
      if (phones.length === 0) continue;

      const [homeTeam, awayTeam, court, competition] = await Promise.all([
        TeamModel.findOne({ id: fixture.homeTeamId }),
        TeamModel.findOne({ id: fixture.awayTeamId }),
        fixture.courtId ? CourtModel.findOne({ id: fixture.courtId }) : null,
        CompetitionModel.findOne({ id: fixture.competitionId }),
      ]);

      const message = formatFixtureReminder({
        homeTeam: homeTeam?.name || fixture.homeTeamId,
        awayTeam: awayTeam?.name || fixture.awayTeamId,
        scheduledAt: fixture.scheduledAt,
        courtName: court?.name,
        competitionName: competition?.name,
      });

      const result = await sendBulkSms(phones, message);
      await SmsReminderLogModel.create({
        id: newId(),
        fixtureId: fixture.id,
        venueId: venue.id,
        sentAt: new Date().toISOString(),
        recipientCount: result.sent,
      });

      processed += 1;
      totalSent += result.sent;
    }
  }

  return { processed, sent: totalSent };
}

async function collectFixturePhones(homeTeamId: string, awayTeamId: string): Promise<string[]> {
  const players = await PlayerModel.find({
    teamIds: { $in: [homeTeamId, awayTeamId] },
    phone: { $exists: true, $ne: '' },
  });
  return [...new Set(players.map((p) => p.phone).filter(Boolean) as string[])];
}

export function startSmsReminderScheduler() {
  const run = () => {
    processScheduledSmsReminders().catch((err) => console.error('SMS scheduler error:', err));
  };
  run();
  setInterval(run, CHECK_INTERVAL_MS);
  console.log('SMS reminder scheduler started (every 15 min)');
}
