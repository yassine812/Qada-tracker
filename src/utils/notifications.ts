export function formatArabicTime(timeStr: string): string {
  if (!timeStr || !timeStr.includes(':')) return timeStr;

  const [hStr, mStr] = timeStr.split(':');
  let hours = parseInt(hStr, 10);
  const minutes = mStr.padStart(2, '0');

  if (isNaN(hours)) return timeStr;

  const period = hours >= 12 ? 'مساءً' : 'صباحاً';
  if (hours === 0) hours = 12;
  else if (hours > 12) hours -= 12;

  return `${hours}:${minutes} ${period}`;
}
