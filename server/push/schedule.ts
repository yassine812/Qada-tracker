import { DateTime } from 'luxon';
import { Coordinates, Madhab, PrayerTimes } from 'adhan';
import { getCalculationParameters } from '../../src/utils/prayerTimes.js';
import { getPropheticDuaById } from '../../src/data/propheticDuas.js';
import { prayerIds, type PushPreferences, type ReminderKind } from '../../src/services/pushPreferences.js';

export type PushPayload = { title: string; body: string; url: string; icon: string; badge: string; tag: string; data: Record<string, unknown> };
export type PlannedJob = { notification_id: string; kind: string; due_at: string; expires_at: string; payload: PushPayload };
const prayerNames = { fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' };
// Pending jobs can contain older wording; refresh prayer copy when delivering.
export function currentPrayerPayload(payload: PushPayload, kind: string): PushPayload {
  if (!Object.hasOwn(prayerNames, kind)) return payload;
  return { ...payload, body: `حان وقت صلاة ${prayerNames[kind as keyof typeof prayerNames]}.` };
}
const messages: Record<ReminderKind, [string, string, string]> = {
  morning: ['أذكار الصباح 🌿', 'حان وقت أذكار الصباح.', '/app/adhkar?category=morning'],
  evening: ['أذكار المساء 🌙', 'حان وقت أذكار المساء.', '/app/adhkar?category=evening'],
  sleep: ['أذكار النوم 🌙', 'قبل أن تنام، لا تنس أذكار النوم.', '/app/adhkar?category=sleep'],
  istighfar: ['استغفار اليوم 🤍', 'خصص لحظات للاستغفار اليوم.', '/app/istighfar'],
  quran: ['ورد القرآن 📖', 'حان وقت وردك اليومي.', '/app/quran'],
  dua: ['دعاء اليوم 🤲', 'افتح قضاء لقراءة دعاء اليوم.', '/app/dua'],
  fasting: ['تذكير الصيام 🌙', 'تذكير بموعد الصيام الذي اخترته للمتابعة الشخصية.', '/app/prayer?section=fasting'],
};
const whiteDayDuas: Record<number, string> = {
  13: 'اللهم أعنّي على ذكرك وشكرك وحسن عبادتك، وتقبّل مني صيامي ودعائي.',
  14: 'رب اغفر لي وتب عليّ، وبارك لي في صيامي وعملي، واجعلني من الذاكرين.',
  15: 'اللهم تقبّل صيام أيام البيض، واغفر لي ولوالديّ، واهدني لأحسن الأعمال.',
};
const whiteDayAdvice: Record<number, string> = {
  13: 'نصيحة اليوم: اجعل لسانك رطبًا بالذكر، واقرأ ولو صفحات قليلة من القرآن.',
  14: 'نصيحة اليوم: أكثر من الدعاء قبل المغرب، واحتسب صيامك لله بهدوء وإخلاص.',
  15: 'نصيحة اليوم: اختم أيام البيض بالشكر، وواصل الطاعة بخطوة صغيرة كل يوم.',
};
export function payloadFor(id: string, title: string, body: string, url: string): PushPayload {
  return { title, body, url, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', tag: `qada:${id}`, data: { notificationId: id } };
}
function hijriDay(day: DateTime): number {
  return Number(new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { timeZone: day.zoneName, day: 'numeric' }).format(day.toJSDate()));
}
export function planNotifications(preferences: PushPreferences, timezone: string, now: Date, duas: Record<string, string>, days = 3): PlannedJob[] {
  if (!preferences.enabled) return [];
  const local = DateTime.fromJSDate(now).setZone(timezone);
  const jobs: PlannedJob[] = [];
  for (let offset = 0; offset < days; offset++) {
    const day = local.startOf('day').plus({ days: offset });
    const date = day.toISODate()!;
    const append = (kind: string, due: DateTime, title: string, body: string, url: string) => {
      // Do not replay yesterday or hours of reminders after an outage/new subscription.
      if (!due.isValid || due.toMillis() < now.getTime() - 60_000) return;
      const notification_id = `${date}:${kind}`;
      jobs.push({ notification_id, kind, due_at: due.toUTC().toISO()!, expires_at: due.plus({ minutes: 15 }).toUTC().toISO()!,
        payload: payloadFor(notification_id, title, body, url) });
    };
    const at = (time: string) => {
      const [hour, minute] = time.split(':').map(Number);
      // Luxon advances nonexistent DST times; choose the first instant on repeats.
      const instant = DateTime.fromObject({ year: day.year, month: day.month, day: day.day, hour, minute }, { zone: timezone });
      return instant.getPossibleOffsets().sort((a, b) => a.toMillis() - b.toMillis())[0] ?? instant;
    };
    if (preferences.qadaTracking?.hasRemaining && !preferences.qadaTracking.completedDates.includes(date)) {
      append('qada-tracker', at('21:00'), 'خطوة اليوم مع قضاء 🌿',
        'لم تسجّل صلاة قضاء اليوم. خذ لحظة لصلاة مما فاتك، ثم سجّلها في قضاء. وإن صلّيت بالفعل، أضفها إلى سجلك.',
        '/app/prayer');
    }
    const dayHijri = hijriDay(day);
    // The Ayyam al-Bid experience is a built-in Qada feature, not an optional
    // per-device reminder. It must continue to work even when the user has
    // disabled the separate personal fasting reminder in settings.
    const whiteDaySelected = [13, 14, 15].includes(dayHijri);
    const whiteDayEnabled = true;
    if (whiteDayEnabled && dayHijri === 12) {
      const selected = '13 و 14 و 15';
      append('white-day-prep', at('18:00'), 'استعداد لأيام البيض 🌙', `غدًا تبدأ أيام البيض المختارة (${selected} هجري). جهّز نيتك وادعُ الله أن يعينك على الصيام.`, '/app/prayer?section=fasting');
    }
    if (whiteDayEnabled && whiteDaySelected) {
      append('white-day-dua', at('10:00'), `دعاء يوم ${dayHijri} من أيام البيض 🤲`, whiteDayDuas[dayHijri] || 'اللهم تقبّل صيامي ودعائي.', '/app/dua');
      append('white-day-advice', at('16:00'), `نصيحة يوم ${dayHijri} من أيام البيض 🌿`, whiteDayAdvice[dayHijri] || 'اجعل يومك عامرًا بالذكر والقرآن.', '/app/quran');
    }
    // Morning/evening/sleep adhkar are tied to prayer times below. They are
    // intentionally not read from editable clock preferences.
    for (const [kind, pref] of Object.entries(preferences.reminders)) {
      if (kind === 'morning' || kind === 'evening' || kind === 'sleep') continue;
      const isWhiteDay = kind === 'fasting' && whiteDaySelected;
      if (!pref.enabled || (kind === 'fasting' && !preferences.fastingDays.includes(day.weekday) && !isWhiteDay)) continue;
      const [title, defaultBody, url] = messages[kind as ReminderKind];
      if (kind === 'dua' && !duas[date]) continue;
      const dua = kind === 'dua' ? getPropheticDuaById(duas[date]) : undefined;
      const body = dua ? dua.arabic.slice(0, 1000) : isWhiteDay ? `اليوم ${hijriDay(day)} من الشهر الهجري — تذكير بأيام البيض للصيام الذي اخترته.` : defaultBody;
      append(kind, at(pref.time), title, body, kind === 'dua' ? `${url}?dua=${encodeURIComponent(duas[date])}&date=${date}` : url);
    }
    // Prayer times are always needed because the three daily adhkar reminders
    // are automatically scheduled relative to Fajr, Asr and Isha.
    const needsPrayerTimes = true;
    let prayers: PrayerTimes | undefined;
    if (needsPrayerTimes) {
      const p = preferences.prayerSettings;
      const params = getCalculationParameters(p.method);
      params.madhab = p.madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
      // Adhan reads the supplied calendar components, then returns absolute UTC instants.
      const calendarDate = new Date(day.year, day.month - 1, day.day);
      prayers = new PrayerTimes(new Coordinates(p.latitude, p.longitude), calendarDate, params);
    }
    if (prayers) {
      const afterPrayer = (prayer: Date, minutes = 15) => DateTime.fromJSDate(prayer).setZone(timezone).plus({ minutes });
      append('morning', afterPrayer(prayers.fajr), 'أذكار الصباح 🌿', 'بعد الفجر، حان وقت أذكار الصباح. ابدأ يومك بذكر الله.', '/app/adhkar?category=morning');
      append('evening', afterPrayer(prayers.asr), 'أذكار المساء 🌙', 'بعد العصر، حان وقت أذكار المساء. اختم نهارك بذكر الله.', '/app/adhkar?category=evening');
      append('sleep', afterPrayer(prayers.isha), 'أذكار النوم 🌙', 'بعد العشاء، لا تنس أذكار النوم قبل أن تنام.', '/app/adhkar?category=sleep');
      const maghrib = DateTime.fromJSDate(prayers.maghrib).setZone(timezone);
      if (whiteDaySelected) {
        append('before-maghrib', maghrib.minus({ minutes: 30 }), 'قبل المغرب 🤲📖', 'اقترب المغرب؛ خذ لحظة للدعاء واقرأ وردًا من القرآن. تقبّل الله طاعتك.', '/app/dua');
      }
      if (whiteDayEnabled && whiteDaySelected) {
        append('white-day-congrats', maghrib.plus({ minutes: 30 }), 'مبارك إتمام صيامك 🌙', `تقبّل الله صيام يوم ${dayHijri} من أيام البيض، وجعل دعاءك وقراءتك نورًا لك.`, '/app/prayer?section=fasting');
      }
    }
    for (const custom of preferences.custom) {
      if (custom.enabled && custom.days.includes(day.weekday)) {
        append(`custom-${custom.id}`, at(custom.time), 'تذكير قضاء 🌿', 'حان موعد تذكيرك الشخصي.', '/app');
      }
    }
    if (prayers && prayerIds.some(id => preferences.prayers[id])) {
      for (const id of prayerIds) if (preferences.prayers[id]) {
        append(id, DateTime.fromJSDate(prayers[id]), `حان وقت صلاة ${prayerNames[id]} 🕌`, `حان وقت صلاة ${prayerNames[id]}.`, '/app/prayer');
      }
    }
  }
  return jobs;
}
