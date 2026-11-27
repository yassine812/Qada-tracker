import { ActivityEvent, Achievement, activityDate, earnedAchievements } from '../services/streakModel';

export interface StreakCache {
  userId: string; timezone: string; events: ActivityEvent[]; achievements: Achievement[];
  pendingIds: string[]; announced: string[];
}
export const emptyStreakCache = (userId: string, timezone: string): StreakCache => ({ userId, timezone, events: [], achievements: [], pendingIds: [], announced: [] });
let database: Promise<IDBDatabase> | undefined;
function open() {
  return database ||= new Promise((resolve, reject) => {
    const request = indexedDB.open('qada-account-streaks', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('accounts', { keyPath: 'userId' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { database = undefined; reject(request.error); };
  });
}
// One read/write transaction serializes same-account writes even between browser tabs.
export async function updateStreakCache(userId: string, timezone: string, update: (state: StreakCache) => StreakCache): Promise<StreakCache> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('accounts', 'readwrite');
    const store = tx.objectStore('accounts');
    let next: StreakCache;
    const request = store.get(userId);
    request.onsuccess = () => {
      try { next = update(request.result || emptyStreakCache(userId, timezone)); store.put(next); }
      catch { tx.abort(); }
    };
    tx.oncomplete = () => resolve(next);
    tx.onabort = tx.onerror = () => reject(tx.error || new Error('Streak storage unavailable'));
  });
}
export function appendActivity(state: StreakCache, event: ActivityEvent): StreakCache {
  // Multiple activities still produce one active calendar day, with one event per type/day.
  if (state.events.some(e => e.date === event.date && e.type === event.type)) return state;
  const events = [...state.events, event];
  return { ...state, events, pendingIds: [...state.pendingIds, event.eventId], achievements: earnedAchievements(events, state.achievements) };
}
// Visiting on a new account-calendar day counts once, even across tabs/reopens.
export function appendDailyVisit(state: StreakCache, now = new Date()): StreakCache {
  const date = activityDate(now, state.timezone);
  if (state.events.some(event => event.type === 'app_open' && event.date === date)) return state;
  return appendActivity(state, {
    eventId: crypto.randomUUID(), type: 'app_open', date,
    occurredAt: now.toISOString(), timezone: state.timezone,
  });
}
export function mergeStreakCache(state: StreakCache, remote: Pick<StreakCache, 'events' | 'achievements' | 'timezone'>, acknowledged: string[]): StreakCache {
  const events = [...new Map([...state.events, ...remote.events].map(e => [e.eventId, e])).values()];
  const achievements = [...new Map([...state.achievements, ...remote.achievements].map(a => [a.achievementId, a])).values()];
  return { ...state, timezone: remote.timezone, events, achievements: earnedAchievements(events, achievements),
    pendingIds: state.pendingIds.filter(id => !acknowledged.includes(id)) };
}
