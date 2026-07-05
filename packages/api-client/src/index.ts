import type {
  Venue,
  Court,
  Team,
  Player,
  Competition,
  Fixture,
  LadderEntry,
  LiveMatchSummary,
  CompetitionSettings,
  AdminRole,
} from '@sportsync/shared';

const BASE = '/api';
const TOKEN_KEY = 'sportsync-token';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  venueId: string;
  role: AdminRole;
}

export interface PlayerStats {
  playerId: string;
  venueId: string;
  competitionId?: string;
  matchesPlayed: number;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  ducks: number;
  wickets: number;
  overs: number;
  runsConceded: number;
  catches: number;
  runOuts: number;
  stumpings: number;
  goals: number;
  assists: number;
}

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: AuthUser }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    me: () => request<{ user: AuthUser }>('/auth/me'),
    logout: () => setAuthToken(null),
  },
  venues: {
    list: () => request<Venue[]>('/venues'),
    get: (id: string) => request<Venue>(`/venues/${id}`),
    getBySlug: (slug: string) => request<Venue>(`/venues/slug/${slug}`),
    create: (data: Partial<Venue>) =>
      request<Venue>('/venues', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Venue>) =>
      request<Venue>(`/venues/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    courts: (venueId: string) => request<Court[]>(`/venues/${venueId}/courts`),
    license: (venueId: string) =>
      request<{ licenseKey: string; maxScoreboards: number; activeScoreboards: number; extraScoreboards: number; smsEnabled: boolean }>(
        `/venues/${venueId}/license`
      ),
    addExtraScoreboards: (venueId: string, count = 1) =>
      request<Venue>(`/venues/${venueId}/extra-scoreboards`, {
        method: 'POST',
        body: JSON.stringify({ count }),
      }),
  },
  scoreboards: {
    list: (venueId: string) =>
      request<{ devices: import('@sportsync/shared').ScoreboardDevice[]; limit: number; active: number }>(
        `/scoreboards/venue/${venueId}`
      ),
    update: (deviceId: string, data: { name?: string; courtId?: string; assignedMatchId?: string }) =>
      request<import('@sportsync/shared').ScoreboardDevice>(`/scoreboards/${deviceId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    revoke: (deviceId: string) =>
      request<import('@sportsync/shared').ScoreboardDevice>(`/scoreboards/${deviceId}`, { method: 'DELETE' }),
  },
  notifications: {
    smsStatus: (venueId: string) =>
      request<{ configured: boolean; enabled: boolean; error?: string }>(`/notifications/sms/status/${venueId}`),
    sendSms: (venueId: string, to: string[], message: string) =>
      request<{ sent: number; failed: string[] }>('/notifications/sms/send', {
        method: 'POST',
        body: JSON.stringify({ venueId, to, message }),
      }),
    fixtureReminder: (fixtureId: string, to: string[]) =>
      request<{ sent: number; failed: string[]; message: string }>(`/notifications/sms/fixture/${fixtureId}`, {
        method: 'POST',
        body: JSON.stringify({ to }),
      }),
  },
  teams: {
    list: (venueId: string) => request<Team[]>(`/teams/venue/${venueId}`),
    create: (data: Partial<Team> & { venueId: string; name: string }) =>
      request<Team>('/teams', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Team>) =>
      request<Team>(`/teams/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/teams/${id}`, { method: 'DELETE' }),
  },
  players: {
    list: (venueId: string, teamId?: string) =>
      request<Player[]>(`/players/venue/${venueId}${teamId ? `?teamId=${teamId}` : ''}`),
    create: (data: Partial<Player> & { venueId: string; firstName: string; lastName: string }) =>
      request<Player>('/players', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/players/${id}`, { method: 'DELETE' }),
    publicProfile: (playerId: string) => request<import('@sportsync/shared').PlayerProfile>(`/players/public/${playerId}`),
    publicProfileBySlug: (slug: string, venueId?: string) =>
      request<import('@sportsync/shared').PlayerProfile>(
        `/players/public/slug/${slug}${venueId ? `?venueId=${venueId}` : ''}`
      ),
    search: (venueId: string, q: string) =>
      request<import('@sportsync/shared').Player[]>(`/players/public/search?venueId=${venueId}&q=${encodeURIComponent(q)}`),
    stats: (playerId: string, competitionId?: string) =>
      request<PlayerStats[]>(
        `/stats/player/${playerId}${competitionId ? `?competitionId=${competitionId}` : ''}`
      ),
  },
  competitions: {
    list: (venueId: string) => request<Competition[]>(`/competitions/venue/${venueId}`),
    get: (id: string) => request<Competition>(`/competitions/${id}`),
    create: (data: {
      venueId: string;
      name: string;
      season?: string;
      sport?: string;
      teamIds?: string[];
      settings?: Partial<CompetitionSettings>;
    }) => request<Competition>('/competitions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Competition>) =>
      request<Competition>(`/competitions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    fixtures: (id: string) => request<Fixture[]>(`/competitions/${id}/fixtures`),
    generateFixtures: (id: string, opts?: { startDate?: string; daysBetweenRounds?: number }) =>
      request<Fixture[]>(`/competitions/${id}/generate-fixtures`, {
        method: 'POST',
        body: JSON.stringify(opts || {}),
      }),
    ladder: (id: string) => request<LadderEntry[]>(`/competitions/${id}/ladder`),
    stats: (id: string) => request<PlayerStats[]>(`/stats/competition/${id}`),
    leaders: (id: string) =>
      request<{ topRunScorer?: PlayerStats; topWicketTaker?: PlayerStats; playerCount: number }>(
        `/stats/competition/${id}/leaders`
      ),
  },
  fixtures: {
    list: (venueId: string, status?: string) =>
      request<Fixture[]>(`/fixtures/venue/${venueId}${status ? `?status=${status}` : ''}`),
    update: (id: string, data: Partial<Fixture>) =>
      request<Fixture>(`/fixtures/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    start: (fixtureId: string) =>
      request<{ fixture: Fixture; match: unknown }>(`/fixtures/${fixtureId}/start`, {
        method: 'POST',
      }),
  },
  live: {
    search: (params: Record<string, string>) => {
      const qs = new URLSearchParams(params).toString();
      return request<LiveMatchSummary[]>(`/live/search?${qs}`);
    },
  },
  matches: {
    get: (matchId: string) => request<{ sport?: string; venueId?: string; state: unknown }>(`/matches/${matchId}`),
  },
  export: {
    ladderCsv: (competitionId: string) => `/api/export/competition/${competitionId}/ladder.csv`,
    ladderPdf: (competitionId: string) => `/api/export/competition/${competitionId}/ladder.pdf`,
    statsCsv: (competitionId: string) => `/api/export/competition/${competitionId}/stats.csv`,
    scorecardCsv: (matchId: string) => `/api/export/match/${matchId}/scorecard.csv`,
    scorecardPdf: (matchId: string) => `/api/export/match/${matchId}/scorecard.pdf`,
  },
  billing: {
    status: (venueId: string) =>
      request<{ productTier: string; billingStatus: string; stripeConfigured: boolean }>(
        `/billing/status/${venueId}`
      ),
    checkout: (venueId: string) =>
      request<{ url: string }>('/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ venueId }),
      }),
  },
};
