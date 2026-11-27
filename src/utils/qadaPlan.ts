import { PRAYERS_LIST, type QadaPlan } from '../types';

// Bound inputs so even the combined monthly plan stays a safe integer.
export const MAX_DAILY_QADA = Math.floor(Number.MAX_SAFE_INTEGER / (30 * 5));
export function isValidDailyTarget(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0 && value <= MAX_DAILY_QADA;
}
export function normalizeQadaPlan(value: QadaPlan | undefined): QadaPlan {
  return Object.fromEntries(PRAYERS_LIST.flatMap(({ key }) =>
    isValidDailyTarget(value?.[key]) ? [[key, value[key]]] : []));
}
export function calculateMonthlyQada(dailyTarget: number): number {
  return isValidDailyTarget(dailyTarget) ? dailyTarget * 30 : 0;
}
export function calculateEstimatedDays(remaining: number, dailyTarget: number): number | null {
  if (!Number.isSafeInteger(remaining) || remaining < 0) return null;
  if (remaining === 0) return 0;
  if (!isValidDailyTarget(dailyTarget)) return null;
  return Math.ceil(remaining / dailyTarget);
}
export function calculateEstimatedMonths(remaining: number, dailyTarget: number): number | null {
  const days = calculateEstimatedDays(remaining, dailyTarget);
  // Calendar duration is approximate; monthly capacity above always uses 30 days.
  return days === null ? null : days === 0 ? 0 : Math.max(1, Math.round(days / (365.25 / 12)));
}
export function calculateTotalDailyPlan(plans: QadaPlan): number {
  return Object.values(normalizeQadaPlan(plans)).reduce((total, target) => total + target, 0);
}
export function calculateTotalMonthlyPlan(plans: QadaPlan): number {
  return calculateTotalDailyPlan(plans) * 30;
}
