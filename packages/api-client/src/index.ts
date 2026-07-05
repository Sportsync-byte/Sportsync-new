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
} from '@sportsync/shared';

const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
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
  venues: {
    list: () => request<Venue[]>('/venues'),
    get: (id: string) => request<Venue>(`/venues/${id}`),
    getBySlug: (slug: string) => request<Venue>(`/venues/slug/${slug}`),
    create: (data: Partial<Venue>) =>
      request<Venue>('/venues', { method: 'POST', body: JSON.stringify(data) }),
    courts: (venueId: string) => request<Court[]>(`/venues/${venueId}/courts`),
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
  },
  competitions: {
    list: (venueId: string) => request<Competition[]>(`/competitions/venue/${venueId}`),
    get: (id: string) => request<Competition>(`/competitions/${id}`),
    create: (data: {
      venueId: string;
      name: string;
      season?: string;
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
  },
  fixtures: {
    list: (venueId: string, status?: string) =>
      request<Fixture[]>(
        `/fixtures/venue/${venueId}${status ? `?status=${status}` : ''}`
      ),
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
    get: (matchId: string) => request<unknown>(`/matches/${matchId}`),
  },
};
