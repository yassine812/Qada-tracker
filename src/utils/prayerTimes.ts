import {
  Coordinates,
  CalculationMethod,
  PrayerTimes,
  SunnahTimes,
  Qibla,
  Madhab,
  HighLatitudeRule,
  CalculationParameters
} from 'adhan';

export interface PrayerTimeItem {
  id: 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  name: string;
  time: Date;
  formattedTime: string;
  isNext: boolean;
  isCurrent: boolean;
}

export interface CityOption {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

// Comprehensive Tunisian Cities + Major Islamic/World Cities
export const POPULAR_CITIES: CityOption[] = [
  // Tunisia Governorates
  { id: 'tn-tunis', name: 'تونس العاصمة', country: 'تونس', latitude: 36.8065, longitude: 10.1815 },
  { id: 'tn-sfax', name: 'صفاقس', country: 'تونس', latitude: 34.7406, longitude: 10.7603 },
  { id: 'tn-sousse', name: 'سوسة', country: 'تونس', latitude: 35.8256, longitude: 10.6084 },
  { id: 'tn-kairouan', name: 'القيروان', country: 'تونس', latitude: 35.6781, longitude: 10.0963 },
  { id: 'tn-bizerte', name: 'بنزرت', country: 'تونس', latitude: 37.2744, longitude: 9.8739 },
  { id: 'tn-gabes', name: 'قابس', country: 'تونس', latitude: 33.8815, longitude: 10.0982 },
  { id: 'tn-monastir', name: 'المنستير', country: 'تونس', latitude: 35.7780, longitude: 10.8262 },
  { id: 'tn-nabeul', name: 'نابل / الحمامات', country: 'تونس', latitude: 36.4561, longitude: 10.7376 },
  { id: 'tn-ariana', name: 'أريانة', country: 'تونس', latitude: 36.8625, longitude: 10.1956 },
  { id: 'tn-ben-arous', name: 'بن عروس', country: 'تونس', latitude: 36.7533, longitude: 10.2222 },
  { id: 'tn-medenine', name: 'مدنين / جربة', country: 'تونس', latitude: 33.3549, longitude: 10.4927 },
  { id: 'tn-tataouine', name: 'تطاوين', country: 'تونس', latitude: 32.9297, longitude: 10.4518 },
  { id: 'tn-gafsa', name: 'قفصة', country: 'تونس', latitude: 34.4250, longitude: 8.7842 },
  { id: 'tn-tozeur', name: 'توزر', country: 'تونس', latitude: 33.9197, longitude: 8.1335 },
  { id: 'tn-kasserine', name: 'القصرين', country: 'تونس', latitude: 35.1676, longitude: 8.8365 },
  { id: 'tn-sidi-bouzid', name: 'سيدي بوزيد', country: 'تونس', latitude: 35.0382, longitude: 9.4849 },
  { id: 'tn-kef', name: 'الكاف', country: 'تونس', latitude: 36.1742, longitude: 8.7049 },
  { id: 'tn-jendouba', name: 'جندوبة / طبرقة', country: 'تونس', latitude: 36.5011, longitude: 8.7802 },
  { id: 'tn-beja', name: 'باجة', country: 'تونس', latitude: 36.7256, longitude: 9.1817 },
  { id: 'tn-mahdia', name: 'المهدية', country: 'تونس', latitude: 35.5047, longitude: 11.0622 },

  // Holy & Major Islamic Cities
  { id: 'sa-makkah', name: 'مكة المكرمة', country: 'السعودية', latitude: 21.3891, longitude: 39.8579 },
  { id: 'sa-madinah', name: 'المدينة المنورة', country: 'السعودية', latitude: 24.5247, longitude: 39.5692 },
  { id: 'sa-riyadh', name: 'الرياض', country: 'السعودية', latitude: 24.7136, longitude: 46.6753 },
  { id: 'eg-cairo', name: 'القاهرة', country: 'مصر', latitude: 30.0444, longitude: 31.2357 },
  { id: 'ae-dubai', name: 'دبي', country: 'الإمارات', latitude: 25.2048, longitude: 55.2708 },
  { id: 'tr-istanbul', name: 'إسطنبول', country: 'تركيا', latitude: 41.0082, longitude: 28.9784 },
  { id: 'dz-algiers', name: 'الجزائر العاصمة', country: 'الجزائر', latitude: 36.7538, longitude: 3.0588 },
  { id: 'ma-casablanca', name: 'الدار البيضاء', country: 'المغرب', latitude: 33.5731, longitude: -7.5898 },
  { id: 'fr-paris', name: 'باريس', country: 'فرنسا', latitude: 48.8566, longitude: 2.3522 },
  { id: 'gb-london', name: 'لندن', country: 'المملكة المتحدة', latitude: 51.5074, longitude: -0.1278 }
];

export interface PrayerSettings {
  cityId: string;
  cityName: string;
  latitude: number;
  longitude: number;
  useGps: boolean;
  method: 'MuslimWorldLeague' | 'Egyptian' | 'UmmAlQura' | 'Tunisian' | 'NorthAmerica';
  madhab: 'shafi' | 'hanafi';
}

const DEFAULT_SETTINGS: PrayerSettings = {
  cityId: 'tn-tunis',
  cityName: 'تونس العاصمة',
  latitude: 36.8065,
  longitude: 10.1815,
  useGps: false,
  method: 'Tunisian',
  madhab: 'shafi'
};

const PRAYER_SETTINGS_KEY = 'qada_prayer_times_settings';

export function getPrayerSettings(): PrayerSettings {
  try {
    const raw = localStorage.getItem(PRAYER_SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // fallback
  }
  return DEFAULT_SETTINGS;
}

export function savePrayerSettings(settings: PrayerSettings): void {
  try {
    localStorage.setItem(PRAYER_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

function getCalculationParameters(method: PrayerSettings['method']): CalculationParameters {
  switch (method) {
    case 'Egyptian':
      return CalculationMethod.Egyptian();
    case 'UmmAlQura':
      return CalculationMethod.UmmAlQura();
    case 'NorthAmerica':
      return CalculationMethod.NorthAmerica();
    case 'Tunisian':
    case 'MuslimWorldLeague':
    default: {
      const params = CalculationMethod.MuslimWorldLeague();
      // Tunisian convention uses 18 degrees for Fajr and 18 for Isha
      params.fajrAngle = 18.0;
      params.ishaAngle = 18.0;
      return params;
    }
  }
}

/**
 * Format a Date object to Western 24-hour time "HH:mm" (e.g. "15:42")
 */
export function formatPrayerTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export interface CalculatedPrayers {
  prayers: PrayerTimeItem[];
  currentPrayer: PrayerTimeItem | null;
  nextPrayer: PrayerTimeItem | null;
  timeRemaining: string; // "HH:MM:SS"
  secondsRemaining: number;
  hijriDate: string;
  gregorianDate: string;
}

/**
 * Format Islamic Hijri date in Arabic
 */
export function getFormattedHijriDate(date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('ar-TN-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    return formatter.format(date);
  } catch {
    return '19 رمضان 1447 هـ';
  }
}

/**
 * Format Gregorian date in Arabic
 */
export function getFormattedGregorianDate(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('ar-TN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  return formatter.format(date);
}

/**
 * Calculate all prayer times for given date and coordinates
 */
export function calculateTodayPrayerTimes(
  date: Date = new Date(),
  customSettings?: PrayerSettings
): CalculatedPrayers {
  const settings = customSettings || getPrayerSettings();
  const coordinates = new Coordinates(settings.latitude, settings.longitude);
  const params = getCalculationParameters(settings.method);
  params.madhab = settings.madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;

  const prayerTimes = new PrayerTimes(coordinates, date, params);

  const rawPrayers: { id: PrayerTimeItem['id']; name: string; time: Date }[] = [
    { id: 'fajr', name: 'الفجر', time: prayerTimes.fajr },
    { id: 'sunrise', name: 'الشروق', time: prayerTimes.sunrise },
    { id: 'dhuhr', name: 'الظهر', time: prayerTimes.dhuhr },
    { id: 'asr', name: 'العصر', time: prayerTimes.asr },
    { id: 'maghrib', name: 'المغرب', time: prayerTimes.maghrib },
    { id: 'isha', name: 'العشاء', time: prayerTimes.isha }
  ];

  const now = new Date();
  let nextPrayerRaw: typeof rawPrayers[0] | null = null;
  let currentPrayerRaw: typeof rawPrayers[0] | null = null;

  for (let i = 0; i < rawPrayers.length; i++) {
    const p = rawPrayers[i];
    if (now < p.time) {
      nextPrayerRaw = p;
      currentPrayerRaw = i > 0 ? rawPrayers[i - 1] : rawPrayers[rawPrayers.length - 1];
      break;
    }
  }

  // If after Isha, next prayer is tomorrow's Fajr
  if (!nextPrayerRaw) {
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowTimes = new PrayerTimes(coordinates, tomorrow, params);
    nextPrayerRaw = { id: 'fajr', name: 'الفجر', time: tomorrowTimes.fajr };
    currentPrayerRaw = rawPrayers[rawPrayers.length - 1]; // Isha
  }

  const prayers: PrayerTimeItem[] = rawPrayers.map((p) => ({
    ...p,
    formattedTime: formatPrayerTime(p.time),
    isNext: nextPrayerRaw?.id === p.id && nextPrayerRaw.time.getDate() === date.getDate(),
    isCurrent: currentPrayerRaw?.id === p.id
  }));

  // Countdown calculations
  const diffMs = Math.max(0, nextPrayerRaw.time.getTime() - now.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const secs = (totalSeconds % 60).toString().padStart(2, '0');

  const currentPrayerItem = prayers.find((p) => p.id === currentPrayerRaw?.id) || null;
  const nextPrayerItem: PrayerTimeItem = {
    id: nextPrayerRaw.id,
    name: nextPrayerRaw.name,
    time: nextPrayerRaw.time,
    formattedTime: formatPrayerTime(nextPrayerRaw.time),
    isNext: true,
    isCurrent: false
  };

  return {
    prayers,
    currentPrayer: currentPrayerItem,
    nextPrayer: nextPrayerItem,
    timeRemaining: `${hrs}:${mins}:${secs}`,
    secondsRemaining: totalSeconds,
    hijriDate: getFormattedHijriDate(date),
    gregorianDate: getFormattedGregorianDate(date)
  };
}
