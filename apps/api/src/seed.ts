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
import { uniquePlayerSlug } from './utils/slug.js';
import { generateRoundRobinFixtures } from '@sportsync/shared';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sportsync';

async function seed() {
  await connectDatabase(MONGODB_URI);

  await Promise.all([
    PlayerStatsModel.deleteMany({}),
    UserModel.deleteMany({}),
    MatchStateModel.deleteMany({}),
    FixtureModel.deleteMany({}),
    CompetitionModel.deleteMany({}),
    PlayerModel.deleteMany({}),
    TeamModel.deleteMany({}),
    CourtModel.deleteMany({}),
    VenueModel.deleteMany({}),
  ]);

  const venueId = newId();
  await VenueModel.create({
    id: venueId,
    name: 'Action Indoor Sports Christchurch',
    slug: 'action-christchurch',
    productTier: 'stadium',
    branding: { primaryColor: '#00c896', secondaryColor: '#1a2332' },
    courtCount: 4,
    sports: ['indoor-cricket', 'indoor-netball', 'indoor-football'],
  });

  const courts = await CourtModel.insertMany(
    ['Court 1', 'Court 2', 'Court 3', 'Court 4'].map((name, i) => ({
      id: newId(),
      venueId,
      name,
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
  for (const team of teams) {
    for (let i = 1; i <= 8; i++) {
      const displayName = `${team.name} Player ${i}`;
      const slug = await uniquePlayerSlug(venueId, displayName, async (vId, s) => {
        const existing = await PlayerModel.findOne({ venueId: vId, slug: s });
        return Boolean(existing);
      });
      players.push({
        id: newId(),
        venueId,
        firstName: `Player`,
        lastName: `${i}`,
        displayName,
        slug,
        teamIds: [team.id],
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
    { startDate: new Date().toISOString(), daysBetweenRounds: 7 }
  );

  await FixtureModel.insertMany(
    generated.map((f, idx) => ({
      ...f,
      id: newId(),
      venueId,
      courtId: courts[idx % courts.length].id,
    }))
  );

  console.log('Seed complete!');
  console.log(`Venue ID: ${venueId}`);
  console.log(`Venue slug: action-christchurch`);
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
    { startDate: new Date().toISOString(), daysBetweenRounds: 7 }
  );
  await FixtureModel.insertMany(
    netballFixtures.map((f, idx) => ({
      ...f,
      id: newId(),
      venueId,
      courtId: courts[(idx + 2) % courts.length].id,
    }))
  );
  console.log(`Netball Competition ID: ${netballCompId}`);

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
