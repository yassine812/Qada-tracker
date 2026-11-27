import type { AdhkarDailyState } from '../types';

const OLD_QUL_IDS = ['morning-2', 'morning-3', 'morning-4'];
export const COMBINED_QUL_ID = 'morning-three-quls';
const OLD_EVENING_QUL_IDS = ['evening-2', 'evening-3', 'evening-4'];
export const COMBINED_EVENING_QUL_ID = 'evening-three-quls';
const OLD_SLEEP_QUL_IDS = ['sleep-2', 'sleep-3', 'sleep-4'];
export const COMBINED_SLEEP_QUL_ID = 'sleep-three-quls';

export function migrateAdhkarFavorites(ids: string[]): string[] {
  return [...new Set(ids.map(id => OLD_QUL_IDS.includes(id) ? COMBINED_QUL_ID : OLD_EVENING_QUL_IDS.includes(id) ? COMBINED_EVENING_QUL_ID : OLD_SLEEP_QUL_IDS.includes(id) ? COMBINED_SLEEP_QUL_ID : id))];
}

/** Three surahs now form one reading round. Only their shared progress counts;
 * completing one surah must never mark all three complete. Keep the old records
 * intact, and never run the migration again once the combined record exists. */
export function migrateMorningProgress(state: AdhkarDailyState): AdhkarDailyState {
  const morning = state.byCategory.morning;
  if (!morning || morning.items[COMBINED_QUL_ID] || !OLD_QUL_IDS.some(id => morning.items[id])) return state;
  const count = Math.min(...OLD_QUL_IDS.map(id => Math.max(0, Math.min(3, morning.items[id]?.count || 0))));
  return {
    ...state,
    byCategory: {
      ...state.byCategory,
      morning: { ...morning, items: { ...morning.items, [COMBINED_QUL_ID]: { count, completed: count === 3 } } },
    },
  };
}

export function migrateEveningProgress(state: AdhkarDailyState): AdhkarDailyState {
  const evening = state.byCategory.evening;
  if (!evening || evening.items[COMBINED_EVENING_QUL_ID] || !OLD_EVENING_QUL_IDS.some(id => evening.items[id])) return state;
  const count = Math.min(...OLD_EVENING_QUL_IDS.map(id => Math.max(0, Math.min(3, evening.items[id]?.count || 0))));
  return {
    ...state,
    byCategory: {
      ...state.byCategory,
      evening: { ...evening, items: { ...evening.items, [COMBINED_EVENING_QUL_ID]: { count, completed: count === 3 } } },
    },
  };
}

export function migrateAdhkarProgress(state: AdhkarDailyState): AdhkarDailyState {
  return migrateSleepProgress(migrateEveningProgress(migrateMorningProgress(state)));
}

export function migrateSleepProgress(state: AdhkarDailyState): AdhkarDailyState {
  const sleep = state.byCategory.sleep;
  if (!sleep || sleep.items[COMBINED_SLEEP_QUL_ID] || !OLD_SLEEP_QUL_IDS.some(id => sleep.items[id])) return state;
  const count = Math.min(...OLD_SLEEP_QUL_IDS.map(id => Math.max(0, Math.min(3, sleep.items[id]?.count || 0))));
  return {
    ...state,
    byCategory: {
      ...state.byCategory,
      sleep: { ...sleep, items: { ...sleep.items, [COMBINED_SLEEP_QUL_ID]: { count, completed: count === 3 } } },
    },
  };
}
