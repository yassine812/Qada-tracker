import { authClient } from './auth';
import { ActivityEvent, Achievement } from './streakModel';

export async function syncStreakAccount(userId: string, events: ActivityEvent[], achievements: Achievement[], timezone: string, setTimezone = false) {
  if (!authClient) throw new Error('Account unavailable');
  const { data } = await authClient.auth.getSession();
  if (data.session?.user.id !== userId) throw new Error('Account changed');
  // Pin this request to its original account's bearer token. A simultaneous logout/
  // login must never send account A's queued activity with account B's new token.
  const token = data.session.access_token;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/sync_daily_streak`, {
      method: 'POST', cache: 'no-store', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` },
      body: JSON.stringify({ p_events: events, p_achievements: achievements, p_timezone: timezone, p_set_timezone: setTimezone }),
    });
    if (!response.ok) throw new Error(`Streak sync failed (${response.status})`);
    const result = await response.json();
    if (!Array.isArray(result.events) || !Array.isArray(result.achievements) || typeof result.timezone !== 'string') throw new Error('Invalid streak response');
    return result as { events: ActivityEvent[]; achievements: Achievement[]; timezone: string };
  } finally { clearTimeout(timer); }
}
