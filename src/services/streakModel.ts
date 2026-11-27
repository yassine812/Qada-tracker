export const ACTIVITY_TYPES = ['app_open', 'qada_prayer', 'istighfar', 'quran', 'wird', 'adhkar', 'fasting'] as const;
export type ActivityType = typeof ACTIVITY_TYPES[number];
export interface ActivityEvent { eventId: string; type: ActivityType; date: string; occurredAt: string; timezone: string }
export interface Achievement { eventId: string; achievementId: string; type: 'streak'; unlockedAt: string }
export const STREAK_BADGES = [
  [1, 'بداية النور'], [3, 'نور الطريق'], [7, 'ثبات الخطى'], [14, 'ذكر واستمرار'],
  [30, 'طريق الطاعة'], [60, 'ثمر الاستمرار'], [100, 'نور الاستمرار'],
  [180, 'هلال الثبات'], [365, 'عام من الاستمرار'],
].map(([days, title]) => ({ id: `streak_${days}`, title: String(title), requirement: Number(days), category: 'streak' as const,
  description: `إنجاز شخصي للاستمرار في نشاطك داخل قضاء لمدة ${days} من الأيام المتتالية.` }));

export function validTimezone(zone: string): boolean {
  try { new Intl.DateTimeFormat('en', { timeZone: zone }).format(); return true; } catch { return false; }
}
export function activityDate(now = new Date(), timezone = Intl.DateTimeFormat().resolvedOptions().timeZone): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  return ['year', 'month', 'day'].map(key => parts.find(p => p.type === key)!.value).join('-');
}
export function shiftDate(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
export function streakSummary(events: ActivityEvent[], today: string) {
  const dates = [...new Set(events.map(e => e.date).filter(d => d <= today))].sort();
  let run = 0, longestStreak = 0, previous = '';
  for (const date of dates) {
    run = previous && shiftDate(previous, 1) === date ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    previous = date;
  }
  const lastActiveDate = dates.at(-1) || null;
  const currentStreak = lastActiveDate && lastActiveDate >= shiftDate(today, -1) ? run : 0;
  return { currentStreak, longestStreak, lastActiveDate, activeDates: dates,
    broken: Boolean(lastActiveDate && currentStreak === 0) };
}
// Earned achievements are a separate, append-only ledger. A new streak never removes them.
export function earnedAchievements(events: ActivityEvent[], existing: Achievement[] = []): Achievement[] {
  const result = new Map(existing.map(a => [a.achievementId, a]));
  const dates = [...new Set(events.map(e => e.date))].sort();
  let run = 0, previous = '';
  for (const date of dates) {
    run = previous && shiftDate(previous, 1) === date ? run + 1 : 1;
    for (const badge of STREAK_BADGES) if (run >= badge.requirement && !result.has(badge.id)) {
      result.set(badge.id, { eventId: crypto.randomUUID(), achievementId: badge.id, type: 'streak', unlockedAt: date });
    }
    previous = date;
  }
  return [...result.values()];
}
export function remainingDays(days: number) {
  if (days <= 0) return 'اكتمل الهدف';
  if (days === 1) return 'باقي يوم واحد';
  if (days === 2) return 'باقي يومان';
  return `باقي ${days} ${days <= 10 ? 'أيام' : 'يومًا'}`;
}
export function consecutiveDays(days: number) {
  if (days === 1) return 'يوم واحد من الاستمرار';
  if (days === 2) return 'يومان متتاليان';
  return `${days} ${days >= 3 && days <= 10 ? 'أيام متتالية' : 'يومًا متتاليًا'}`;
}
