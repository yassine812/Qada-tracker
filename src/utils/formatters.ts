/**
 * Global number formatting utility for Qada.
 * Ensures all numerical values across the application are rendered
 * strictly with Western/Latin numerals (0, 1, 2, 3, 4, 5, 6, 7, 8, 9),
 * preserving Arabic text and RTL direction.
 *
 * Example:
 * formatNumber(12045) => "12,045"
 * formatNumber(70, { commas: false }) => "70"
 * toWesternDigits("سورة الكهف صفحة ٩١") => "سورة الكهف صفحة 91"
 */

export function formatNumber(
  value: number | string | null | undefined,
  options?: { commas?: boolean; minimumFractionDigits?: number; maximumFractionDigits?: number }
): string {
  if (value === null || value === undefined || value === '') return '0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';

  if (options?.commas === false) {
    return num.toString();
  }

  return num.toLocaleString('en-US', {
    minimumFractionDigits: options?.minimumFractionDigits,
    maximumFractionDigits: options?.maximumFractionDigits,
  });
}

/**
 * Parses a user-typed currency string into a numeric value.
 *
 * Handles multiple input conventions:
 *   40000      → 40000
 *   40,000     → 40000  (comma as thousands separator)
 *   40.000     → 40000  (dot as thousands separator — common in Arabic/Tunisian locale)
 *   40.5       → 40.5   (dot as decimal separator)
 *   40.500     → 40500  (3 digits after dot → thousands separator heuristic)
 *   1.234.567  → 1234567 (multiple dots → all thousands separators)
 *
 * Internally always returns a JavaScript number (never a formatted string).
 */
export function parseCurrencyInput(raw: string): number {
  if (!raw || raw.trim() === '') return 0;

  // 1. Remove spaces (may be used as thousands separators: "40 000")
  let s = raw.replace(/\s/g, '');

  // 2. Remove commas (thousands separators: "40,000")
  s = s.replace(/,/g, '');

  if (s === '' || s === '.') return 0;

  const parts = s.split('.');

  // No dot → pure integer
  if (parts.length === 1) {
    const num = parseInt(parts[0], 10);
    return Number.isFinite(num) && num >= 0 ? num : 0;
  }

  // Exactly one dot
  if (parts.length === 2) {
    const [beforeDot, afterDot] = parts;

    // Heuristic: exactly 3 digits after the dot → thousands separator
    // (e.g., 40.000 = 40,000 = 40000)
    // This matches the most common locale convention where "." groups thousands.
    if (afterDot.length === 3 && beforeDot.length >= 1) {
      const num = parseFloat(beforeDot + afterDot);
      return Number.isFinite(num) && num >= 0 ? num : 0;
    }

    // Otherwise the dot is a decimal separator
    const num = parseFloat(s);
    return Number.isFinite(num) && num >= 0 ? num : 0;
  }

  // Multiple dots → last part decides:
  //   3 digits at end → all dots are thousands separators
  //   otherwise       → last dot is decimal, preceding dots are thousands
  const lastPart = parts[parts.length - 1];
  if (lastPart.length === 3) {
    const num = parseFloat(parts.join(''));
    return Number.isFinite(num) && num >= 0 ? num : 0;
  }
  const combined = parts.slice(0, -1).join('') + '.' + lastPart;
  const num = parseFloat(combined);
  return Number.isFinite(num) && num >= 0 ? num : 0;
}

/**
 * Replaces any Eastern Arabic-Indic digits (٠-٩) in a string with Western digits (0-9).
 */
export function toWesternDigits(str: string): string {
  if (!str) return '';
  const easternDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[٠-٩]/g, (d) => {
    const idx = easternDigits.indexOf(d);
    return idx !== -1 ? idx.toString() : d;
  });
}
