export type SportId =
  | 'indoor-cricket'
  | 'outdoor-cricket'
  | 'indoor-football'
  | 'outdoor-football'
  | 'indoor-netball'
  | 'outdoor-netball'
  | 'basketball'
  | 'touch-rugby'
  | 'rugby-union'
  | 'rugby-league';

export type ProductTier = 'club' | 'stadium';

export type AdminRole =
  | 'owner'
  | 'admin'
  | 'competition-manager'
  | 'scorer'
  | 'viewer';

export interface VenueSubscription {
  tier: ProductTier;
  maxCourts: number;
  maxSports: number;
  maxCompetitions: number;
  advancedReporting: boolean;
  multiAdmin: boolean;
}

export const TIER_LIMITS: Record<ProductTier, VenueSubscription> = {
  club: {
    tier: 'club',
    maxCourts: 2,
    maxSports: 1,
    maxCompetitions: 3,
    advancedReporting: false,
    multiAdmin: false,
  },
  stadium: {
    tier: 'stadium',
    maxCourts: 20,
    maxSports: 10,
    maxCompetitions: 50,
    advancedReporting: true,
    multiAdmin: true,
  },
};

export interface Venue {
  id: string;
  name: string;
  slug: string;
  productTier: ProductTier;
  subscription: VenueSubscription;
  branding: VenueBranding;
  courtCount: number;
  sports: SportId[];
  createdAt: string;
  updatedAt: string;
}

export interface VenueBranding {
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  sponsorBannerUrl?: string;
  scoreboardTheme?: string;
}

export interface Court {
  id: string;
  venueId: string;
  name: string;
  sport?: SportId;
  displayOrder: number;
}

export interface Team {
  id: string;
  venueId: string;
  name: string;
  shortName?: string;
  colors: {
    primary: string;
    secondary: string;
  };
  logoUrl?: string;
  captainId?: string;
  coachId?: string;
}

export interface Player {
  id: string;
  venueId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  teamIds: string[];
}

export interface PlayerSeasonStatsSummary {
  competitionId: string;
  competitionName?: string;
  season?: string;
  matchesPlayed: number;
  runs: number;
  wickets: number;
  catches: number;
}

export interface PlayerProfile extends Player {
  teams: Team[];
  stats: PlayerSeasonStatsSummary[];
}

export interface CompetitionSettings {
  formatKey?: 'six-aside' | 'eight-aside' | 'asia-cup';
  pointsForWin: number;
  pointsForTie: number;
  pointsForLoss: number;
  bonusPointThreshold?: number;
  doubleRoundRobin: boolean;
}

export interface Competition {
  id: string;
  venueId: string;
  sport: SportId;
  name: string;
  season: string;
  status: 'draft' | 'active' | 'completed';
  teamIds: string[];
  settings: CompetitionSettings;
  divisions: Division[];
  ladder: LadderEntry[];
}

export interface Division {
  id: string;
  name: string;
  grades: Grade[];
}

export interface Grade {
  id: string;
  name: string;
  poolIds: string[];
  roundIds: string[];
}

export interface Fixture {
  id: string;
  competitionId: string;
  gradeId: string;
  round: number;
  courtId?: string;
  homeTeamId: string;
  awayTeamId: string;
  scheduledAt?: string;
  status: 'scheduled' | 'live' | 'completed' | 'abandoned';
  matchId?: string;
  homeScore?: number;
  awayScore?: number;
  homeWickets?: number;
  awayWickets?: number;
  winnerTeamId?: string;
}

export interface LiveMatchSummary {
  matchId: string;
  fixtureId: string;
  venueId: string;
  competitionId: string;
  competitionName?: string;
  courtName?: string;
  homeTeamId: string;
  homeTeamName?: string;
  awayTeamId: string;
  awayTeamName?: string;
  homeScore: number;
  awayScore: number;
  homeWickets: number;
  awayWickets: number;
  status: string;
  over?: number;
  ball?: number;
}

export interface LadderEntry {
  teamId: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  points: number;
  bonusPoints: number;
  netRunRate?: number;
  position: number;
}

export interface LiveScoreSearchFilters {
  venueSlug?: string;
  competitionId?: string;
  courtId?: string;
  teamName?: string;
}

export const SOCKET_EVENTS = {
  MATCH_JOIN: 'match:join',
  MATCH_LEAVE: 'match:leave',
  MATCH_STATE: 'match:state',
  MATCH_BALL: 'match:ball',
  MATCH_UNDO: 'match:undo',
  MATCH_TIMER: 'match:timer',
  MATCH_SETUP: 'match:setup',
  NETBALL_GOAL: 'netball:goal',
  NETBALL_START: 'netball:start',
  NETBALL_END_QUARTER: 'netball:end-quarter',
  NETBALL_TIMER: 'netball:timer',
  SCOREBOARD_UPDATE: 'scoreboard:update',
  VENUE_LIVE: 'venue:live',
} as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
