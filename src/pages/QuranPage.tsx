import { FeatureHelp } from '../components/guide/FeatureHelp';
import { flushSync } from 'react-dom';
import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import {
  Bookmark,
  Play,
  Pause,
  Search,
  Check,
  Copy,
  Share2,
  X,
  ChevronRight,
  ChevronLeft,
  List,
  Layers,
  Home,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { encourageProgress } from '../services/companionFeedback';
import { useStreak } from '../context/StreakContext';
import { TactileButton } from '../components/ui/MotionPrimitives';
import {
  getAllSurahs,
  getMushafPage,
  getSurahStartPage,
  getJuzStartPage,
  getCleanAyahText,
  getAyahAudioUrl,
  searchQuran,
  getSavedBookmark,
  saveBookmark,
  removeBookmark,
  BISMILLAH_UTHMANI,
  SurahMeta,
  MushafPageData,
  MushafPageAyah,
  QuranSearchResult,
  QuranBookmark,
  TAFSIR_SOURCES,
  getAyahTafsir,
  AyahTafsirResult,
} from '../data/quran';

// ─────────────────────────────────────────────────────────────────
// localStorage helpers
// ─────────────────────────────────────────────────────────────────

const QURAN_PAGE_KEY = 'qada_mushaf_current_page';

export function getSavedMushafPage(): number {
  try {
    const raw = localStorage.getItem(QURAN_PAGE_KEY);
    if (raw) {
      const p = parseInt(raw, 10);
      if (p >= 1 && p <= 604) return p;
    }
  } catch {
    // ignore
  }
  return 1;
}

export function saveMushafPage(pageNumber: number): void {
  try {
    localStorage.setItem(QURAN_PAGE_KEY, pageNumber.toString());
  } catch {
    // ignore
  }
}

// ─────────────────────────────────────────────────────────────────
// MushafPageContent — self-contained component
// Uses useLayoutEffect binary search to find the LARGEST font size
// at which ALL assigned Ayat fit in the content area without overflow.
// ─────────────────────────────────────────────────────────────────

interface MushafPageContentProps {
  data: MushafPageData;
  isUnderlying?: boolean;
  activeAyah: MushafPageAyah | null;
  activeBookmark: QuranBookmark | null;
  playingAyahNumber: number | null;
  isPlayingAudio: boolean;
  isDragging: boolean;
  onAyahClick: (ayah: MushafPageAyah) => void;
  canRefit: () => boolean;
}

const QURAN_LINE_HEIGHT = 2.08;
// Reuse the fitted typography when a prepared sheet becomes the current page.
const fittedPageSizes = new Map<string, number>();

const MushafPageContent = React.memo<MushafPageContentProps>(
  ({
    data,
    isUnderlying = false,
    activeAyah,
    activeBookmark,
    playingAyahNumber,
    isPlayingAudio,
    isDragging,
    onAyahClick,
    canRefit,
  }) => {
    // ref on the scrollable text wrapper — NOT the container
    const textRef = useRef<HTMLDivElement>(null);

    /**
     * Binary-search the largest fontSize (px) such that
     * textRef.scrollHeight <= textRef.parentElement.clientHeight.
     *
     * Runs synchronously after every DOM paint for this page, so the
     * browser never displays a clipped page.
     */
    useLayoutEffect(() => {
      const el = textRef.current;
      if (!el) return;
      const parent = el.parentElement;
      if (!parent || parent.clientHeight === 0) return;

      let disposed = false;
      let hasFitted = false;
      let deferredFit: ReturnType<typeof setTimeout> | undefined;
      const fit = () => {
        if (disposed || !parent.clientHeight) return;
        clearTimeout(deferredFit);
        // A late font load or resize must not typeset Arabic during a swipe.
        if (hasFitted && !canRefit()) {
          deferredFit = setTimeout(fit, 80);
          return;
        }
        hasFitted = true;
        const availH = parent.clientHeight - 8;
        el.style.lineHeight = String(QURAN_LINE_HEIGHT);
        const fitKey = `${data.pageNumber}:${parent.clientWidth}:${availH}:${document.fonts.status}`;
        const cachedSize = fittedPageSizes.get(fitKey);
        if (cachedSize !== undefined) {
          el.style.fontSize = `${cachedSize}px`;
          if (el.scrollHeight <= availH && el.scrollWidth <= parent.clientWidth) return;
        }
        let lo = 8, hi = Math.min(42, parent.clientWidth / 13);
        for (let i = 0; i < 30 && hi - lo > 0.1; i++) {
          const mid = (lo + hi) / 2;
          el.style.fontSize = `${mid}px`;
          if (el.scrollHeight <= availH && el.scrollWidth <= parent.clientWidth) lo = mid;
          else hi = mid;
        }
        const size = Math.max(8, lo - 0.15);
        el.style.fontSize = `${size}px`;
        if (fittedPageSizes.size >= 96) fittedPageSizes.delete(fittedPageSizes.keys().next().value!);
        fittedPageSizes.set(fitKey, size);
      };
      fit();
      const observer = new ResizeObserver(fit);
      observer.observe(parent);
      void document.fonts.ready.then(fit);
      return () => { disposed = true; clearTimeout(deferredFit); observer.disconnect(); };
    }, [data.pageNumber, canRefit]);

    return (
      <div
        className="mushaf-paper w-full h-full flex flex-col overflow-hidden relative"
        data-mushaf-page={data.pageNumber}
      >
        {/* Inner frame */}
        <div
          className="absolute inset-[4px] border pointer-events-none z-10"
          style={{ borderColor: 'var(--mushaf-border-soft)' }}
        />

        {/* ── TOP: printed-style turquoise ornament + surah plate ── */}
        {data.ayahs[0]?.ayahNumberInSurah === 1 && <div className="mushaf-ornament-band shrink-0 z-20">
          <div className="mushaf-surah-plate font-spiritual-serif text-[0.9rem] font-bold">
            سُورَةُ {data.surahsPresent[0]?.arabicName || ''}
          </div>
        </div>}
        <div
          className="mushaf-running-title shrink-0 flex items-center justify-between z-20"
        >
          <span className="text-[10.5px] font-bold font-sans" style={{ color: 'var(--mushaf-muted)' }}>
            سورة {data.surahsPresent[0]?.arabicName}
          </span>
          <span className="text-[10.5px] font-bold font-sans" style={{ color: 'var(--mushaf-muted)' }}>
            الجزء {data.juz}
          </span>
        </div>

        {/* ── MIDDLE: auto-fitting Quran text ── */}
        {/* This div is the PARENT measured by useLayoutEffect */}
        <div className="mushaf-text-area flex-1 min-h-0 overflow-hidden flex flex-col justify-center z-20">
          {/* textRef: the element whose scrollHeight is measured */}
          <div
            ref={textRef}
            dir="rtl"
            className="w-full font-quran text-justify [text-align-last:center] tracking-normal"
            style={{
              fontSize: '14px',
              lineHeight: QURAN_LINE_HEIGHT,
              color: 'var(--mushaf-text)',
              opacity: 1,
            }}
          >
            {/* ── ALL Ayat on this page ── */}
            {data.ayahs.map((ayah) => {
              // A page can contain the end of one surah and the beginning of
              // another. The intro must be inserted at the exact ayah boundary
              // (not before the whole page), otherwise the new surah's banner
              // appears above the previous surah's final verses.
              const surahInfo = data.surahsPresent.find(
                (sInfo) => sInfo.number === ayah.surahNumber
              );
              const startsNewSurah = ayah.ayahNumberInSurah === 1 && surahInfo?.startsOnThisPage;
              const isTopPlateSurah = ayah.surahNumber === data.surahsPresent[0]?.number;
              const cleanText = getCleanAyahText(
                ayah.surahNumber,
                ayah.ayahNumberInSurah,
                ayah.text
              );
              const isSelected =
                !isUnderlying &&
                activeAyah?.globalAyahNumber === ayah.globalAyahNumber;
              const isPlaying =
                !isUnderlying &&
                playingAyahNumber === ayah.globalAyahNumber &&
                isPlayingAudio;
              const isBookmarked =
                activeBookmark?.surahNumber === ayah.surahNumber &&
                activeBookmark?.ayahNumberInSurah === ayah.ayahNumberInSurah;

              return (
                <React.Fragment key={ayah.globalAyahNumber}>
                  {startsNewSurah && surahInfo && <div className="text-center mb-1">
                    {!isTopPlateSurah && <div className="mushaf-ornament-band mushaf-surah-divider" data-surah-start={ayah.surahNumber}>
                      <div className="mushaf-surah-plate font-spiritual-serif text-[0.9em] font-bold">
                        سُورَةُ {surahInfo.arabicName}
                      </div>
                    </div>}
                    {/* Bismillah belongs immediately before this surah's first ayah. */}
                    {surahInfo.number !== 1 && surahInfo.number !== 9 && (
                      <div className="mt-0.5">
                        <span
                          className="font-quran text-[0.88em]"
                          style={{ color: 'var(--mushaf-text)' }}
                        >
                          {BISMILLAH_UTHMANI}
                        </span>
                      </div>
                    )}
                  </div>}
                  <span
                  data-verse={`${ayah.surahNumber}:${ayah.ayahNumberInSurah}`}
                  onClick={(e) => {
                    if (isUnderlying) return;
                    // During a committed drag the pointer is captured to <main>,
                    // so this onClick can ONLY fire on genuine taps. No extra guard needed.
                    e.stopPropagation();
                    onAyahClick(ayah);
                  }}
                  className={`inline cursor-pointer rounded-sm transition-colors duration-150 px-0.5 ${
                    isPlaying
                      ? 'bg-[#C6A15B]/40 ring-1 ring-[#C6A15B]'
                      : isSelected
                      ? 'bg-[#C6A15B]/22 dark:bg-[#C6A15B]/30 ring-1 ring-[#C6A15B]/50'
                      : isBookmarked
                      ? 'bg-amber-400/15'
                      : !isUnderlying
                      ? 'hover:bg-[#C6A15B]/10'
                      : ''
                  }`}
                >
                  {cleanText}
                  {/* Verse number badge */}
                  <span
                    className="mushaf-ayah-medallion select-none"
                  >
                    <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 2C28 2 28 7 32 7C37 5 40 9 39 13C45 14 46 19 43 24C46 29 45 34 39 35C40 39 37 43 32 41C28 41 28 46 24 46C20 46 20 41 16 41C11 43 8 39 9 35C3 34 2 29 5 24C2 19 3 14 9 13C8 9 11 5 16 7C20 7 20 2 24 2Z"/><ellipse cx="24" cy="24" rx="15" ry="18"/><path d="M18 8L24 5L30 8M18 40L24 43L30 40"/></svg>
                    <span>{ayah.ayahNumberInSurah.toLocaleString('ar-EG')}</span>
                  </span>
                  </span>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── BOTTOM: printed-style ornament + page number ── */}
        <div className="mushaf-ornament-band mushaf-ornament-band-bottom shrink-0 z-20">
          <span className="mushaf-surah-plate mushaf-page-folio">{data.pageNumber}</span>
        </div>

      </div>
    );
  }
);

MushafPageContent.displayName = 'MushafPageContent';

// ─────────────────────────────────────────────────────────────────
// Main QuranPage component
// ─────────────────────────────────────────────────────────────────

export const QuranPage: React.FC = () => {
  const reducedMotion = useReducedMotion();
  const { recordDailyActivity, cache, today } = useStreak();
  const { setActiveTab, showToast } = useApp();

  // ── Current page ──
  const [currentPage, setCurrentPage] = useState<number>(() => getSavedMushafPage());
  const [pageData, setPageData] = useState<MushafPageData | null>(null);
  const [nextPageData, setNextPageData] = useState<MushafPageData | null>(null);
  const [prevPageData, setPrevPageData] = useState<MushafPageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  // ── Bookmark ──
  const [activeBookmark, setActiveBookmark] = useState<QuranBookmark | null>(
    () => getSavedBookmark()
  );

  // ── Ayah / Tafsir ──
  const [activeAyah, setActiveAyah] = useState<MushafPageAyah | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playingAyahNumber, setPlayingAyahNumber] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [selectedTafsirSource, setSelectedTafsirSource] = useState('ar.muyassar');
  const [tafsirData, setTafsirData] = useState<AyahTafsirResult | null>(null);
  const [loadingTafsir, setLoadingTafsir] = useState(false);
  const [tafsirError, setTafsirError] = useState<string | null>(null);

  // ── Modals ──
  const [isSurahIndexOpen, setIsSurahIndexOpen] = useState(false);
  const [isJuzIndexOpen, setIsJuzIndexOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<QuranSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // iOS Safari zooms the page when a focused input is smaller than 16px. Keep
  // the search field at a readable mobile size and blur it on close so the
  // visual viewport returns to the reader instead of staying magnified.
  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
    requestAnimationFrame(() => {
      const focused = document.activeElement;
      if (focused instanceof HTMLElement) focused.blur();
      if (window.visualViewport && window.visualViewport.scale > 1.01) {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }
    });
  }, []);

  // ── Drag / Gesture state ──
  // A flat horizontal carousel: the current and adjacent pages move together.
  // LEFT → RIGHT (deltaX > 0) = NEXT PAGE
  // RIGHT → LEFT (deltaX < 0) = PREVIOUS PAGE
  const viewportRef = useRef<HTMLDivElement>(null);
  const mushafDivRef = useRef<HTMLDivElement>(null);
  const dragWidthRef = useRef(360);
  const dragFrameRef = useRef<number | null>(null);
  const selectAyah = useCallback((ayah: MushafPageAyah) => setActiveAyah(ayah), []);

  // Gesture state — all in refs so they never cause re-renders during drag
  const isPointerDownRef = useRef(false);       // pointer is held
  const hasCommittedToDragRef = useRef(false);  // crossed the drag threshold → pointer captured
  const isDraggingRef = useRef(false);           // same as hasCommittedToDragRef, used to skip click
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentDeltaXRef = useRef(0);
  const dragStartedAtRef = useRef(0);
  const dragOffsetRef = useRef(0);
  const capturedPointerIdRef = useRef<number>(-1);
  const isAnimatingRef = useRef(false);
  const canRefit = useCallback(() => !isPointerDownRef.current && !isAnimatingRef.current, []);
  const turnAnimationRef = useRef<Animation | null>(null);
  const queuedTurnsRef = useRef<Array<'next' | 'prev'>>([]);
  const turnHandlersRef = useRef<{ next: () => void; prev: () => void } | null>(null);
  const queuedFrameRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const [turnPageData, setTurnPageData] = useState<MushafPageData | null>(null);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      turnAnimationRef.current?.cancel();
      if (dragFrameRef.current !== null) cancelAnimationFrame(dragFrameRef.current);
      if (queuedFrameRef.current !== null) cancelAnimationFrame(queuedFrameRef.current);
      queuedTurnsRef.current = [];
    };
  }, []);

  // Track drag visually by updating the mushaf div's transform directly
  // (no React re-render needed during drag — keeps it 60fps)
  const setMushafTransform = useCallback((tx: number, withTransition: boolean) => {
    const el = mushafDivRef.current;
    if (!el) return;
    el.style.transition = withTransition && !reducedMotion ? 'transform 260ms cubic-bezier(.25,.8,.25,1)' : 'none';
    dragOffsetRef.current = reducedMotion ? 0 : tx;
    el.style.transform = `translate3d(${dragOffsetRef.current}px,0,0)`;
  }, [reducedMotion]);

  const paintDrag = useCallback(() => {
    dragFrameRef.current = null;
    const dx = currentDeltaXRef.current;
    setMushafTransform(Math.max(-dragWidthRef.current, Math.min(dragWidthRef.current, dx)), false);
  }, [setMushafTransform]);

  const allSurahs = useMemo(() => getAllSurahs(), []);

  // ─────────────────────────────────────────────────────────────
  // Data loading
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    const preparationTimers = new Set<ReturnType<typeof setTimeout>>();
    const prepareNeighbor = (data: MushafPageData, setData: (page: MushafPageData) => void) => {
      const prepare = () => {
        if (!mounted) return;
        if (isPointerDownRef.current || isAnimatingRef.current) {
          preparationTimers.add(setTimeout(prepare, 80));
          return;
        }
        setData(data);
      };
      // Let the promoted sheet paint before typesetting the next unseen page.
      preparationTimers.add(setTimeout(prepare, 120));
    };
    setLoading(pageData?.pageNumber !== currentPage);
    setPageError(null);
    setActiveAyah(null);
    setTafsirData(null);

    getMushafPage(currentPage)
      .then((data) => {
        if (mounted) {
          setPageData(data);
          setLoading(false);
          saveMushafPage(currentPage);
        }
      })
      .catch((err) => {
        if (mounted) {
          setPageError(err.message || 'تعذر تحميل صفحة المصحف الشريف');
          setLoading(false);
        }
      });

    if (currentPage < 604)
      getMushafPage(currentPage + 1)
        .then((d) => prepareNeighbor(d, setNextPageData))
        .catch(() => {});
    else setNextPageData(null);

    if (currentPage > 1)
      getMushafPage(currentPage - 1)
        .then((d) => prepareNeighbor(d, setPrevPageData))
        .catch(() => {});
    else setPrevPageData(null);

    return () => { mounted = false; preparationTimers.forEach(clearTimeout); };
  }, [currentPage]);

  // Audio cleanup on page change
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        setIsPlayingAudio(false);
        setPlayingAyahNumber(null);
      }
    };
  }, [currentPage]);

  // Search
  useEffect(() => {
    if (!isSearchOpen || !searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setIsSearching(true);
      const res = await searchQuran(searchQuery);
      setSearchResults(res);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, isSearchOpen]);

  // Tafsir
  useEffect(() => {
    setTafsirData(null);
    setTafsirError(null);
    if (!activeAyah) { setLoadingTafsir(false); return; }
    let mounted = true;
    setLoadingTafsir(true);
    getAyahTafsir(activeAyah.surahNumber, activeAyah.ayahNumberInSurah, selectedTafsirSource)
      .then((res) => { if (mounted) { setTafsirData(res); setLoadingTafsir(false); } })
      .catch((err) => {
        if (mounted) {
          setTafsirError(err instanceof Error ? err.message : 'تعذر تحميل التفسير. يرجى التحقق من اتصال الإنترنت.');
          setLoadingTafsir(false);
        }
      });
    return () => { mounted = false; };
  }, [activeAyah, selectedTafsirSource]);

  // ─────────────────────────────────────────────────────────────
  // Page turn logic (safe)
  // ─────────────────────────────────────────────────────────────

  const doPageTurn = useCallback(
    async (newPage: number, direction: 'next' | 'prev') => {
      if (newPage === currentPage || newPage < 1 || newPage > 604 || isAnimatingRef.current) return;
      isAnimatingRef.current = true;
      try {
        // Commit the destination before moving the carousel, including jumps.
        const prepared = [nextPageData, prevPageData].find(page => page?.pageNumber === newPage);
        const target = prepared || await getMushafPage(newPage);
        if (!mountedRef.current) return;
        flushSync(() => setTurnPageData(target));
        const el = mushafDivRef.current;
        if (el && !reducedMotion) {
          const width = viewportRef.current?.clientWidth || dragWidthRef.current;
          const destination = direction === 'next' ? width : -width;
          const distance = Math.abs(destination - dragOffsetRef.current);
          const duration = Math.max(120, Math.min(380, 360 * distance / width));
          el.style.transition = 'none';
          const animation = el.animate([
            { transform: `translate3d(${dragOffsetRef.current}px,0,0)` },
            { transform: `translate3d(${destination}px,0,0)` },
          ], {
            duration,
            easing: 'cubic-bezier(.25,.8,.25,1)', fill: 'forwards',
          });
          turnAnimationRef.current = animation;
          // Cancellation/backgrounding must never leave navigation locked.
          let timeout: ReturnType<typeof setTimeout> | undefined;
          await Promise.race([
            animation.finished.catch(() => {}),
            new Promise<void>(resolve => { timeout = setTimeout(resolve, duration + 150); }),
          ]);
          clearTimeout(timeout);
        }
        if (!mountedRef.current) return;
        // Promote the existing DOM in one commit before releasing the old
        // animation. A RAF alone does not guarantee React has committed yet.
        flushSync(() => {
          if (newPage === currentPage + 1) { setPrevPageData(pageData); setNextPageData(null); }
          else if (newPage === currentPage - 1) { setNextPageData(pageData); setPrevPageData(null); }
          setPageData(target);
          setCurrentPage(newPage);
          setLoading(false);
          setActiveAyah(null);
          setTurnPageData(null);
        });
        turnAnimationRef.current?.cancel();
        turnAnimationRef.current = null;
        setMushafTransform(0, false);
      } catch {
        queuedTurnsRef.current = [];
        if (mountedRef.current) {
          setMushafTransform(0, true);
          setTurnPageData(null);
          showToast('تعذر فتح الصفحة. حاول مرة أخرى.');
        }
      } finally {
        turnAnimationRef.current?.cancel();
        turnAnimationRef.current = null;
        isAnimatingRef.current = false;
        // Read the latest committed page on the next frame. Repeated taps
        // should flow into another turn rather than finish or drop this one.
        if (mountedRef.current && queuedTurnsRef.current.length) {
          queuedFrameRef.current = requestAnimationFrame(() => {
            queuedFrameRef.current = null;
            const next = queuedTurnsRef.current.shift();
            if (next) turnHandlersRef.current?.[next]();
          });
        }
      }
    },
    [currentPage, pageData, nextPageData, prevPageData, reducedMotion, setMushafTransform, showToast]
  );

  const goToNextPage = useCallback(() => {
    if (isAnimatingRef.current) {
      if (queuedTurnsRef.current.length < 6) queuedTurnsRef.current.push('next');
      return;
    }
    if (currentPage < 604) doPageTurn(currentPage + 1, 'next');
    else queuedTurnsRef.current = [];
  }, [currentPage, doPageTurn]);

  const goToPrevPage = useCallback(() => {
    if (isAnimatingRef.current) {
      if (queuedTurnsRef.current.length < 6) queuedTurnsRef.current.push('prev');
      return;
    }
    if (currentPage > 1) doPageTurn(currentPage - 1, 'prev');
    else queuedTurnsRef.current = [];
  }, [currentPage, doPageTurn]);

  useLayoutEffect(() => {
    turnHandlersRef.current = { next: goToNextPage, prev: goToPrevPage };
  }, [goToNextPage, goToPrevPage]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (activeAyah || isSurahIndexOpen || isJuzIndexOpen || isSearchOpen) return;
      if (e.target instanceof HTMLElement && (e.target.isContentEditable || e.target.closest('input, textarea, select'))) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); if (!e.repeat) goToNextPage(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); if (!e.repeat) goToPrevPage(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goToNextPage, goToPrevPage, activeAyah, isSurahIndexOpen, isJuzIndexOpen, isSearchOpen]);

  // ─────────────────────────────────────────────────────────────
  // Pointer gesture handlers
  // LEFT → RIGHT (deltaX > 0) = NEXT PAGE (page follows finger right)
  // RIGHT → LEFT (deltaX < 0) = PREVIOUS PAGE
  // ─────────────────────────────────────────────────────────────

  // ─────────────────────────────────────────────────────────────
  // GESTURE ARCHITECTURE:
  //
  // A TAP (small movement):  pointerDown → pointerUp with |deltaX| < 12px
  //   → setPointerCapture is NEVER called
  //   → browser fires a normal `click` event on the ayah span ✓
  //
  // A DRAG (horizontal swipe): pointerDown → move > 12px → setPointerCapture
  //   → all subsequent pointer events go to <main>
  //   → click event fires on <main>, NOT on the ayah span
  //   → page turn committed on pointerUp
  //
  // This coexistence is what makes both tap-to-tafsir and swipe-to-turn work.
  // ─────────────────────────────────────────────────────────────

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // When Tafsir or a modal is open, gestures are suspended
      if (!e.isPrimary || e.button !== 0 || isSurahIndexOpen || isJuzIndexOpen || isSearchOpen || activeAyah) return;
      // Never jump a moving sheet to its end under a new finger gesture.
      if (isAnimatingRef.current || queuedTurnsRef.current.length) return;

      isPointerDownRef.current = true;
      hasCommittedToDragRef.current = false;
      isDraggingRef.current = false;
      startXRef.current = e.clientX;
      startYRef.current = e.clientY;
      currentDeltaXRef.current = 0;
      dragStartedAtRef.current = performance.now();
      dragWidthRef.current = viewportRef.current?.clientWidth || 360;
      capturedPointerIdRef.current = e.pointerId;
      // ⚠️  Do NOT call setPointerCapture here.
      // Doing so would prevent click events from reaching child ayah elements.
    },
    [isSurahIndexOpen, isJuzIndexOpen, isSearchOpen, activeAyah]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isPointerDownRef.current || isAnimatingRef.current || e.pointerId !== capturedPointerIdRef.current) return;

      const deltaX = e.clientX - startXRef.current;
      const deltaY = e.clientY - startYRef.current;
      if ((deltaX > 0 && currentPage === 604) || (deltaX < 0 && currentPage === 1)) {
        currentDeltaXRef.current = 0;
        setMushafTransform(0, true);
        return;
      }

      // If not yet committed to a drag, check if we should
      if (!hasCommittedToDragRef.current) {
        if (Math.abs(deltaX) > 12 && Math.abs(deltaX) > Math.abs(deltaY)) {
          // Clearly a horizontal drag — commit now and capture the pointer
          hasCommittedToDragRef.current = true;
          isDraggingRef.current = true;
          try { e.currentTarget.setPointerCapture(capturedPointerIdRef.current); } catch {}
        } else if (Math.abs(deltaY) > 12) {
          // Clearly a vertical scroll — cancel the gesture entirely
          isPointerDownRef.current = false;
          return;
        } else {
          // Too small to decide yet
          return;
        }
      }

      currentDeltaXRef.current = deltaX;

      // Coalesce events into one compositor update per display frame. No React
      // state, layout reads, or typography work belongs in the touch loop.
      if (dragFrameRef.current === null) dragFrameRef.current = requestAnimationFrame(paintDrag);
    },
    [currentPage, setMushafTransform, paintDrag]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isPointerDownRef.current || e.pointerId !== capturedPointerIdRef.current) return;
      isPointerDownRef.current = false;

      if (!hasCommittedToDragRef.current) {
        // This was a tap — do nothing here; let the ayah's onClick fire naturally.
        isDraggingRef.current = false;
        hasCommittedToDragRef.current = false;
        return;
      }

      // This was a committed drag
      currentDeltaXRef.current = e.clientX - startXRef.current;
      if (dragFrameRef.current !== null) cancelAnimationFrame(dragFrameRef.current);
      paintDrag();
      try { e.currentTarget.releasePointerCapture(capturedPointerIdRef.current); } catch {}
      hasCommittedToDragRef.current = false;
      isDraggingRef.current = false;

      const deltaX = currentDeltaXRef.current;
      const containerW = dragWidthRef.current;
      const elapsed = Math.max(1, performance.now() - dragStartedAtRef.current);
      const isFlick = Math.abs(deltaX) > 30 && Math.abs(deltaX) / elapsed > 0.45;
      const threshold = isFlick ? 30 : Math.min(60, containerW * 0.15);

      if (deltaX > threshold && currentPage < 604) {
        doPageTurn(currentPage + 1, 'next');
      } else if (deltaX < -threshold && currentPage > 1) {
        doPageTurn(currentPage - 1, 'prev');
      } else {
        setMushafTransform(0, true);
      }
    },
    [currentPage, doPageTurn, setMushafTransform, paintDrag]
  );

  const handlePointerCancel = useCallback(() => {
    if (dragFrameRef.current !== null) cancelAnimationFrame(dragFrameRef.current);
    dragFrameRef.current = null;
    isPointerDownRef.current = false;
    hasCommittedToDragRef.current = false;
    isDraggingRef.current = false;
    // Keep the prepared sheet behind the returning page during snap-back.
    setMushafTransform(0, true);
  }, [setMushafTransform]);

  // ─────────────────────────────────────────────────────────────
  // Audio
  // ─────────────────────────────────────────────────────────────
  const handleToggleAudio = (ayah: MushafPageAyah) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.onended = () => { setIsPlayingAudio(false); setPlayingAyahNumber(null); };
    }
    if (playingAyahNumber === ayah.globalAyahNumber && isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      const audio = audioRef.current;
      let reportedFailure = false;
      const reportAudioFailure = () => {
        if (reportedFailure || audioRef.current !== audio) return;
        reportedFailure = true;
        setIsPlayingAudio(false);
        setPlayingAyahNumber(null);
        showToast('تعذر تشغيل التلاوة. الاستماع يحتاج إلى اتصال بالإنترنت؛ يمكنك متابعة قراءة المصحف.', 'error');
      };
      audio.onerror = reportAudioFailure;
      audio.src = getAyahAudioUrl(ayah.globalAyahNumber);
      audio.play()
        .then(() => { setPlayingAyahNumber(ayah.globalAyahNumber); setIsPlayingAudio(true); })
        .catch((err) => {
          // Changing the verse or leaving the page can cancel playback normally.
          if (err?.name !== 'AbortError') reportAudioFailure();
        });
    }
  };

  // Copy
  const handleCopyAyah = (ayah: MushafPageAyah) => {
    const clean = getCleanAyahText(ayah.surahNumber, ayah.ayahNumberInSurah, ayah.text);
    const citation = `﴿${clean}﴾ [سورة ${ayah.surahArabicName}: ${ayah.ayahNumberInSurah}]`;
    navigator.clipboard.writeText(citation).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  // Share
  const handleShareAyah = (ayah: MushafPageAyah) => {
    const clean = getCleanAyahText(ayah.surahNumber, ayah.ayahNumberInSurah, ayah.text);
    const text = `﴿${clean}﴾\n[سورة ${ayah.surahArabicName}: الآية ${ayah.ayahNumberInSurah}] — عبر تطبيق قضاء`;
    if (navigator.share) {
      navigator.share({ title: `سورة ${ayah.surahArabicName}`, text }).catch(() => {});
    } else {
      handleCopyAyah(ayah);
    }
  };

  // Bookmark
  const handleToggleBookmark = (ayah: MushafPageAyah) => {
    const isCurrent =
      activeBookmark?.surahNumber === ayah.surahNumber &&
      activeBookmark?.ayahNumberInSurah === ayah.ayahNumberInSurah;
    if (isCurrent) {
      removeBookmark();
      setActiveBookmark(null);
    } else {
      const bm: QuranBookmark = {
        surahNumber: ayah.surahNumber,
        ayahNumberInSurah: ayah.ayahNumberInSurah,
        surahArabicName: ayah.surahArabicName,
        timestamp: Date.now(),
      };
      saveBookmark(bm);
      setActiveBookmark(bm);
      encourageProgress('أحسنت! حفظت موضعك في القرآن لتتابع وردك. بارك الله في قراءتك!');
    }
  };

  // Navigation jumps
  const handleJumpToSurah = (surahNumber: number) => {
    const p = getSurahStartPage(surahNumber);
    doPageTurn(p, p > currentPage ? 'next' : 'prev');
    setIsSurahIndexOpen(false);
  };

  const handleJumpToJuz = (juzNumber: number) => {
    const p = getJuzStartPage(juzNumber);
    doPageTurn(p, p > currentPage ? 'next' : 'prev');
    setIsJuzIndexOpen(false);
  };

  // ─────────────────────────────────────────────────────────────
  // Shared ayah-action props for both desktop panel + mobile sheet
  // ─────────────────────────────────────────────────────────────
  const renderAyahActions = (ayah: MushafPageAyah, compact = false) => {
    const bmActive =
      activeBookmark?.surahNumber === ayah.surahNumber &&
      activeBookmark?.ayahNumberInSurah === ayah.ayahNumberInSurah;
    const playing = playingAyahNumber === ayah.globalAyahNumber && isPlayingAudio;
    const cls = compact
      ? 'p-2 rounded-xl flex flex-col items-center gap-0.5 text-[10px] font-bold cursor-pointer transition-colors'
      : 'p-2 rounded-xl flex items-center justify-center gap-1 text-xs font-bold cursor-pointer transition-colors';

    return (
      <>
      <div className={`grid grid-cols-4 gap-${compact ? '1' : '2'}`}>
        <button
          type="button"
          onClick={() => handleToggleBookmark(ayah)}
          className={`${cls} ${bmActive ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-black/5 dark:bg-white/5 hover:bg-[#C6A15B]/20 text-[#26352A] dark:text-[#E8DDD0]'}`}
        >
          <Bookmark className={`${compact ? 'w-3.5 h-3.5' : 'w-3.5 h-3.5'} ${bmActive ? 'fill-current' : ''}`} />
          <span>حفظ</span>
        </button>
        <button
          type="button"
          onClick={() => handleCopyAyah(ayah)}
          className={`${cls} bg-black/5 dark:bg-white/5 hover:bg-[#C6A15B]/20 text-[#26352A] dark:text-[#E8DDD0]`}
        >
          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{isCopied ? 'تم' : 'نسخ'}</span>
        </button>
        <button
          type="button"
          onClick={() => handleToggleAudio(ayah)}
          className={`${cls} ${playing ? 'bg-[#C6A15B] text-white shadow-sm' : 'bg-black/5 dark:bg-white/5 hover:bg-[#C6A15B]/20 text-[#26352A] dark:text-[#E8DDD0]'}`}
        >
          {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{playing ? 'إيقاف' : 'استماع'}</span>
        </button>
        <button
          type="button"
          onClick={() => handleShareAyah(ayah)}
          className={`${cls} bg-black/5 dark:bg-white/5 hover:bg-[#C6A15B]/20 text-[#26352A] dark:text-[#E8DDD0]`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>مشاركة</span>
        </button>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-[#526055] dark:text-[#A9B7A3]">
        التلاوة وتحميل تفسير جديد يحتاجان إلى الإنترنت. التفسير المحفوظ متاح دون اتصال.
      </p>
      </>
    );
  };

  const renderTafsirContent = () => (
    <>
      {/* Source selector */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <span className="text-xs font-bold text-[#C6A15B]">مصدر التفسير:</span>
        <select
          value={selectedTafsirSource}
          onChange={(e) => setSelectedTafsirSource(e.target.value)}
          className="text-xs bg-white dark:bg-[#202E24] border border-[#C6A15B]/30 rounded-xl px-2 py-1 cursor-pointer"
        >
          {TAFSIR_SOURCES.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      {/* Text */}
      {loadingTafsir && (
        <div className="py-6 text-center">
          <div className="w-5 h-5 border-2 border-[#C6A15B] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-[#7E8C7F]">جاري تحميل التفسير...</p>
        </div>
      )}
      {tafsirError && !loadingTafsir && (
        <p role="status" className="py-3 text-xs leading-relaxed text-[#9E3A3A] dark:text-[#F1B6B6]">
          {tafsirError}
        </p>
      )}
      {tafsirData && !loadingTafsir && (
        <div>
          <p className="text-sm leading-relaxed text-[#1D211E] dark:text-[#F6F1E7]">
            {tafsirData.text}
          </p>
          <p className="text-[11px] text-[#7E8C7F] mt-4 pt-2 border-t border-black/5 dark:border-white/5">
            المصدر: {tafsirData.sourceName} — {tafsirData.sourceAuthor}
          </p>
        </div>
      )}
    </>
  );

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  return (
    <div
      className="qada-guide-quran qada-fullscreen-reader relative w-full flex flex-col select-none overflow-hidden"
      data-guide-page="quran"
      dir="rtl"
    >
      {/* ══ 1. HEADER BAR ══ */}
      <header className="qada-reader-toolbar h-11 px-1 flex items-center justify-between gap-1 border-b border-[#C6A15B]/20 bg-[#FAF7F2]/90 dark:bg-[#18231C]/90 shrink-0 z-30" data-guide="quran">
        <div className="flex items-center gap-1.5">
          {/* Back to Dashboard */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-[#C6A15B]/20 text-xs font-bold text-[#26352A] dark:text-[#E8DDD0] transition-colors cursor-pointer"
            title="العودة إلى الرئيسية"
            aria-label="العودة إلى الرئيسية"
          >
            <Home className="w-3.5 h-3.5 text-[#C6A15B]" />
            <span className="hidden sm:inline">الرئيسية</span>
          </button>

          {/* Surahs Index */}
          <button
            type="button"
            onClick={() => setIsSurahIndexOpen(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-[#C6A15B]/20 text-xs font-bold text-[#26352A] dark:text-[#E8DDD0] transition-colors cursor-pointer"
          >
            <List className="w-3.5 h-3.5 text-[#C6A15B]" />
            <span>السور</span>
          </button>

          {/* Juz Index */}
          <button
            type="button"
            onClick={() => setIsJuzIndexOpen(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-[#C6A15B]/20 text-xs font-bold text-[#26352A] dark:text-[#E8DDD0] transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-[#C6A15B]" />
            <span>الأجزاء</span>
          </button>
        </div>

        {/* Current surah name */}
        <div className="hidden sm:block text-center">
          {pageData?.surahsPresent?.[0] && (
            <span className="text-xs sm:text-sm font-bold font-spiritual-serif text-[#1D211E] dark:text-[#F6F1E7]">
              سورة {pageData.surahsPresent[0].arabicName}
            </span>
          )}
        </div>

        {/* Search + Bookmark */}
        <div className="flex items-center gap-1">
          <button type="button" aria-label={cache.events.some(e => e.date === today && e.type === 'quran') ? 'تم تسجيل قراءة اليوم' : 'قرأت من القرآن اليوم'} title="قرأت من القرآن اليوم" disabled={cache.events.some(e => e.date === today && e.type === 'quran')} className="w-10 h-10 flex items-center justify-center rounded-xl text-[#C6A15B] disabled:bg-[#C6A15B]/15" onClick={() => {
            void recordDailyActivity('quran');
            encourageProgress('أحسنت! سجّلت قراءتك اليوم. واصل على مهل.');
          }}><Check size={18} /></button>
          <FeatureHelp topic="quran" />
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="p-1.5 rounded-xl bg-black/5 dark:bg-white/5 text-[#7E8C7F] hover:text-[#C6A15B] cursor-pointer"
            title="بحث في القرآن"
          >
            <Search className="w-4 h-4" />
          </button>

          {activeBookmark && (
            <button
              type="button"
              onClick={() => {
                const p = getSurahStartPage(activeBookmark.surahNumber);
                doPageTurn(p, p > currentPage ? 'next' : 'prev');
              }}
              className="p-1.5 rounded-xl bg-[#C6A15B]/20 text-[#C6A15B] cursor-pointer"
              title="الانتقال للعلامة المحفوظة"
            >
              <Bookmark className="w-4 h-4 fill-current" />
            </button>
          )}
        </div>
      </header>

      {/* ══ 2. MUSHAF VIEWPORT + OPTIONAL DESKTOP TAFSIR PANEL ══ */}
      <div className="flex-1 min-h-0 flex items-stretch justify-center gap-3 w-full overflow-hidden">
        {/* ── Mushaf viewport (pointer target) ── */}
        <main
          ref={viewportRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          className={`relative h-full overflow-hidden cursor-grab active:cursor-grabbing ${
            activeAyah ? 'w-full lg:w-[56%] max-w-xl' : 'w-full max-w-xl'
          }`}
          style={{ touchAction: 'pan-y pinch-zoom' }}
        >
          <div ref={mushafDivRef} className="mushaf-swipe-track absolute inset-0">
          {/* Keep sheets keyed by page number. Promoting a prepared page must
              not rebuild its Arabic text, refit its font, or flash a new DOM. */}
          {!loading && Array.from(new Map(
            [prevPageData, nextPageData, pageData, turnPageData]
              .filter((page): page is MushafPageData => Boolean(page))
              .map(page => [page.pageNumber, page] as const)
          ).values()).map(sheet => {
            const isCurrent = sheet.pageNumber === currentPage;
            const direction = sheet.pageNumber > currentPage ? 'next' : 'prev';
            const isDestination = turnPageData ? sheet.pageNumber === turnPageData.pageNumber : Math.abs(sheet.pageNumber - currentPage) === 1;
            return <div
              key={sheet.pageNumber}
              aria-hidden={!isCurrent}
              inert={!isCurrent}
              className={`mushaf-sheet absolute inset-0 p-1 ${isCurrent ? 'mushaf-current-sheet' : 'pointer-events-none'}`}
              style={{
                visibility: isCurrent || isDestination ? 'visible' : 'hidden',
                transform: `translate3d(${isCurrent ? 0 : direction === 'next' ? -100 : 100}%,0,0)`,
              }}
            >
              <MushafPageContent
                data={sheet}
                activeAyah={isCurrent ? activeAyah : null}
                activeBookmark={activeBookmark}
                playingAyahNumber={isCurrent ? playingAyahNumber : null}
                isPlayingAudio={isCurrent && isPlayingAudio}
                isDragging={false}
                onAyahClick={selectAyah}
                canRefit={canRefit}
              />
            </div>;
          })}
          </div>

          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20">
              <div className="w-8 h-8 border-2 border-[#C6A15B] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-[#7E8C7F]">جاري فتح المصحف الشريف...</p>
            </div>
          )}

          {pageError && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20">
              <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-900/20 text-center space-y-3">
                <p className="text-xs text-red-600 dark:text-red-400 font-bold">{pageError}</p>
                <TactileButton
                  onClick={() => setCurrentPage((p) => p)}
                  className="px-4 py-2 rounded-xl bg-[#26352A] text-white text-xs cursor-pointer"
                >
                  إعادة المحاولة
                </TactileButton>
              </div>
            </div>
          )}
        </main>

        {/* ── Desktop side-by-side Tafsir panel ── */}
        <AnimatePresence>
          {activeAyah && (
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="hidden lg:flex flex-col w-[44%] max-w-sm h-full rounded-3xl border-2 border-[#C6A15B]/35 shadow-xl p-5 overflow-hidden shrink-0"
              style={{
                background:
                  'linear-gradient(160deg, var(--qada-bg) 0%, var(--qada-surface-2) 100%)',
              }}
              dir="rtl"
            >
              {/* Panel header */}
              <div className="flex items-start justify-between border-b border-[#C6A15B]/20 pb-3 mb-3 shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-[#C6A15B] font-spiritual-serif">
                    تفسير الآية الكريمة
                  </h3>
                  <p className="text-[11px] text-[#7E8C7F] mt-0.5">
                    سورة {activeAyah.surahArabicName} • الآية {activeAyah.ayahNumberInSurah}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveAyah(null)}
                  className="p-1 rounded-full text-[#7E8C7F] hover:text-black dark:hover:text-white cursor-pointer"
                  title="إغلاق التفسير"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Ayah quote */}
              <div className="p-3 rounded-2xl bg-white/80 dark:bg-[#202E24] border border-[#C6A15B]/20 mb-3 shrink-0">
                <p className="font-quran text-base text-[#1D211E] dark:text-[#F6F1E7] leading-relaxed text-right">
                  ﴿{getCleanAyahText(
                    activeAyah.surahNumber,
                    activeAyah.ayahNumberInSurah,
                    activeAyah.text
                  )}﴾
                </p>
              </div>

              {/* Actions */}
              <div className="mb-3 shrink-0">
                {renderAyahActions(activeAyah, false)}
              </div>

              {/* Tafsir (scrollable) */}
              <div className="flex-grow overflow-y-auto p-4 rounded-2xl bg-white/90 dark:bg-[#202E24] border border-[#C6A15B]/20 space-y-3">
                {renderTafsirContent()}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* ══ 3. BOTTOM PAGE TURN BAR ══ */}
      <footer className="h-12 px-3 flex items-center justify-between border-t border-[#C6A15B]/20 bg-[#FAF7F2]/90 dark:bg-[#18231C]/90 shrink-0 z-30">
        {/* Next Page (LEFT → RIGHT) */}
        <button
          type="button"
          onClick={goToNextPage}
          disabled={currentPage >= 604}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
            currentPage >= 604
              ? 'opacity-30 cursor-not-allowed text-[#7E8C7F]'
              : 'bg-black/5 dark:bg-white/5 hover:bg-[#C6A15B]/20 text-[#26352A] dark:text-[#E8DDD0]'
          }`}
        >
          <span>التالية</span>
          <ChevronLeft className="w-4 h-4 text-[#C6A15B]" />
        </button>

        {/* Page jump */}
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#C6A15B] font-sans">
          <span>صفحة</span>
          <input
            type="number"
            min={1}
            max={604}
            value={currentPage}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (v >= 1 && v <= 604) doPageTurn(v, v > currentPage ? 'next' : 'prev');
            }}
            className="w-12 text-center py-0.5 rounded-lg border border-[#C6A15B]/30 bg-white dark:bg-[#18231C] text-xs font-bold font-sans text-[#1D211E] dark:text-[#F6F1E7]"
          />
          <span className="text-[#7E8C7F] font-normal">/ 604</span>
        </div>

        {/* Previous Page (RIGHT → LEFT) */}
        <button
          type="button"
          onClick={goToPrevPage}
          disabled={currentPage <= 1}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
            currentPage <= 1
              ? 'opacity-30 cursor-not-allowed text-[#7E8C7F]'
              : 'bg-black/5 dark:bg-white/5 hover:bg-[#C6A15B]/20 text-[#26352A] dark:text-[#E8DDD0]'
          }`}
        >
          <ChevronRight className="w-4 h-4 text-[#C6A15B]" />
          <span>السابقة</span>
        </button>
      </footer>

      {/* ══ 4. MOBILE TAFSIR BOTTOM SHEET ══ */}
      <AnimatePresence>
        {activeAyah && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="lg:hidden fixed inset-x-0 bottom-16 z-50 max-w-lg mx-auto px-3"
            dir="rtl"
          >
            <div className="rounded-3xl bg-[#FAF8F3]/98 dark:bg-[#1C2820]/98 backdrop-blur-xl border border-[#C6A15B]/35 shadow-2xl p-4 space-y-3 max-h-[75vh] overflow-y-auto">
              {/* Drag handle */}
              <div
                className="w-10 h-1 rounded-full bg-black/20 dark:bg-white/20 mx-auto cursor-pointer"
                onClick={() => setActiveAyah(null)}
              />

              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#C6A15B]/15 pb-2">
                <span className="text-xs font-bold text-[#C6A15B] font-spiritual-serif">
                  تفسير: سورة {activeAyah.surahArabicName} — الآية {activeAyah.ayahNumberInSurah}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveAyah(null)}
                  className="p-1 rounded-full text-[#7E8C7F] hover:text-black cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Ayah text */}
              <div className="p-3 rounded-2xl bg-white/80 dark:bg-[#18231C]/80 border border-[#C6A15B]/20">
                <p className="font-quran text-base text-[#1D211E] dark:text-[#F6F1E7] leading-relaxed text-right">
                  ﴿{getCleanAyahText(
                    activeAyah.surahNumber,
                    activeAyah.ayahNumberInSurah,
                    activeAyah.text
                  )}﴾
                </p>
              </div>

              {/* Actions */}
              {renderAyahActions(activeAyah, true)}

              {/* Tafsir */}
              <div className="pt-2 border-t border-[#C6A15B]/15 space-y-2">
                {renderTafsirContent()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ 5. MODAL: 114 SURAHS ══ */}
      <AnimatePresence>
        {isSurahIndexOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm"
            dir="rtl"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md h-[80vh] rounded-3xl bg-[#FAF8F3] dark:bg-[#1C2820] border border-[#C6A15B]/30 p-5 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#C6A15B]/20">
                <h3 className="text-base font-bold font-spiritual-serif text-[#1D211E] dark:text-[#F6F1E7]">
                  فهرس السور (114 سورة)
                </h3>
                <button
                  type="button"
                  onClick={() => setIsSurahIndexOpen(false)}
                  className="p-1.5 text-[#7E8C7F] hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto space-y-1.5 py-3 pr-1">
                {allSurahs.map((s) => (
                  <button
                    key={s.number}
                    type="button"
                    onClick={() => handleJumpToSurah(s.number)}
                    className="w-full p-2.5 rounded-xl bg-white/70 dark:bg-[#18231C]/70 hover:bg-[#C6A15B]/15 text-xs flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#C6A15B]/15 text-[#C6A15B] font-bold font-sans flex items-center justify-center text-[11px]">
                        {s.number}
                      </span>
                      <span className="font-bold text-[#1D211E] dark:text-[#F6F1E7]">
                        سورة {s.arabicName}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#7E8C7F] font-sans">
                      ص {s.pageNumber} • {s.versesCount} آية
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ 6. MODAL: 30 JUZS ══ */}
      <AnimatePresence>
        {isJuzIndexOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm"
            dir="rtl"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md h-[75vh] rounded-3xl bg-[#FAF8F3] dark:bg-[#1C2820] border border-[#C6A15B]/30 p-5 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#C6A15B]/20">
                <h3 className="text-base font-bold font-spiritual-serif text-[#1D211E] dark:text-[#F6F1E7]">
                  فهرس الأجزاء (30 جزء)
                </h3>
                <button
                  type="button"
                  onClick={() => setIsJuzIndexOpen(false)}
                  className="p-1.5 text-[#7E8C7F] hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto grid grid-cols-2 gap-2 py-3 pr-1">
                {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => (
                  <button
                    key={juz}
                    type="button"
                    onClick={() => handleJumpToJuz(juz)}
                    className="p-3 rounded-xl bg-white/70 dark:bg-[#18231C]/70 hover:bg-[#C6A15B]/15 text-xs flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="font-bold text-[#1D211E] dark:text-[#F6F1E7]">
                      الجزء {juz}
                    </span>
                    <span className="text-[10px] text-[#7E8C7F] font-sans">
                      ص {getJuzStartPage(juz)}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ 7. MODAL: SEARCH ══ */}
      <AnimatePresence>
        {isSearchOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm"
            dir="rtl"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md h-[80vh] rounded-3xl bg-[#FAF8F3] dark:bg-[#1C2820] border border-[#C6A15B]/30 p-5 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#C6A15B]/20">
                <h3 className="text-base font-bold font-spiritual-serif text-[#1D211E] dark:text-[#F6F1E7]">
                  بحث في آيات المصحف الشريف
                </h3>
                <button
                  type="button"
                  onClick={closeSearch}
                  className="p-1.5 text-[#7E8C7F] hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative my-3">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7E8C7F]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="اكتب كلمة أو جملة (مثال: الله نور)..."
                  className="w-full pr-10 pl-3 py-2 rounded-xl bg-white dark:bg-[#18231C] border border-[#C6A15B]/30 text-base sm:text-xs focus:outline-none focus:border-[#C6A15B]"
                  autoComplete="off"
                  autoCapitalize="none"
                />
              </div>

              {isSearching && (
                <p className="text-center text-xs text-[#7E8C7F] py-2">جاري البحث في المصحف...</p>
              )}

              <div className="flex-grow overflow-y-auto space-y-2 pr-1">
                {searchResults.map((r, idx) => (
                  <div
                    key={`${r.surahNumber}-${r.ayahNumberInSurah}-${idx}`}
                    onClick={() => {
                      const p = getSurahStartPage(r.surahNumber);
                      doPageTurn(p, p > currentPage ? 'next' : 'prev');
                      closeSearch();
                    }}
                    className="p-3 rounded-xl bg-white/70 dark:bg-[#18231C]/70 hover:bg-[#C6A15B]/15 cursor-pointer text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-[#C6A15B]">
                      <span>سورة {r.surahArabicName} — الآية {r.ayahNumberInSurah}</span>
                    </div>
                    <p className="font-quran text-sm text-[#1D211E] dark:text-[#F6F1E7] leading-relaxed">
                      ﴿{r.text}﴾
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
