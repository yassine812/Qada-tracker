export const DAILY_ISTIGHFAR_TARGET = 70;

/** Convert Arabic-Indic digits and common grouping separators to a positive integer. */
export function parseIstighfarAmount(value) {
  const raw = String(value ?? '').trim();
  // Accept grouped amounts from Arabic/French keyboards (e.g. 43.929,
  // 43,929 or ٤٣٬٩٢٩), while still rejecting decimal values.
  const grouped = /^(?:\d{1,3})(?:[.,_\s٬،]\d{3})+$/.test(raw);
  const normalized = raw
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(grouped ? /[\s.,_٬،]/g : /[\s,_٬،]/g, '');
  if (!/^\d+$/.test(normalized)) return 0;
  const amount = Number(normalized);
  return Number.isSafeInteger(amount) && amount > 0 ? amount : 0;
}

/**
 * Apply one tap to today's quota. Once today's 70 are complete, a further tap
 * belongs to the separate personal goal ledger and never increases today's UI
 * counter beyond 70.
 */
export function applyIstighfarTap({ todayCount, historicalRemaining = 0, historicalCompleted = 0 }) {
  const safeToday = Math.max(0, Math.min(DAILY_ISTIGHFAR_TARGET, Number(todayCount) || 0));
  const safeHistoricalRemaining = Math.max(0, Number(historicalRemaining) || 0);
  const safeHistoricalCompleted = Math.max(0, Number(historicalCompleted) || 0);

  if (safeToday >= DAILY_ISTIGHFAR_TARGET) {
    const historicalPortion = safeHistoricalRemaining > 0 ? 1 : 0;
    return {
      todayCount: DAILY_ISTIGHFAR_TARGET,
      dailyPortion: 0,
      historicalPortion,
      historicalRemaining: safeHistoricalRemaining - historicalPortion,
      historicalCompleted: safeHistoricalCompleted + historicalPortion,
      phase: historicalPortion > 0 ? 'historical' : 'historical-complete',
    };
  }
  return {
    todayCount: safeToday + 1,
    dailyPortion: 1,
    historicalPortion: 0,
    historicalRemaining: safeHistoricalRemaining,
    historicalCompleted: safeHistoricalCompleted,
    phase: safeToday + 1 >= DAILY_ISTIGHFAR_TARGET ? 'daily-complete' : 'daily',
  };
}

/**
 * Record a batch performed away from the phone in the historical personal
 * ledger. It never fills or changes today's 70-count quota.
 */
export function applyIstighfarBatch({ amount, todayCount, historicalRemaining = 0, historicalCompleted = 0 }) {
  const safeAmount = parseIstighfarAmount(amount);
  const safeToday = Math.max(0, Math.min(DAILY_ISTIGHFAR_TARGET, Number(todayCount) || 0));
  const safeHistoricalRemaining = Math.max(0, Number(historicalRemaining) || 0);
  const safeHistoricalCompleted = Math.max(0, Number(historicalCompleted) || 0);
  const dailyPortion = 0;
  const historicalPortion = Math.min(safeAmount, safeHistoricalRemaining);
  const nextHistoricalCompleted = safeHistoricalCompleted + historicalPortion;

  return {
    amount: safeAmount,
    dailyPortion,
    historicalPortion,
    todayCount: safeToday,
    historicalCompleted: nextHistoricalCompleted,
    historicalRemaining: Math.max(0, safeHistoricalRemaining - historicalPortion),
    phase: historicalPortion > 0 ? 'historical' : 'historical-complete',
  };
}
