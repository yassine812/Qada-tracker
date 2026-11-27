import type { BackupData, PrayerCounters, UserSettings } from '../types';
import { authClient } from './auth';

export type AccountBackup = BackupData;

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

/** Only accept a complete, app-shaped snapshot before replacing local data. */
export function isAccountBackup(value: unknown): value is AccountBackup {
  if (!isObject(value) || !isObject(value.settings) || !isObject(value.counters)) return false;
  const settings = value.settings as Partial<UserSettings>;
  const counters = value.counters as Partial<PrayerCounters>;
  return settings.hasCompletedOnboarding === true
    && typeof settings.currentAge === 'number'
    && typeof settings.pubertyAge === 'number'
    && Array.isArray(value.records)
    && ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].every((key) => isObject(counters[key as keyof PrayerCounters]));
}

export function hasAccountBackup(settings: UserSettings | null, counters: PrayerCounters | null): settings is UserSettings {
  return !!settings?.hasCompletedOnboarding && !!counters;
}

export function snapshotChangedAt(snapshot: AccountBackup): number {
  const values = [
    Date.parse(snapshot.settings.updatedAt),
    ...snapshot.records.map((record) => record.timestamp),
    ...(snapshot.istighfarRecords || []).map((record) => record.timestamp),
    snapshot.istighfarData ? Date.parse(snapshot.istighfarData.updatedAt) : 0,
  ];
  const changedAt = Math.max(...values.filter(Number.isFinite), 0);
  return changedAt || Date.parse(snapshot.exportedAt) || 0;
}

/**
 * Keep a compact recovery copy in the authenticated user's metadata as well.
 * The table is the source of truth for full history; this guarantees that a
 * name/profile/onboarding restoration still works if PostgREST is unavailable
 * when a user first opens the app on a new device.
 */
function compactAccountBackup(backup: AccountBackup): AccountBackup {
  return {
    version: backup.version,
    exportedAt: backup.exportedAt,
    settings: backup.settings,
    counters: backup.counters,
    records: [],
    istighfarRecords: [],
    istighfarData: backup.istighfarData,
  };
}

export function accountMetadataBackup(metadata: unknown): AccountBackup | null {
  if (!isObject(metadata)) return null;
  const backup = metadata.qada_profile_backup;
  return isAccountBackup(backup) ? backup : null;
}

export async function saveAccountMetadataBackup(backup: AccountBackup): Promise<void> {
  if (!authClient) return;
  const { error } = await authClient.auth.updateUser({
    data: { qada_profile_backup: compactAccountBackup(backup) },
  });
  if (error) throw error;
}

async function requestBackup(accessToken: string, init?: RequestInit) {
  const response = await fetch('/api/account/backup', {
    ...init,
    cache: 'no-store',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'backup_unavailable');
  return data;
}

export async function fetchAccountBackup(accessToken: string): Promise<{ backup: AccountBackup; updatedAt: string } | null> {
  const data = await requestBackup(accessToken);
  if (!data || !isAccountBackup(data.backup) || typeof data.updatedAt !== 'string') return null;
  return { backup: data.backup, updatedAt: data.updatedAt };
}

export async function saveAccountBackup(accessToken: string, backup: AccountBackup): Promise<void> {
  await requestBackup(accessToken, { method: 'PUT', body: JSON.stringify({ backup }) });
}
