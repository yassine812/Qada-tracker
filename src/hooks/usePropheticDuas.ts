import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  PROPHETIC_DUAS,
  TOTAL_PROPHETIC_DUAS,
  PropheticDua,
  getPropheticDuaById,
  searchPropheticDuas,
  shuffleDuas,
  getDailyPropheticDua,
} from '../data/propheticDuas';
import {
  getPropheticDuaCycleState,
  savePropheticDuaCycleState,
  getPropheticDuaFavorites,
  savePropheticDuaFavorites,
} from '../storage/indexedDb';
import { PropheticDuaCycleState } from '../types';

export interface UsePropheticDuasResult {
  currentDua: PropheticDua;
  dailyDua: PropheticDua;
  remainingCount: number;
  shownCount: number;
  totalCount: number;
  cycleNumber: number;
  isFavorite: boolean;
  favorites: PropheticDua[];
  searchQuery: string;
  searchResults: PropheticDua[];
  isLoading: boolean;
  setSearchQuery: (query: string) => void;
  nextDua: () => void;
  selectDuaById: (id: string) => void;
  toggleFavorite: (id?: string) => void;
}

export function usePropheticDuas(): UsePropheticDuasResult {
  const [currentDua, setCurrentDua] = useState<PropheticDua>(() => PROPHETIC_DUAS[0]);
  const [remainingIds, setRemainingIds] = useState<string[]>([]);
  const [historyIds, setHistoryIds] = useState<string[]>([]);
  const [cycleNumber, setCycleNumber] = useState<number>(1);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const dailyDua = useMemo(() => getDailyPropheticDua(), []);

  // Initialize from storage or build initial randomized bag
  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const [savedCycle, savedFavorites] = await Promise.all([
          getPropheticDuaCycleState(),
          getPropheticDuaFavorites(),
        ]);

        if (!isMounted) return;

        if (savedFavorites) {
          setFavoriteIds(savedFavorites);
        }

        const allIds = PROPHETIC_DUAS.map((d) => d.id);

        if (
          savedCycle &&
          savedCycle.currentDuaId &&
          Array.isArray(savedCycle.remainingDuaIds) &&
          Array.isArray(savedCycle.historyDuaIds)
        ) {
          const restoredDua = getPropheticDuaById(savedCycle.currentDuaId);
          if (restoredDua) {
            setCurrentDua(restoredDua);
            setRemainingIds(savedCycle.remainingDuaIds);
            setHistoryIds(savedCycle.historyDuaIds);
            setCycleNumber(savedCycle.cycleCount || 1);
            setIsLoading(false);
            return;
          }
        }

        // New randomized cycle initialization
        const shuffled = shuffleDuas(allIds);
        const firstId = shuffled[0];
        const initialRemaining = shuffled.slice(1);
        const initialHistory = [firstId];
        const firstDua = getPropheticDuaById(firstId) || PROPHETIC_DUAS[0];

        setCurrentDua(firstDua);
        setRemainingIds(initialRemaining);
        setHistoryIds(initialHistory);
        setCycleNumber(1);

        const newState: PropheticDuaCycleState = {
          currentDuaId: firstDua.id,
          remainingDuaIds: initialRemaining,
          historyDuaIds: initialHistory,
          cycleCount: 1,
        };
        savePropheticDuaCycleState(newState);
      } catch (err) {
        console.error('Failed to init prophetic duas cycle state:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Selects the next Dua from the randomized cycle (shuffle-bag).
   * If remaining is empty, reshuffles the entire collection and starts a new cycle.
   */
  const nextDua = useCallback(() => {
    const allIds = PROPHETIC_DUAS.map((d) => d.id);
    let nextRemaining = [...remainingIds];
    let nextHistory = [...historyIds];
    let nextCycle = cycleNumber;

    if (nextRemaining.length === 0) {
      // Start a new cycle with all 29 Duas shuffled
      const freshShuffled = shuffleDuas(allIds);
      // Avoid immediately showing the exact same Dua as current if possible
      if (freshShuffled[0] === currentDua.id && freshShuffled.length > 1) {
        const temp = freshShuffled[0];
        freshShuffled[0] = freshShuffled[freshShuffled.length - 1];
        freshShuffled[freshShuffled.length - 1] = temp;
      }
      nextRemaining = freshShuffled;
      nextHistory = [];
      nextCycle += 1;
    }

    const nextId = nextRemaining.shift()!;
    nextHistory.push(nextId);

    const nextDuaItem = getPropheticDuaById(nextId) || PROPHETIC_DUAS[0];

    setCurrentDua(nextDuaItem);
    setRemainingIds(nextRemaining);
    setHistoryIds(nextHistory);
    setCycleNumber(nextCycle);

    const updatedState: PropheticDuaCycleState = {
      currentDuaId: nextDuaItem.id,
      remainingDuaIds: nextRemaining,
      historyDuaIds: nextHistory,
      cycleCount: nextCycle,
    };
    savePropheticDuaCycleState(updatedState);
  }, [currentDua.id, cycleNumber, historyIds, remainingIds]);

  /**
   * Jump directly to a specific Dua by ID (e.g. from search or favorites)
   */
  const selectDuaById = useCallback(
    (id: string) => {
      const found = getPropheticDuaById(id);
      if (!found) return;

      setCurrentDua(found);

      // Keep cycle state updated
      const updatedRemaining = remainingIds.filter((remId) => remId !== id);
      const updatedHistory = historyIds.includes(id) ? historyIds : [...historyIds, id];

      setRemainingIds(updatedRemaining);
      setHistoryIds(updatedHistory);

      savePropheticDuaCycleState({
        currentDuaId: found.id,
        remainingDuaIds: updatedRemaining,
        historyDuaIds: updatedHistory,
        cycleCount: cycleNumber,
      });
    },
    [historyIds, remainingIds, cycleNumber]
  );

  /**
   * Toggle bookmarking in favorites
   */
  const toggleFavorite = useCallback(
    (id?: string) => {
      const targetId = id || currentDua.id;
      setFavoriteIds((prev) => {
        const next = prev.includes(targetId)
          ? prev.filter((item) => item !== targetId)
          : [...prev, targetId];
        savePropheticDuaFavorites(next);
        return next;
      });
    },
    [currentDua.id]
  );

  const isFavorite = useMemo(
    () => favoriteIds.includes(currentDua.id),
    [favoriteIds, currentDua.id]
  );

  const favorites = useMemo(
    () =>
      favoriteIds
        .map((id) => getPropheticDuaById(id))
        .filter((d): d is PropheticDua => Boolean(d)),
    [favoriteIds]
  );

  const searchResults = useMemo(
    () => searchPropheticDuas(searchQuery),
    [searchQuery]
  );

  const shownCount = useMemo(() => {
    return Math.min(TOTAL_PROPHETIC_DUAS, TOTAL_PROPHETIC_DUAS - remainingIds.length);
  }, [remainingIds.length]);

  return {
    currentDua,
    dailyDua,
    remainingCount: remainingIds.length,
    shownCount,
    totalCount: TOTAL_PROPHETIC_DUAS,
    cycleNumber,
    isFavorite,
    favorites,
    searchQuery,
    searchResults,
    isLoading,
    setSearchQuery,
    nextDua,
    selectDuaById,
    toggleFavorite,
  };
}
