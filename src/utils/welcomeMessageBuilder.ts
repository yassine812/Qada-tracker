import { matchIslamicName, normalizeName, getNameVariants } from './nameMatcher';
import {
  IslamicNameKnowledgeEntry,
  QuranReference,
  HadithReference,
  NameCategory,
} from '../data/islamicNameKnowledge';

export interface PersonalizedWelcomeViewModel {
  displayName: string;
  isFemale: boolean;
  category: NameCategory;
  categoryTitle: string;
  welcomeHeading: string;      // e.g. "أهلًا بك يا أحمد 🌿" or "أهلًا بكِ يا مريم 🌿"
  ctaText: string;             // e.g. "ابدأ رحلتك" or "ابدئي رحلتكِ"
  connectionLead: string;      // 1-sentence meaningful Islamic connection
  quranReference?: QuranReference;
  hadithReference?: HadithReference;
  sourceReference?: string;
  closingDua: string;
}

/**
 * Returns the Islamic knowledge entry for a given name if verified.
 */
export function getIslamicNameInfo(
  name: string,
  gender?: 'male' | 'female' | null
): IslamicNameKnowledgeEntry | null {
  return matchIslamicName(name);
}

/**
 * Returns the Qur'anic reference for a name if available.
 */
export function getQuranReference(name: string): QuranReference | undefined {
  const match = matchIslamicName(name);
  return match?.quranReference;
}

/**
 * Returns the authentic Hadith reference for a name if available.
 */
export function getHadithReference(name: string): HadithReference | undefined {
  const match = matchIslamicName(name);
  return match?.hadithReference;
}

/**
 * Builds the complete dynamic welcome view-model for the onboarding screen.
 * Automatically adapts masculine/feminine wording and greetings.
 * Fallback provides an authentic, sincere Islamic welcome without invented claims.
 */
export function getWelcomeMessage(
  rawName: string,
  explicitGender?: 'male' | 'female' | null
): PersonalizedWelcomeViewModel {
  const trimmed = (rawName || '').trim();
  const displayName = trimmed || 'ضيفنا الكريم';

  const match = matchIslamicName(trimmed);

  // Determine effective gender:
  // 1. Explicit user gender selection takes highest precedence
  // 2. If unspecified, infer from verified database entry (e.g. Maryam, Fatima, Khadijah -> female)
  // 3. Otherwise default to male/neutral
  const isFemale =
    explicitGender === 'female' ||
    (explicitGender !== 'male' && match?.gender === 'female');

  const greetingPrefix = isFemale ? 'أهلًا بكِ يا' : 'أهلًا بك يا';
  const ctaText = isFemale ? 'ابدئي رحلتكِ' : 'ابدأ رحلتك';

  // Fallback for names without specific verified religious connection
  if (!match) {
    const fallbackHeading = trimmed
      ? `${greetingPrefix} ${trimmed} 🌿`
      : 'أهلًا بك في قضاء 🌿';

    const fallbackConnection =
      'اسمك جميل، وهذه رحلتك الخاصة نحو إتمام ما فاتك والتقرب إلى الله، خطوةً بخطوة.';

    const fallbackDua = isFemale
      ? 'نسأل الله أن يكتب لكِ فيها الخير والقبول، وأن يجعل هذا التطبيق عونًا لكِ على طاعته.'
      : 'نسأل الله أن يكتب لك فيها الخير والقبول، وأن يجعل هذا التطبيق عونًا لك على طاعته.';

    return {
      displayName,
      isFemale,
      category: 'general',
      categoryTitle: 'مرحبًا بك في قضاء',
      welcomeHeading: fallbackHeading,
      ctaText,
      connectionLead: fallbackConnection,
      closingDua: fallbackDua,
    };
  }

  // Verified match found
  const welcomeHeading = `${greetingPrefix} ${displayName} 🌿`;
  const closingDua = isFemale ? match.closingDuaFemale : match.closingDuaMale;

  return {
    displayName,
    isFemale,
    category: match.category,
    categoryTitle: match.categoryTitle,
    welcomeHeading,
    ctaText,
    connectionLead: match.welcomeExplanation,
    quranReference: match.quranReference,
    hadithReference: match.hadithReference,
    sourceReference: match.sourceReference,
    closingDua,
  };
}

// Re-export helpers for external consumers
export { normalizeName, getNameVariants };
