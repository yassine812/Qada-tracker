export interface FastingRecord {
  id: string;
  date: string; // YYYY-MM-DD
  days: number; // number of fasts completed that session
  reason?: string;
  timestamp: number;
}

export interface FastingState {
  remainingDays: number; // current Qada fasting balance (missed days)
  completedDays: number; // total completed fasts (historical total)
  records: FastingRecord[]; // history of completed fasts
}

const DEFAULT_FASTING_STATE: FastingState = {
  remainingDays: 0,
  completedDays: 0,
  records: [],
};

export function loadFastingState(): FastingState {
  try {
    const raw = localStorage.getItem('qada_fasting_state');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          remainingDays: Number.isFinite(parsed.remainingDays) ? Math.max(0, Math.floor(parsed.remainingDays)) : 0,
          completedDays: Number.isFinite(parsed.completedDays) ? Math.max(0, Math.floor(parsed.completedDays)) : 0,
          records: Array.isArray(parsed.records) ? parsed.records : [],
        };
      }
    }
  } catch {
    // ignore corrupt state
  }
  return { ...DEFAULT_FASTING_STATE };
}
