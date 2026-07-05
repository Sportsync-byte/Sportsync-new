import crypto from 'node:crypto';

export function generateLicenseKey(): string {
  const segment = () => crypto.randomBytes(2).toString('hex').toUpperCase();
  return `SSYNC-${segment()}-${segment()}-${segment()}`;
}

export function generateDeviceToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function maskLicenseKey(key: string): string {
  const parts = key.split('-');
  if (parts.length < 4) return '****';
  return `${parts[0]}-${parts[1]}-****-****`;
}
