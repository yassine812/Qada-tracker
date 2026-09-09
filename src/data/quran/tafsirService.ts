export interface TafsirSource {
  id: string;
  name: string;
  author: string;
  description: string;
}

export const TAFSIR_SOURCES: TafsirSource[] = [
  {
    id: 'ar.muyassar',
    name: 'التفسير الميسر',
    author: 'مجمع الملك فهد لطباعة المصحف الشريف',
    description: 'تفسير موجز وموثوق أعدّه نخبة من أساتذة التفسير وفق منهج أهل السنة والجماعة'
  },
  {
    id: 'ar.jalalayn',
    name: 'تفسير الجلالين',
    author: 'جلال الدين المحلي وجلال الدين السيوطي',
    description: 'من أشهر كتب التفسير بالمأثور تميزاً بالإيجاز والبيان اللغوي الرصين'
  },
  {
    id: 'ar.qurtubi',
    name: 'تفسير القرطبي',
    author: 'أبو عبد الله محمد بن أحمد القرطبي',
    description: 'الجامع لأحكام القرآن والمبين لما تضمنه من السنة وآي الفرقان'
  }
];

export interface AyahTafsirResult {
  surahNumber: number;
  ayahNumber: number;
  text: string;
  sourceId: string;
  sourceName: string;
  sourceAuthor: string;
}

// Memory cache for fetched Tafsirs
const tafsirMemoryCache: Record<string, string> = {};
const TAFSIR_UNAVAILABLE_MESSAGE = 'تعذر تحميل هذا التفسير. يحتاج التفسير غير المحفوظ إلى اتصال بالإنترنت.';

/**
 * Fetch verified Tafsir for a specific Ayah from a verified named source.
 * Never uses AI generation.
 */
export async function getAyahTafsir(
  surahNumber: number,
  ayahNumber: number,
  sourceId: string = 'ar.muyassar'
): Promise<AyahTafsirResult> {
  const cacheKey = `tafsir_${sourceId}_${surahNumber}_${ayahNumber}`;

  const sourceMeta =
    TAFSIR_SOURCES.find((s) => s.id === sourceId) || TAFSIR_SOURCES[0];

  // 1. Check memory cache
  if (tafsirMemoryCache[cacheKey]) {
    return {
      surahNumber,
      ayahNumber,
      text: tafsirMemoryCache[cacheKey],
      sourceId: sourceMeta.id,
      sourceName: sourceMeta.name,
      sourceAuthor: sourceMeta.author
    };
  }

  // 2. Check localStorage cache
  try {
    const local = localStorage.getItem(cacheKey);
    if (local) {
      tafsirMemoryCache[cacheKey] = local;
      return {
        surahNumber,
        ayahNumber,
        text: local,
        sourceId: sourceMeta.id,
        sourceName: sourceMeta.name,
        sourceAuthor: sourceMeta.author
      };
    }
  } catch {
    // ignore
  }

  // Saved tafsir stays readable offline; only uncached verses need the API.
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error(TAFSIR_UNAVAILABLE_MESSAGE);
  }

  // 3. Fetch from verified API
  try {
    const res = await fetch(`https://api.alquran.cloud/v1/ayah/${surahNumber}:${ayahNumber}/${sourceId}`);
    const json = await res.json();

    if (json.code === 200 && json.data?.text) {
      const tafsirText = json.data.text.trim();
      tafsirMemoryCache[cacheKey] = tafsirText;
      try {
        localStorage.setItem(cacheKey, tafsirText);
      } catch {
        // quota exceeded
      }

      return {
        surahNumber,
        ayahNumber,
        text: tafsirText,
        sourceId: sourceMeta.id,
        sourceName: sourceMeta.name,
        sourceAuthor: sourceMeta.author
      };
    }
  } catch {
    // Network failure
  }

  throw new Error(TAFSIR_UNAVAILABLE_MESSAGE);
}
