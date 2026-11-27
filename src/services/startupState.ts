// Entry UI belongs to the browser tab's app session, not a dashboard mount.
const launchMemory = new Set<string>();
const dailyMemory = new Map<string, string>();
const choiceKey = 'qada:notification-permission-requested:v1';
let notificationChoice = false;

export function hasSeenLaunchPrompt(name: string): boolean {
  if (launchMemory.has(name)) return true;
  try { return sessionStorage.getItem(`qada:launch:${name}`) === 'seen'; } catch { return false; }
}
export function markLaunchPromptSeen(name: string): void {
  launchMemory.add(name);
  try { sessionStorage.setItem(`qada:launch:${name}`, 'seen'); } catch { /* Memory still survives component remounts. */ }
}
// Unlike the welcome, the streak reminder stays dismissed across app launches.
export function hasSeenDailyPrompt(name: string, date: string): boolean {
  let seen = dailyMemory.get(name) || '';
  try { seen = [seen, localStorage.getItem(`qada:daily-prompt:${name}`) || ''].sort().at(-1)!; } catch { /* In-memory fallback. */ }
  return seen >= date;
}
export function markDailyPromptSeen(name: string, date: string): void {
  if (hasSeenDailyPrompt(name, date)) return;
  dailyMemory.set(name, date);
  try { localStorage.setItem(`qada:daily-prompt:${name}`, date); } catch { /* In-memory fallback. */ }
}
export function hasRequestedNotifications(): boolean {
  if (notificationChoice) return true;
  try { return localStorage.getItem(choiceKey) === 'asked'; } catch { return false; }
}
export function markNotificationsRequested(): void {
  notificationChoice = true;
  try { localStorage.setItem(choiceKey, 'asked'); } catch { /* The browser permission is also checked. */ }
}
