import type { SportId } from './types.js';
import type { IndoorCricketFormatConfig } from './indoor-cricket.js';
import type { IndoorNetballFormatConfig } from './indoor-netball.js';
import type { IndoorFootballFormatConfig } from './indoor-football.js';
import type { TouchRugbyFormatConfig } from './touch-rugby.js';
import { INDOOR_NETBALL_FORMAT } from './indoor-netball.js';
import { INDOOR_FOOTBALL_FORMAT } from './indoor-football.js';
import { TOUCH_RUGBY_FORMAT } from './touch-rugby.js';

/** Maps competition sport to the scoring engine implementation. */
export function scoringEngineSport(sport: SportId): SportId {
  const aliases: Partial<Record<SportId, SportId>> = {
    'outdoor-cricket': 'indoor-cricket',
    'outdoor-football': 'indoor-football',
    'outdoor-netball': 'indoor-netball',
    'rugby-union': 'touch-rugby',
    'rugby-league': 'touch-rugby',
  };
  return aliases[sport] ?? sport;
}

export const OUTDOOR_CRICKET_FORMAT: IndoorCricketFormatConfig = {
  format: 'eight-aside',
  playersPerSide: 11,
  totalOvers: 20,
  partnerships: 5,
  oversPerPartnership: 4,
  inningsDurationSeconds: 3600,
};

export const OUTDOOR_FOOTBALL_FORMAT: IndoorFootballFormatConfig = {
  playersPerSide: 11,
  halves: 2,
  halfDurationSeconds: 2700,
};

export const OUTDOOR_NETBALL_FORMAT: IndoorNetballFormatConfig = {
  playersPerSide: 7,
  quarters: 4,
  quarterDurationSeconds: 900,
};

export const RUGBY_UNION_FORMAT: TouchRugbyFormatConfig = {
  playersPerSide: 15,
  halves: 2,
  halfDurationSeconds: 2400,
};

export const RUGBY_LEAGUE_FORMAT: TouchRugbyFormatConfig = {
  playersPerSide: 13,
  halves: 2,
  halfDurationSeconds: 2400,
};

export const COMPETITION_SPORTS: { id: SportId; label: string }[] = [
  { id: 'indoor-cricket', label: 'Indoor Cricket' },
  { id: 'outdoor-cricket', label: 'Outdoor Cricket' },
  { id: 'indoor-netball', label: 'Indoor Netball' },
  { id: 'outdoor-netball', label: 'Outdoor Netball' },
  { id: 'indoor-football', label: 'Indoor Football' },
  { id: 'outdoor-football', label: 'Outdoor Football' },
  { id: 'basketball', label: 'Basketball' },
  { id: 'touch-rugby', label: 'Touch Rugby' },
  { id: 'rugby-union', label: 'Rugby Union' },
  { id: 'rugby-league', label: 'Rugby League' },
];

export function sportDisplayName(sport: SportId): string {
  const names: Record<SportId, string> = {
    'indoor-cricket': 'Indoor Cricket',
    'outdoor-cricket': 'Outdoor Cricket',
    'indoor-football': 'Indoor Football',
    'outdoor-football': 'Outdoor Football',
    'indoor-netball': 'Indoor Netball',
    'outdoor-netball': 'Outdoor Netball',
    basketball: 'Basketball',
    'touch-rugby': 'Touch Rugby',
    'rugby-union': 'Rugby Union',
    'rugby-league': 'Rugby League',
  };
  return names[sport] ?? sport;
}

export function netballFormatFor(sport: SportId): IndoorNetballFormatConfig {
  return sport === 'outdoor-netball' ? OUTDOOR_NETBALL_FORMAT : INDOOR_NETBALL_FORMAT;
}

export function footballFormatFor(sport: SportId): IndoorFootballFormatConfig {
  return sport === 'outdoor-football' ? OUTDOOR_FOOTBALL_FORMAT : INDOOR_FOOTBALL_FORMAT;
}

export function rugbyFormatFor(sport: SportId): TouchRugbyFormatConfig {
  if (sport === 'rugby-union') return RUGBY_UNION_FORMAT;
  if (sport === 'rugby-league') return RUGBY_LEAGUE_FORMAT;
  return TOUCH_RUGBY_FORMAT;
}
