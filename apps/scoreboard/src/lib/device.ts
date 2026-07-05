const DEVICE_TOKEN_KEY = 'sportsync-device-token';
const DEVICE_NAME_KEY = 'sportsync-device-name';
const VENUE_NAME_KEY = 'sportsync-venue-name';

export function getDeviceToken(): string | null {
  return localStorage.getItem(DEVICE_TOKEN_KEY);
}

export function setDeviceSession(data: { deviceToken: string; venueName: string; deviceName: string }) {
  localStorage.setItem(DEVICE_TOKEN_KEY, data.deviceToken);
  localStorage.setItem(VENUE_NAME_KEY, data.venueName);
  localStorage.setItem(DEVICE_NAME_KEY, data.deviceName);
}

export function clearDeviceSession() {
  localStorage.removeItem(DEVICE_TOKEN_KEY);
  localStorage.removeItem(VENUE_NAME_KEY);
  localStorage.removeItem(DEVICE_NAME_KEY);
}

export function getDeviceMeta() {
  return {
    venueName: localStorage.getItem(VENUE_NAME_KEY),
    deviceName: localStorage.getItem(DEVICE_NAME_KEY),
  };
}

async function deviceRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getDeviceToken();
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Device ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const scoreboardApi = {
  activate: (licenseKey: string, deviceName: string, courtId?: string) =>
    deviceRequest<{ deviceToken: string; venueName: string; deviceId: string }>('/licenses/activate', {
      method: 'POST',
      body: JSON.stringify({ licenseKey, deviceName, courtId }),
    }),
  session: () => deviceRequest<import('@sportsync/shared').ScoreboardSession>('/scoreboards/me'),
  heartbeat: () => deviceRequest<{ ok: boolean; matchId?: string; sport?: string }>('/scoreboards/me/heartbeat', { method: 'POST' }),
  validateLicense: (licenseKey: string) =>
    fetch(`/api/licenses/validate/${encodeURIComponent(licenseKey)}`).then(async (res) => {
      if (!res.ok) throw new Error('Invalid licence key');
      return res.json() as Promise<{ valid: boolean; venueName: string; scoreboardsRemaining: number }>;
    }),
};
