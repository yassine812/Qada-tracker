import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { authClient } from '../services/auth';
import { syncStreakAccount } from '../services/streakSync';
import { ActivityType, activityDate, streakSummary, validTimezone } from '../services/streakModel';
import { appendActivity, appendDailyVisit, emptyStreakCache, mergeStreakCache, StreakCache, updateStreakCache } from '../storage/streakStore';

type SyncStatus = 'loading' | 'saved' | 'pending' | 'error';
interface StreakContextValue {
  cache: StreakCache; today: string; summary: ReturnType<typeof streakSummary>; status: SyncStatus;
  recordDailyActivity: (type: ActivityType) => Promise<void>;
  isDailyActivityCompleted: (date: string) => boolean;
  acknowledge: (id: string) => void; setTimezone: (zone: string) => Promise<void>; retry: () => void;
}
export const StreakContext = createContext<StreakContextValue | null>(null);
export function useStreak() {
  const value = useContext(StreakContext);
  if (!value) throw new Error('StreakProvider is required');
  return value;
}

export function StreakProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const uid = session?.user.id || '';
  const deviceZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const [cache, setCache] = useState(() => emptyStreakCache('', deviceZone));
  const [status, setStatus] = useState<SyncStatus>('loading');
  const [clock, setClock] = useState(Date.now());
  const operations = useRef<{ record: (type: ActivityType) => Promise<void>; ack: (id: string) => void; zone: (z: string) => Promise<void>; sync: () => void } | null>(null);

  useEffect(() => {
    setCache(emptyStreakCache(uid, deviceZone));
    setStatus('loading');
    if (!uid) { operations.current = null; return; }
    let stopped = false, syncing = false, resync = false, hydrated = false;
    let requestedZone: string | undefined;
    let latest = emptyStreakCache(uid, deviceZone);
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(`qada-streak-${uid}`) : null;
    const publish = (state: StreakCache) => { latest = state; if (!stopped) setCache(state); };
    const failure = () => { if (!stopped) setStatus(navigator.onLine ? 'error' : 'pending'); };
    const sync = async (newZone?: string) => {
      if (stopped) return;
      if (newZone) requestedZone = newZone;
      if (syncing) { resync = true; return; }
      syncing = true;
      try {
        publish(await updateStreakCache(uid, deviceZone, s => s));
        if (!navigator.onLine || !authClient) {
          publish(await updateStreakCache(uid, deviceZone, s => appendDailyVisit(s)));
          if (!stopped) setStatus('pending');
          return;
        }
        const outgoing = latest.events.filter(e => latest.pendingIds.includes(e.eventId)).slice(0, 500);
        const zoneChange = requestedZone;
        const data = await syncStreakAccount(uid, outgoing, latest.achievements, zoneChange || latest.timezone, Boolean(zoneChange));
        if (requestedZone === zoneChange) requestedZone = undefined;
        if (stopped) return;
        const next = await updateStreakCache(uid, deviceZone, s => {
          const merged = mergeStreakCache(s, data, outgoing.map(e => e.eventId));
          // Existing cloud awards load quietly; new local/offline achievements still celebrate.
          if (!hydrated) merged.announced = [...new Set([...s.announced, ...data.achievements
            .filter(a => !s.achievements.some(local => local.achievementId === a.achievementId)).map(a => a.achievementId)])];
          // Use the restored account timezone before recording today's visit.
          return appendDailyVisit(merged);
        });
        hydrated = true;
        publish(next);
        setStatus(next.pendingIds.length ? 'pending' : 'saved');
        if (next.pendingIds.length) resync = true;
      } catch {
        // A temporary sync failure must not lose an offline daily visit.
        if (!stopped) {
          try { publish(await updateStreakCache(uid, deviceZone, s => appendDailyVisit(s))); } catch { /* Retry on focus/online. */ }
          failure();
        }
      }
      finally {
        syncing = false;
        if (resync && !stopped) { resync = false; void sync(); }
      }
    };
    operations.current = {
      record: async type => {
        try {
          const now = new Date();
          const next = await updateStreakCache(uid, deviceZone, s => appendActivity(s, {
            eventId: crypto.randomUUID(), type, date: activityDate(now, s.timezone), occurredAt: now.toISOString(), timezone: s.timezone,
          }));
          if (stopped) return;
          publish(next); setStatus('pending'); channel?.postMessage('changed'); void sync();
        } catch { failure(); }
      },
      ack: id => { void updateStreakCache(uid, deviceZone, s => ({ ...s, announced: [...new Set([...s.announced, id])] })).then(publish).catch(failure); },
      zone: async zone => { if (validTimezone(zone)) await sync(zone); },
      sync: () => { setClock(Date.now()); void sync(); },
    };
    const refresh = () => { if (document.visibilityState === 'visible') { setClock(Date.now()); void sync(); } };
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener('online', refresh);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    if (channel) channel.onmessage = refresh;
    void sync();
    return () => {
      stopped = true; operations.current = null; channel?.close(); clearInterval(timer);
      window.removeEventListener('online', refresh); window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [uid]);
  // Never render another account's cache, even during the effect boundary after logout.
  const visible = cache.userId === uid ? cache : emptyStreakCache(uid, deviceZone);
  const today = activityDate(new Date(clock), visible.timezone);
  const summary = useMemo(() => streakSummary(visible.events, today), [visible.events, today]);
  const value: StreakContextValue = {
    cache: visible, today, summary, status,
    recordDailyActivity: type => operations.current?.record(type) || Promise.resolve(),
    isDailyActivityCompleted: date => visible.events.some(e => e.date === date),
    acknowledge: id => operations.current?.ack(id),
    setTimezone: zone => operations.current?.zone(zone) || Promise.resolve(),
    retry: () => operations.current?.sync(),
  };
  return <StreakContext.Provider value={value}>{children}</StreakContext.Provider>;
}
