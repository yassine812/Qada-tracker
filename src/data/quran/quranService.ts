import { QuranAyah, SurahMeta, SurahData, QuranSearchResult, MushafPageData } from './types';
import { ALL_SURAHS } from './surahsList';
import { OFFLINE_SURAHS } from './offlineSurahs';
import { OFFLINE_MUSHAF_PAGES } from './offlinePages';

let fullPagesCache: Record<number, MushafPageData> | null = null;

// In-memory cache for fast switching
let fullUthmaniCache: any[] | null = null;
let fullEnglishCache: any[] | null = null;

// Normalize Arabic text by removing tashkeel/diacritics for search
export function removeTashkeel(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '') // Tashkeel & Quranic marks
    .replace(/[ٱإأآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();
}

// Bismillah constants
export const BISMILLAH_UTHMANI = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
const BISMILLAH_PREFIX_REGEX = /^بِسْمِ\s+ٱللَّهِ\s+ٱلرَّحْمَٰنِ\s+ٱلرَّحِيمِ\s+/;

/**
 * Clean Ayah text for display.
 * In the Tanzil/Uthmani data, Surahs 2-114 (except 9) have Bismillah prepended to Ayah 1.
 * For Mushaf presentation, Bismillah is displayed in the Surah header, so we separate it.
 */
export function getCleanAyahText(surahNumber: number, ayahNumberInSurah: number, rawText: string): string {
  if (surahNumber !== 1 && surahNumber !== 9 && ayahNumberInSurah === 1) {
    return rawText.replace(BISMILLAH_PREFIX_REGEX, '').trim();
  }
  return rawText.trim();
}

/**
 * Get metadata for all 114 Surahs
 */
export function getAllSurahs(): SurahMeta[] {
  return ALL_SURAHS;
}

/**
 * Get metadata for a specific Surah by number (1 - 114)
 */
export function getSurahMeta(surahNumber: number): SurahMeta | undefined {
  return ALL_SURAHS.find(s => s.number === surahNumber);
}

/**
 * Loads the complete Uthmani text for all 114 Surahs (cached)
 */
async function loadFullUthmaniDataset(): Promise<any[]> {
  if (fullUthmaniCache) {
    return fullUthmaniCache;
  }

  try {
    const res = await fetch('/data/quran-uthmani.json');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length === 114) {
        fullUthmaniCache = data;
        return data;
      }
    }
  } catch {
    // Network or static fetch error, will fallback
  }

  // Fallback to remote API
  const apiRes = await fetch('https://api.alquran.cloud/v1/quran/quran-uthmani');
  const apiJson = await apiRes.json();
  if (apiJson.code === 200 && apiJson.data?.surahs) {
    fullUthmaniCache = apiJson.data.surahs;
    return apiJson.data.surahs;
  }

  throw new Error('Failed to load Quran Uthmani dataset');
}

/**
 * Loads the English translation dataset (cached)
 */
async function loadFullEnglishDataset(): Promise<any[] | null> {
  if (fullEnglishCache) {
    return fullEnglishCache;
  }

  try {
    const res = await fetch('/data/quran-en-sahih.json');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length === 114) {
        fullEnglishCache = data;
        return data;
      }
    }
  } catch {
    // optional
  }

  return null;
}

/**
 * Fetch a complete Surah with all its Ayat
 */
export async function getSurahData(surahNumber: number): Promise<SurahData> {
  const meta = getSurahMeta(surahNumber);
  if (!meta) {
    throw new Error(`Surah #${surahNumber} not found.`);
  }

  // 1. Check pre-bundled offline Surahs (instant response)
  if (OFFLINE_SURAHS[surahNumber]) {
    return {
      ...meta,
      bismillahPre: surahNumber !== 1 && surahNumber !== 9,
      ayahs: OFFLINE_SURAHS[surahNumber]
    };
  }

  // 2. Check localStorage cache
  try {
    const cached = localStorage.getItem(`qada_surah_${surahNumber}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.ayahs && parsed.ayahs.length === meta.versesCount) {
        return parsed;
      }
    }
  } catch {
    // storage failed or unavailable
  }

  // 3. Load from full local JSON dataset
  try {
    const [uthmaniSurahs, englishSurahs] = await Promise.all([
      loadFullUthmaniDataset(),
      loadFullEnglishDataset()
    ]);

    const uSurah = uthmaniSurahs[surahNumber - 1];
    const eSurah = englishSurahs ? englishSurahs[surahNumber - 1] : null;

    if (uSurah && uSurah.ayahs) {
      const ayahs: QuranAyah[] = uSurah.ayahs.map((a: any, idx: number) => ({
        number: a.number,
        numberInSurah: a.numberInSurah,
        text: a.text,
        juz: a.juz,
        page: a.page,
        hizbQuarter: a.hizbQuarter,
        sajda: a.sajda,
        translation: eSurah?.ayahs?.[idx]?.text || ''
      }));

      const surahData: SurahData = {
        ...meta,
        bismillahPre: surahNumber !== 1 && surahNumber !== 9,
        ayahs
      };

      // Cache locally for offline use
      try {
        localStorage.setItem(`qada_surah_${surahNumber}`, JSON.stringify(surahData));
      } catch {
        // storage full
      }

      return surahData;
    }
  } catch {
    // fallback to single surah API
  }

  // 4. Fallback to individual Surah API call
  try {
    const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,en.sahih`);
    const json = await res.json();
    if (json.code === 200 && json.data && json.data.length === 2) {
      const uthmaniData = json.data[0];
      const englishData = json.data[1];

      const ayahs: QuranAyah[] = uthmaniData.ayahs.map((a: any, idx: number) => ({
        number: a.number,
        numberInSurah: a.numberInSurah,
        text: a.text,
        juz: a.juz,
        page: a.page,
        hizbQuarter: a.hizbQuarter,
        sajda: a.sajda,
        translation: englishData?.ayahs?.[idx]?.text || ''
      }));

      const surahData: SurahData = {
        ...meta,
        bismillahPre: surahNumber !== 1 && surahNumber !== 9,
        ayahs
      };

      try {
        localStorage.setItem(`qada_surah_${surahNumber}`, JSON.stringify(surahData));
      } catch {
        // ignore
      }

      return surahData;
    }
  } catch (err) {
    throw new Error('تعذر تحميل نص القرآن، يرجى التحقق من الاتصال بالإنترنت');
  }

  throw new Error('تعذر تحميل نص القرآن، يرجى التحقق من الاتصال بالإنترنت');
}

/**
 * Return verified reciter audio URL for an Ayah
 */
export function getAyahAudioUrl(globalAyahNumber: number): string {
  return `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalAyahNumber}.mp3`;
}

/**
 * Search across the entire Quran
 */
export async function searchQuran(query: string): Promise<QuranSearchResult[]> {
  const cleanQuery = removeTashkeel(query);
  if (!cleanQuery || cleanQuery.length < 2) return [];

  try {
    const surahs = await loadFullUthmaniDataset();
    const results: QuranSearchResult[] = [];

    for (const surah of surahs) {
      const meta = getSurahMeta(surah.number);
      if (!meta) continue;

      for (const ayah of surah.ayahs) {
        const normalized = removeTashkeel(ayah.text);
        if (normalized.includes(cleanQuery)) {
          results.push({
            surahNumber: surah.number,
            surahName: meta.name,
            surahArabicName: meta.arabicName,
            ayahNumberInSurah: ayah.numberInSurah,
            text: ayah.text
          });

          if (results.length >= 30) {
            return results;
          }
        }
      }
    }

    return results;
  } catch {
    return [];
  }
}

/**
 * Bookmark Storage Helpers
 */
export interface QuranBookmark {
  surahNumber: number;
  ayahNumberInSurah: number;
  surahArabicName: string;
  timestamp: number;
}

const BOOKMARK_KEY = 'qada_quran_bookmark';

export function getSavedBookmark(): QuranBookmark | null {
  try {
    const raw = localStorage.getItem(BOOKMARK_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveBookmark(bookmark: QuranBookmark): void {
  try {
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmark));
  } catch {
    // ignore
  }
}

export function removeBookmark(): void {
  try {
    localStorage.removeItem(BOOKMARK_KEY);
  } catch {
    // ignore
  }
}

/**
 * Get verified data for a specific Mushaf page (1 to 604)
 */
export async function getMushafPage(pageNumber: number): Promise<MushafPageData> {
  const p = Math.max(1, Math.min(604, pageNumber));

  // 1. Fast offline sample pages
  if (OFFLINE_MUSHAF_PAGES[p]) {
    return OFFLINE_MUSHAF_PAGES[p];
  }

  // 2. Memory cache
  if (fullPagesCache && fullPagesCache[p]) {
    return fullPagesCache[p];
  }

  // 3. Load from static JSON asset
  try {
    const res = await fetch('/data/quran-pages.json');
    if (res.ok) {
      const data = await res.json();
      fullPagesCache = data;
      if (data[p]) {
        return data[p];
      }
    }
  } catch {
    // ignore
  }

  throw new Error('تعذر تحميل صفحة المصحف، يرجى التحقق من الاتصال بالإنترنت.');
}

/**
 * Return the starting page for a Surah
 */
export function getSurahStartPage(surahNumber: number): number {
  const meta = getSurahMeta(surahNumber);
  return meta?.pageNumber || 1;
}

/**
 * Juz to start page mapping
 */
const JUZ_START_PAGES: Record<number, number> = {
  1: 1, 2: 22, 3: 42, 4: 62, 5: 82, 6: 102, 7: 122, 8: 142, 9: 162, 10: 182,
  11: 202, 12: 222, 13: 242, 14: 262, 15: 282, 16: 302, 17: 322, 18: 342, 19: 362, 20: 382,
  21: 402, 22: 422, 23: 442, 24: 462, 25: 482, 26: 502, 27: 522, 28: 542, 29: 562, 30: 582
};

export function getJuzStartPage(juzNumber: number): number {
  return JUZ_START_PAGES[juzNumber] || 1;
}

