import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AdhkarCategory,
  AdhkarCategoryProgress,
  AdhkarDailyState,
  AdhkarHistoryEntry,
  AdhkarItem,
} from '../types';
import { getAdhkarItems, searchAdhkar as searchAdhkarData } from '../data/adhkar';
import {
  getAdhkarDailyStates,
  getAdhkarHistory,
  saveAdhkarDailyState,
  saveAdhkarHistoryEntry,
} from '../storage/indexedDb';
import { getTodayDateString } from '../utils/streak';

const FAVORITES_KEY = 'qada_adhkar_favorites';

function emptyCategoryProgress(): AdhkarCategoryProgress {
  return { items: {} };
}

function makeEmptyState(today: string): AdhkarDailyState {
  return {
    date: today,
    byCategory: {
      morning: emptyCategoryProgress(),
      evening: emptyCategoryProgress(),
      sleep: emptyCategoryProgress(),
    },
  };
}

function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x: unknown) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function persistFavorites(list: string[]) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export interface CategoryProgress {
  completed: number;
  total: number;
  percentage: number;
}

export interface UseAdhkarResult {
  ready: boolean;
  state: AdhkarDailyState;
  history: AdhkarHistoryEntry[];
  favorites: string[];
  getCategoryProgress: (category: AdhkarCategory) => CategoryProgress;
  getItemProgress: (category: AdhkarCategory, itemId: string) => { count: number; completed: boolean };
  recordTap: (category: AdhkarCategory, itemId: string) => { count: number; completed: boolean } | null;
  toggleFavorite: (itemId: string) => void;
  isFavorite: (itemId: string) => boolean;
  searchAdhkar: (query: string) => AdhkarItem[];
}

export function useAdhkar(): UseAdhkarResult {
  const todayStr = getTodayDateString();

  const [ready, setReady] = useState(false);
  const [state, setState] = useState<AdhkarDailyState>(() => makeEmptyState(todayStr));
  const [history, setHistory] = useState<AdhkarHistoryEntry[]>([]);
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites());
  const stateRef = useRef(state);
  stateRef.current = state;

  // ── Daily rollover: migrate previous day's snapshot into history,
  //    then start a fresh state for today. ─────────────────────────
  const rolloverToToday = useCallback(async (loaded: AdhkarDailyState) => {
    const activeToday = makeEmptyState(todayStr);
    if (loaded && loaded.date === todayStr) {
      setState(loaded);
      return;
    }
    if (loaded) {
      const categories: AdhkarCategory[] = ['morning', 'evening', 'sleep'];
      const snapshot: AdhkarHistoryEntry[] = [];
      for (const category of categories) {
        const catState = loaded.byCategory[category];
        if (!catState) continue;
        const items = getAdhkarItems(category);
        const completedCount = items.filter((it) => catState.items[it.id]?.completed).length;
        const touched = items.some((it) => (catState.items[it.id]?.count || 0) > 0);
        if (completedCount > 0 || touched) {
          snapshot.push({
            id: `${loaded.date}_${category}`,
            date: loaded.date,
            category,
            completedCount,
            totalCount: items.length,
          });
        }
      }
      if (snapshot.length > 0) {
        setHistory((prev) => {
          const merged = [...snapshot, ...prev];
          const seen = new Set<string>();
          const unique = merged.filter((e) => {
            if (seen.has(e.id)) return false;
            seen.add(e.id);
            return true;
          });
          unique.slice(0, 120).forEach((entry) => {
            saveAdhkarHistoryEntry(entry).catch(() => undefined);
          });
          return unique.slice(0, 120);
        });
      }
    }
    setState(activeToday);
  }, [todayStr]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [states, savedHistory] = await Promise.all([getAdhkarDailyStates(), getAdhkarHistory()]);
        if (cancelled) return;
        setHistory(savedHistory);
        await rolloverToToday(states[0]);
      } catch (err) {
        console.warn('Failed to load adhkar state:', err);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rolloverToToday]);

  // If the app stays open across midnight, roll over on focus.
  useEffect(() => {
    const check = () => {
      const current = stateRef.current;
      if (current.date !== getTodayDateString()) {
        rolloverToToday(current);
      }
    };
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
    return () => {
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', check);
    };
  }, [rolloverToToday]);

  // ── Helpers ─────────────────────────────────────────────────────
  const getCategoryProgress = useCallback(
    (category: AdhkarCategory): CategoryProgress => {
      const items = getAdhkarItems(category);
      const catState = state.byCategory[category];
      const completed = items.filter((it) => catState?.items[it.id]?.completed).length;
      const total = items.length;
      return {
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    },
    [state]
  );

  const getItemProgress = useCallback(
    (category: AdhkarCategory, itemId: string) => {
      const catState = state.byCategory[category];
      const p = catState?.items[itemId];
      return { count: p?.count || 0, completed: p?.completed || false };
    },
    [state]
  );

  const recordTap = useCallback(
    (category: AdhkarCategory, itemId: string) => {
      const items = getAdhkarItems(category);
      const item = items.find((it) => it.id === itemId);
      if (!item) return null;

      const current = stateRef.current;
      const catState = current.byCategory[category] || emptyCategoryProgress();
      const existing = catState.items[itemId];
      const completed = existing?.completed || false;
      const count = Math.min(item.repetitions, (existing?.count || 0) + 1);
      const nowCompleted = count >= item.repetitions;

      const updated: AdhkarDailyState = {
        ...current,
        byCategory: {
          ...current.byCategory,
          [category]: {
            items: {
              ...catState.items,
              [itemId]: { count, completed: completed || nowCompleted },
            },
          },
        },
      };
      setState(updated);
      saveAdhkarDailyState(updated).catch(() => undefined);
      return { count, completed: completed || nowCompleted };
    },
    []
  );

  const toggleFavorite = useCallback((itemId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId];
      persistFavorites(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback((itemId: string) => favorites.includes(itemId), [favorites]);

  const searchAdhkar = useCallback((query: string) => searchAdhkarData(query), []);

  return {
    ready,
    state,
    history,
    favorites,
    getCategoryProgress,
    getItemProgress,
    recordTap,
    toggleFavorite,
    isFavorite,
    searchAdhkar,
  };
}