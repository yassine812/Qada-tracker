export interface QuranAyah {
  number: number;          // Global Ayah number (1 - 6236)
  numberInSurah: number;   // Number within the Surah (1 - N)
  text: string;            // Authentic verified Uthmani Arabic text
  juz: number;
  page: number;
  hizbQuarter?: number;
  sajda?: boolean | object;
  translation?: string;    // English translation (e.g. Sahih International)
}

export interface SurahMeta {
  number: number;
  name: string;             // Transliteration (e.g. "Al-Fatihah", "An-Nisa")
  arabicName: string;       // Arabic name without "سورة" prefix (e.g. "الفاتحة", "النساء")
  englishTranslation: string; // Meaning (e.g. "The Opening", "The Women")
  versesCount: number;
  revelationType: 'مكية' | 'مدنية';
  pageNumber: number;
  juzNumber: number;
}

export interface SurahData extends SurahMeta {
  bismillahPre: boolean;    // Whether an opening Bismillah header applies
  ayahs: QuranAyah[];
}

export interface QuranSearchResult {
  surahNumber: number;
  surahName: string;
  surahArabicName: string;
  ayahNumberInSurah: number;
  text: string;
  translation?: string;
}

export interface MushafPageAyah {
  surahNumber: number;
  surahArabicName: string;
  ayahNumberInSurah: number;
  globalAyahNumber: number;
  text: string;
  juz: number;
  page: number;
  isFirstInSurah?: boolean;
}

export interface MushafPageSurahInfo {
  number: number;
  arabicName: string;
  englishName: string;
  revelationType: string;
  startsOnThisPage: boolean;
}

export interface MushafPageData {
  pageNumber: number;
  juz: number;
  surahsPresent: MushafPageSurahInfo[];
  ayahs: MushafPageAyah[];
}

