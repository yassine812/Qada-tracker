import {
  ISLAMIC_NAME_KNOWLEDGE_BASE,
  IslamicNameKnowledgeEntry,
} from '../data/islamicNameKnowledge';

/**
 * Normalizes an Arabic or Latin name for lookup.
 */
export function normalizeName(name: string): string {
  if (!name) return '';
  const trimmed = name.trim();

  // If contains Arabic characters
  if (/[\u0600-\u06FF]/.test(trimmed)) {
    return normalizeArabic(trimmed);
  }

  // Otherwise treat as Latin transliteration
  return normalizeLatinPhonetic(trimmed);
}

/**
 * Normalizes Arabic string:
 * - Trims and cleans spaces
 * - Strips tashkeel (diacritics) & tatweel (kashida)
 * - Unifies alef (أ, إ, آ, ٱ -> ا)
 * - Unifies taa marbouta (ة -> ه)
 * - Unifies alif maqsurah (ى -> ي)
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';
  let cleaned = text
    .trim()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // Remove tashkeel & tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ');

  // Strip definite article 'ال' if word length > 4
  if (cleaned.startsWith('ال') && cleaned.length > 4) {
    cleaned = cleaned.slice(2);
  }

  return cleaned;
}

/**
 * Normalizes Latin transliterations with phonetic awareness:
 * - Lowercase & removes non-alphanumeric
 * - Replaces common North African/French & English transliteration variants:
 *   - 'ou' -> 'u'
 *   - 'ee' -> 'i'
 *   - 'ch' -> 'sh'
 *   - 'kh' -> 'k' (as a phonetic fallback)
 *   - 'dj' -> 'j'
 *   - Collapses double consonants (e.g. 'ss' -> 's', 'mm' -> 'm', 'tt' -> 't')
 */
export function normalizeLatinPhonetic(text: string): string {
  if (!text) return '';
  let s = text.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

  // Phonetic simplifications
  s = s
    .replace(/ou/g, 'u')
    .replace(/ee/g, 'i')
    .replace(/ch/g, 'sh')
    .replace(/dj/g, 'j')
    .replace(/ph/g, 'f')
    .replace(/(.)\1+/g, '$1'); // Collapse duplicate letters: 'ss' -> 's', 'mm' -> 'm', etc.

  return s;
}

/**
 * Returns a list of generated spelling variants for a given name.
 */
export function getNameVariants(name: string): string[] {
  const norm = normalizeName(name);
  const variants = new Set<string>([name.trim().toLowerCase(), norm]);

  const entry = matchIslamicName(name);
  if (entry) {
    variants.add(entry.canonicalName);
    for (const v of entry.latinVariants) {
      variants.add(v.toLowerCase());
    }
  }

  return Array.from(variants);
}

/**
 * Matches a raw user input name against the comprehensive Islamic knowledge base.
 * Never modifies the raw user input.
 */
export function matchIslamicName(rawInput: string): IslamicNameKnowledgeEntry | null {
  if (!rawInput || !rawInput.trim()) return null;

  const rawTrimmed = rawInput.trim();
  const normInput = normalizeName(rawTrimmed);
  const rawLower = rawTrimmed.toLowerCase();

  // 1. Direct match on canonicalName or latinVariants
  for (const entry of ISLAMIC_NAME_KNOWLEDGE_BASE) {
    if (entry.canonicalName === rawTrimmed) {
      return entry;
    }
    if (entry.latinVariants.some((v) => v.toLowerCase() === rawLower)) {
      return entry;
    }
  }

  // 2. Normalized Arabic match
  if (/[\u0600-\u06FF]/.test(rawTrimmed)) {
    const normAr = normalizeArabic(rawTrimmed);
    for (const entry of ISLAMIC_NAME_KNOWLEDGE_BASE) {
      if (normalizeArabic(entry.canonicalName) === normAr) {
        return entry;
      }
    }
  } else {
    // 3. Normalized Latin phonetic match
    const normPhonetic = normalizeLatinPhonetic(rawTrimmed);
    for (const entry of ISLAMIC_NAME_KNOWLEDGE_BASE) {
      for (const alias of entry.latinVariants) {
        if (normalizeLatinPhonetic(alias) === normPhonetic) {
          return entry;
        }
      }
    }
  }

  // 4. Token match for compound names (e.g. "محمد أمين", "نور الهدى", "أحمد ياسين")
  const tokens = rawTrimmed.split(/\s+/);
  if (tokens.length > 1) {
    for (const token of tokens) {
      const tokenMatch = matchIslamicName(token);
      if (tokenMatch) return tokenMatch;
    }
  }

  return null;
}
