import 'dotenv/config';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { VenueModel } from './models/venue.js';
import { CourtModel } from './models/court.js';
import { TeamModel } from './models/team.js';
import { PlayerModel } from './models/player.js';
import { CompetitionModel } from './models/competition.js';
import { FixtureModel } from './models/fixture.js';
import { MatchStateModel } from './models/match-state.js';
import { UserModel } from './models/user.js';
import { PlayerStatsModel } from './models/player-stats.js';
import { newId } from './utils/id.js';
import { generateLicenseKey } from './utils/license.js';
import { uniquePlayerSlug } from './utils/slug.js';
import { ScoreboardDeviceModel } from './models/scoreboard-device.js';
import { SmsReminderLogModel } from './models/sms-reminder-log.js';
import { generateRoundRobinFixtures } from '@sportsync/shared';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sportsync';

async function dropLegacyIndexes() {
  for (const [model, indexName] of [
    [CourtModel, 'venueId_1_number_1'],
    [PlayerModel, 'team_1_number_1'],
  ] as const) {
    try {
      await model.collection.dropIndex(indexName);
    } catch {
      // Index may not exist on fresh databases.
    }
  }
  await Promise.all([CourtModel.syncIndexes(), PlayerModel.syncIndexes()]);
}

async function seed() {
  await connectDatabase(MONGODB_URI);
  await dropLegacyIndexes();

  await Promise.all([
    PlayerStatsModel.deleteMany({}),
    UserModel.deleteMany({}),
    MatchStateModel.deleteMany({}),
    FixtureModel.deleteMany({}),
    CompetitionModel.deleteMany({}),
    PlayerModel.deleteMany({}),
    TeamModel.deleteMany({}),
    CourtModel.deleteMany({}),
    ScoreboardDeviceModel.deleteMany({}),
    SmsReminderLogModel.deleteMany({}),
    VenueModel.deleteMany({}),
  ]);

  const venueId = newId();
  const licenseKey = generateLicenseKey();
  await VenueModel.create({
    id: venueId,
    name: 'Action Indoor Sports Christchurch',
    slug: 'action-christchurch',
    productTier: 'stadium',
    branding: { primaryColor: '#00c896', secondaryColor: '#1a2332' },
    courtCount: 4,
    sports: ['indoor-cricket', 'indoor-netball', 'indoor-football', 'basketball', 'touch-rugby', 'outdoor-cricket', 'outdoor-football', 'outdoor-netball', 'rugby-union', 'rugby-league'],
    licenseKey,
    smsEnabled: true,
    smsAutoRemindersEnabled: true,
    smsReminderHoursBefore: 24,
  });

  const courts = await CourtModel.insertMany(
    ['Court 1', 'Court 2', 'Court 3', 'Court 4'].map((name, i) => ({
      id: newId(),
      venueId,
      name,
      number: i + 1,
      sport: 'indoor-cricket',
      displayOrder: i,
    }))
  );

  const teamNames = ['Thunder', 'Lightning', 'Storm', 'Cyclones', 'Hurricanes', 'Blizzard'];
  const teams = await TeamModel.insertMany(
    teamNames.map((name, i) => ({
      id: newId(),
      venueId,
      name,
      shortName: name.slice(0, 3).toUpperCase(),
      colors: {
        primary: ['#00c896', '#ff6b35', '#4ecdc4', '#ffe66d', '#a855f7', '#3b82f6'][i],
        secondary: '#ffffff',
      },
    }))
  );

  const players = [];
  let phoneIndex = 0;
  for (const team of teams) {
    for (let i = 1; i <= 8; i++) {
      const displayName = `${team.name} Player ${i}`;
      const slug = await uniquePlayerSlug(venueId, displayName, async (vId, s) => {
        const existing = await PlayerModel.findOne({ venueId: vId, slug: s });
        return Boolean(existing);
      });
      phoneIndex += 1;
      players.push({
        id: newId(),
        venueId,
        firstName: `Player`,
        lastName: `${i}`,
        displayName,
        slug,
        team: team.id,
        number: i,
        teamIds: [team.id],
        ...(i <= 3 ? { phone: `+6421${String(100000 + phoneIndex).slice(-7)}` } : {}),
      });
    }
  }
  await PlayerModel.insertMany(players);

  const competitionId = newId();
  await CompetitionModel.create({
    id: competitionId,
    venueId,
    sport: 'indoor-cricket',
    name: 'Summer Indoor Cricket 2026',
    season: '2026',
    status: 'active',
    teamIds: teams.map((t) => t.id),
    settings: {
      formatKey: 'six-aside',
      pointsForWin: 4,
      pointsForTie: 2,
      pointsForLoss: 0,
      bonusPointThreshold: 100,
      doubleRoundRobin: false,
    },
    ladder: [],
  });

  const generated = generateRoundRobinFixtures(
    teams.map((t) => t.id),
    competitionId,
    'default',
    {
      startDate: new Date().toISOString(),
      daysBetweenRounds: 7,
      courtIds: courts.map((c) => c.id),
      slotMinutes: 90,
    }
  );

  await FixtureModel.insertMany(
    generated.map((f) => ({
      ...f,
      id: newId(),
      venueId,
    }))
  );

  console.log('Seed complete!');
  console.log(`Venue ID: ${venueId}`);
  console.log(`Venue slug: action-christchurch`);
  console.log(`Venue licence key: ${licenseKey}`);
  console.log(`Competition ID: ${competitionId}`);

  const netballTeams = teams.slice(0, 4);
  const netballCompId = newId();
  await CompetitionModel.create({
    id: netballCompId,
    venueId,
    sport: 'indoor-netball',
    name: 'Winter Indoor Netball 2026',
    season: '2026',
    status: 'active',
    teamIds: netballTeams.map((t) => t.id),
    settings: {
      pointsForWin: 4,
      pointsForTie: 2,
      pointsForLoss: 0,
      doubleRoundRobin: false,
    },
    ladder: [],
  });

  const netballFixtures = generateRoundRobinFixtures(
    netballTeams.map((t) => t.id),
    netballCompId,
    'default',
    {
      startDate: new Date().toISOString(),
      daysBetweenRounds: 7,
      courtIds: courts.map((c) => c.id),
      slotMinutes: 90,
    }
  );
  await FixtureModel.insertMany(
    netballFixtures.map((f) => ({
      ...f,
      id: newId(),
      venueId,
    }))
  );
  console.log(`Netball Competition ID: ${netballCompId}`);

  const footballTeams = teams.slice(0, 4);
  const footballCompId = newId();
  await CompetitionModel.create({
    id: footballCompId,
    venueId,
    sport: 'indoor-football',
    name: 'Spring 5-a-side Football 2026',
    season: '2026',
    status: 'active',
    teamIds: footballTeams.map((t) => t.id),
    settings: {
      pointsForWin: 3,
      pointsForTie: 1,
      pointsForLoss: 0,
      doubleRoundRobin: false,
    },
    ladder: [],
  });

  const footballFixtures = generateRoundRobinFixtures(
    footballTeams.map((t) => t.id),
    footballCompId,
    'default',
    {
      startDate: new Date().toISOString(),
      daysBetweenRounds: 7,
      courtIds: courts.map((c) => c.id),
      slotMinutes: 60,
    }
  );
  await FixtureModel.insertMany(
    footballFixtures.map((f) => ({
      ...f,
      id: newId(),
      venueId,
    }))
  );
  console.log(`Football Competition ID: ${footballCompId}`);

  const basketballTeams = teams.slice(2, 6);
  const basketballCompId = newId();
  await CompetitionModel.create({
    id: basketballCompId,
    venueId,
    sport: 'basketball',
    name: 'Autumn Basketball League 2026',
    season: '2026',
    status: 'active',
    teamIds: basketballTeams.map((t) => t.id),
    settings: {
      pointsForWin: 2,
      pointsForTie: 1,
      pointsForLoss: 0,
      doubleRoundRobin: false,
    },
    ladder: [],
  });

  const basketballFixtures = generateRoundRobinFixtures(
    basketballTeams.map((t) => t.id),
    basketballCompId,
    'default',
    {
      startDate: new Date().toISOString(),
      daysBetweenRounds: 7,
      courtIds: courts.map((c) => c.id),
      slotMinutes: 50,
    }
  );
  await FixtureModel.insertMany(
    basketballFixtures.map((f) => ({
      ...f,
      id: newId(),
      venueId,
    }))
  );
  console.log(`Basketball Competition ID: ${basketballCompId}`);

  const rugbyTeams = teams.slice(0, 4);
  const rugbyCompId = newId();
  await CompetitionModel.create({
    id: rugbyCompId,
    venueId,
    sport: 'touch-rugby',
    name: 'Summer Touch Rugby 2026',
    season: '2026',
    status: 'active',
    teamIds: rugbyTeams.map((t) => t.id),
    settings: {
      pointsForWin: 4,
      pointsForTie: 2,
      pointsForLoss: 0,
      doubleRoundRobin: false,
    },
    ladder: [],
  });

  const rugbyFixtures = generateRoundRobinFixtures(
    rugbyTeams.map((t) => t.id),
    rugbyCompId,
    'default',
    {
      startDate: new Date().toISOString(),
      daysBetweenRounds: 7,
      courtIds: courts.map((c) => c.id),
      slotMinutes: 40,
    }
  );
  await FixtureModel.insertMany(
    rugbyFixtures.map((f) => ({
      ...f,
      id: newId(),
      venueId,
    }))
  );
  console.log(`Touch Rugby Competition ID: ${rugbyCompId}`);

  const outdoorFootballTeams = teams.slice(1, 5);
  const outdoorFootballCompId = newId();
  await CompetitionModel.create({
    id: outdoorFootballCompId,
    venueId,
    sport: 'outdoor-football',
    name: 'Regional 11-a-side League 2026',
    season: '2026',
    status: 'active',
    teamIds: outdoorFootballTeams.map((t) => t.id),
    settings: { pointsForWin: 3, pointsForTie: 1, pointsForLoss: 0, doubleRoundRobin: false },
    ladder: [],
  });
  const outdoorFootballFixtures = generateRoundRobinFixtures(
    outdoorFootballTeams.map((t) => t.id),
    outdoorFootballCompId,
    'default',
    { startDate: new Date().toISOString(), daysBetweenRounds: 14, courtIds: courts.map((c) => c.id), slotMinutes: 90 }
  );
  await FixtureModel.insertMany(outdoorFootballFixtures.map((f) => ({ ...f, id: newId(), venueId })));
  console.log(`Outdoor Football Competition ID: ${outdoorFootballCompId}`);

  const unionTeams = teams.slice(0, 4);
  const unionCompId = newId();
  await CompetitionModel.create({
    id: unionCompId,
    venueId,
    sport: 'rugby-union',
    name: 'Premier Rugby Union 2026',
    season: '2026',
    status: 'active',
    teamIds: unionTeams.map((t) => t.id),
    settings: { pointsForWin: 4, pointsForTie: 2, pointsForLoss: 0, doubleRoundRobin: false },
    ladder: [],
  });
  const unionFixtures = generateRoundRobinFixtures(
    unionTeams.map((t) => t.id),
    unionCompId,
    'default',
    { startDate: new Date().toISOString(), daysBetweenRounds: 14, courtIds: courts.map((c) => c.id), slotMinutes: 80 }
  );
  await FixtureModel.insertMany(unionFixtures.map((f) => ({ ...f, id: newId(), venueId })));
  console.log(`Rugby Union Competition ID: ${unionCompId}`);

  console.log(`Teams: ${teams.length}, Players: ${players.length}, Fixtures: ${generated.length}`);

  const passwordHash = await bcrypt.hash('admin123', 10);
  await UserModel.create({
    id: newId(),
    email: 'admin@sportsync.local',
    passwordHash,
    name: 'Venue Admin',
    venueId,
    role: 'owner',
  });
  console.log('Admin user: admin@sportsync.local / admin123');

  await disconnectDatabase();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
