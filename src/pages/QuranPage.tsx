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
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { TactileButton } from '../components/ui/MotionPrimitives';
import { StarEightPoint } from '../components/landing/IslamicOrnaments';
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
}

const QURAN_LINE_HEIGHT = 2.08;

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

      const availH = parent.clientHeight;

      // Set constant line-height for measurement
      el.style.lineHeight = String(QURAN_LINE_HEIGHT);

      // Quick check: does 17px fit?
      el.style.fontSize = '17px';
      if (el.scrollHeight <= availH) {
        // Already fine — leave at 17px
        return;
      }

      // Binary-search between 8 and 17
      let lo = 8,
        hi = 17;
      for (let i = 0; i < 30; i++) {
        if (hi - lo < 0.2) break;
        const mid = (lo + hi) / 2;
        el.style.fontSize = `${mid}px`;
        if (el.scrollHeight <= availH) {
          lo = mid;
        } else {
          hi = mid;
        }
      }

      // Apply a tiny safety margin (0.15px) so the last line never clips
      el.style.fontSize = `${Math.max(8, lo - 0.15)}px`;
    }, [data.pageNumber]);

    return (
      <div
        className="w-full h-full rounded-2xl sm:rounded-3xl flex flex-col overflow-hidden relative"
        style={{
          background:
            'linear-gradient(160deg, var(--mushaf-bg-top) 0%, var(--mushaf-bg-bottom) 100%)',
          border: '2px solid var(--mushaf-border)',
          boxShadow: 'var(--mushaf-shadow)',
        }}
      >
        {/* ── Corner ornaments ── */}
        {['top-2 right-2', 'top-2 left-2', 'bottom-2 right-2', 'bottom-2 left-2'].map(
          (pos) => (
            <div key={pos} className={`absolute ${pos} pointer-events-none z-10`}>
              <StarEightPoint size={10} color="var(--mushaf-accent)" />
            </div>
          )
        )}

        {/* Inner frame */}
        <div
          className="absolute inset-[7px] border rounded-xl pointer-events-none z-10"
          style={{ borderColor: 'var(--mushaf-border-soft)' }}
        />

        {/* ── TOP: surah + juz ── */}
        <div
          className="shrink-0 flex items-center justify-between px-5 border-b border-[#C6A15B]/15 z-20"
          style={{ paddingTop: '10px', paddingBottom: '8px' }}
        >
          <span
            className="text-[10.5px] font-bold font-spiritual-serif"
            style={{ color: 'var(--mushaf-muted)' }}
          >
            سورة {data.surahsPresent[0]?.arabicName || ''}
          </span>
          <span
            className="text-[10.5px] font-bold font-sans"
            style={{ color: 'var(--mushaf-muted)' }}
          >
            الجزء {data.juz}
          </span>
        </div>

        {/* ── MIDDLE: auto-fitting Quran text ── */}
        {/* This div is the PARENT measured by useLayoutEffect */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col justify-center px-3 py-1 z-20">
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
            {/* Surah header(s) if a new surah starts on this page */}
            {data.surahsPresent.map((sInfo) => {
              if (!sInfo.startsOnThisPage) return null;
              return (
                <div key={`sh-${sInfo.number}`} className="text-center mb-1">
                  <div
                    className="inline-block px-4 rounded-xl border"
                    style={{
                      paddingTop: '3px',
                      paddingBottom: '3px',
                      background: 'var(--mushaf-pill-bg)',
                      borderColor: 'var(--mushaf-border-soft)',
                    }}
                  >
                    <span
                      className="font-spiritual-serif font-bold text-[0.82em]"
                      style={{ color: 'var(--mushaf-text)' }}
                    >
                      سُورَةُ {sInfo.arabicName}
                    </span>
                    <span
                      className="text-[0.6em] block -mt-0.5"
                      style={{ color: 'var(--mushaf-muted)' }}
                    >
                      {sInfo.revelationType}
                    </span>
                  </div>
                  {/* Bismillah — shown for all surahs except Al-Fatihah (1) and At-Tawbah (9) */}
                  {sInfo.number !== 1 && sInfo.number !== 9 && (
                    <div className="mt-0.5">
                      <span
                        className="font-quran text-[0.88em]"
                        style={{ color: 'var(--mushaf-text)' }}
                      >
                        {BISMILLAH_UTHMANI}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* ── ALL Ayat on this page ── */}
            {data.ayahs.map((ayah) => {
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
                <span
                  key={ayah.globalAyahNumber}
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
                    className="inline-flex items-center justify-center align-middle mx-[2px] rounded-full border font-bold font-sans select-none"
                    style={{
                      fontSize: '0.62em',
                      lineHeight: '1.5',
                      minWidth: '1.5em',
                      padding: '0 3px',
                      color: 'var(--mushaf-accent)',
                      borderColor: 'var(--mushaf-border)',
                      background: 'var(--mushaf-badge-bg)',
                    }}
                  >
                    {ayah.ayahNumberInSurah}
                  </span>
                </span>
              );
            })}
          </div>
        </div>

        {/* ── BOTTOM: page number ── */}
        <div
          className="shrink-0 flex items-center justify-center border-t border-[#C6A15B]/15 z-20"
          style={{ paddingTop: '7px', paddingBottom: '10px' }}
        >
          <span
            className="font-sans font-bold text-[11px]"
            style={{ color: 'var(--mushaf-accent)' }}
          >
            {data.pageNumber}
          </span>
        </div>

        {/* ── Corner grab cue (bottom-left for LEFT→RIGHT swipe hint) ── */}
        {!isUnderlying && (
          <div className="absolute bottom-0 left-0 w-10 h-10 pointer-events-none z-30 opacity-50">
            <div className="w-0 h-0 border-b-[28px] border-b-[#C6A15B]/30 border-r-[28px] border-r-transparent rounded-bl-2xl" />
          </div>
        )}
      </div>
    );
  }
);

MushafPageContent.displayName = 'MushafPageContent';

// ─────────────────────────────────────────────────────────────────
// Main QuranPage component
// ─────────────────────────────────────────────────────────────────

export const QuranPage: React.FC = () => {
  const { setActiveTab } = useApp();

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

  // ── Modals ──
  const [isSurahIndexOpen, setIsSurahIndexOpen] = useState(false);
  const [isJuzIndexOpen, setIsJuzIndexOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<QuranSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // ── Drag / Gesture state ──
  // The Mushaf page div receives pointer events and translateX during drag.
  // LEFT → RIGHT (deltaX > 0) = NEXT PAGE
  // RIGHT → LEFT (deltaX < 0) = PREVIOUS PAGE
  const viewportRef = useRef<HTMLDivElement>(null);
  const mushafDivRef = useRef<HTMLDivElement>(null);

  // Gesture state — all in refs so they never cause re-renders during drag
  const isPointerDownRef = useRef(false);       // pointer is held
  const hasCommittedToDragRef = useRef(false);  // crossed the drag threshold → pointer captured
  const isDraggingRef = useRef(false);           // same as hasCommittedToDragRef, used to skip click
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentDeltaXRef = useRef(0);
  const capturedPointerIdRef = useRef<number>(-1);
  const isAnimatingRef = useRef(false);

  // Track drag visually by updating the mushaf div's transform directly
  // (no React re-render needed during drag — keeps it 60fps)
  const setMushafTransform = useCallback((tx: number, withTransition: boolean) => {
    const el = mushafDivRef.current;
    if (!el) return;
    el.style.transition = withTransition
      ? 'transform 0.32s cubic-bezier(0.25, 1, 0.5, 1)'
      : 'none';
    el.style.transform = `translateX(${tx}px)`;
  }, []);

  // Reveal the underlying page during drag
  const [showUnderlying, setShowUnderlying] = useState<'next' | 'prev' | null>(null);

  const allSurahs = useMemo(() => getAllSurahs(), []);

  // ─────────────────────────────────────────────────────────────
  // Data loading
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    setLoading(true);
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
        .then((d) => { if (mounted) setNextPageData(d); })
        .catch(() => {});
    else setNextPageData(null);

    if (currentPage > 1)
      getMushafPage(currentPage - 1)
        .then((d) => { if (mounted) setPrevPageData(d); })
        .catch(() => {});
    else setPrevPageData(null);

    return () => { mounted = false; };
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
    if (!activeAyah) { setTafsirData(null); return; }
    let mounted = true;
    setLoadingTafsir(true);
    getAyahTafsir(activeAyah.surahNumber, activeAyah.ayahNumberInSurah, selectedTafsirSource)
      .then((res) => { if (mounted) { setTafsirData(res); setLoadingTafsir(false); } })
      .catch(() => { if (mounted) setLoadingTafsir(false); });
    return () => { mounted = false; };
  }, [activeAyah, selectedTafsirSource]);

  // ─────────────────────────────────────────────────────────────
  // Page turn logic (safe)
  // ─────────────────────────────────────────────────────────────

  const doPageTurn = useCallback(
    (newPage: number, direction: 'next' | 'prev') => {
      if (newPage < 1 || newPage > 604 || isAnimatingRef.current) return;
      isAnimatingRef.current = true;

      const containerW = viewportRef.current?.offsetWidth ?? 360;
      const exitX = direction === 'next' ? containerW : -containerW;
      const enterX = direction === 'next' ? -containerW : containerW;

      // 1. Animate current page exit
      setMushafTransform(exitX, true);

      setTimeout(() => {
        // 2. Snap to enter position (no transition), switch page data
        setMushafTransform(enterX, false);
        setCurrentPage(newPage);
        setShowUnderlying(null);

        // 3. One frame later: animate in
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setMushafTransform(0, true);
            setTimeout(() => {
              isAnimatingRef.current = false;
            }, 350);
          });
        });
      }, 280);
    },
    [setMushafTransform]
  );

  const goToNextPage = useCallback(() => {
    if (currentPage < 604) doPageTurn(currentPage + 1, 'next');
  }, [currentPage, doPageTurn]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 1) doPageTurn(currentPage - 1, 'prev');
  }, [currentPage, doPageTurn]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (activeAyah || isSurahIndexOpen || isJuzIndexOpen || isSearchOpen) return;
      if (e.key === 'ArrowRight') goToNextPage();
      else if (e.key === 'ArrowLeft') goToPrevPage();
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
      if (isSurahIndexOpen || isJuzIndexOpen || isSearchOpen || isAnimatingRef.current) return;

      isPointerDownRef.current = true;
      hasCommittedToDragRef.current = false;
      isDraggingRef.current = false;
      startXRef.current = e.clientX;
      startYRef.current = e.clientY;
      currentDeltaXRef.current = 0;
      capturedPointerIdRef.current = e.pointerId;
      setShowUnderlying(null);
      // ⚠️  Do NOT call setPointerCapture here.
      // Doing so would prevent click events from reaching child ayah elements.
    },
    [isSurahIndexOpen, isJuzIndexOpen, isSearchOpen]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isPointerDownRef.current || isAnimatingRef.current) return;

      const deltaX = e.clientX - startXRef.current;
      const deltaY = e.clientY - startYRef.current;

      // If not yet committed to a drag, check if we should
      if (!hasCommittedToDragRef.current) {
        if (Math.abs(deltaX) > 12) {
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

      if (deltaX > 8 && currentPage < 604) {
        setShowUnderlying('next');
      } else if (deltaX < -8 && currentPage > 1) {
        setShowUnderlying('prev');
      } else {
        setShowUnderlying(null);
      }

      const containerW = viewportRef.current?.offsetWidth ?? 360;
      const maxDrag = containerW * 1.05;
      const capped = Math.max(-maxDrag, Math.min(maxDrag, deltaX));
      const resist =
        capped > 0
          ? Math.sqrt(capped / maxDrag) * maxDrag
          : -Math.sqrt(-capped / maxDrag) * maxDrag;

      setMushafTransform(resist * 0.82, false);
    },
    [currentPage, setMushafTransform]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isPointerDownRef.current) return;
      isPointerDownRef.current = false;

      if (!hasCommittedToDragRef.current) {
        // This was a tap — do nothing here; let the ayah's onClick fire naturally.
        isDraggingRef.current = false;
        hasCommittedToDragRef.current = false;
        return;
      }

      // This was a committed drag
      try { e.currentTarget.releasePointerCapture(capturedPointerIdRef.current); } catch {}
      hasCommittedToDragRef.current = false;
      isDraggingRef.current = false;

      const deltaX = currentDeltaXRef.current;
      const containerW = viewportRef.current?.offsetWidth ?? 360;
      const threshold = containerW * 0.22;

      setShowUnderlying(null);

      if (deltaX > threshold && currentPage < 604) {
        doPageTurn(currentPage + 1, 'next');
      } else if (deltaX < -threshold && currentPage > 1) {
        doPageTurn(currentPage - 1, 'prev');
      } else {
        setMushafTransform(0, true);
      }
    },
    [currentPage, doPageTurn, setMushafTransform]
  );

  const handlePointerCancel = useCallback(() => {
    isPointerDownRef.current = false;
    hasCommittedToDragRef.current = false;
    isDraggingRef.current = false;
    setShowUnderlying(null);
    setMushafTransform(0, true);
  }, [setMushafTransform]);

  // ─────────────────────────────────────────────────────────────
  // Audio
  // ─────────────────────────────────────────────────────────────
  const handleToggleAudio = (ayah: MushafPageAyah) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.onended = () => { setIsPlayingAudio(false); setPlayingAyahNumber(null); };
      audioRef.current.onerror = () => { setIsPlayingAudio(false); setPlayingAyahNumber(null); };
    }
    if (playingAyahNumber === ayah.globalAyahNumber && isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.src = getAyahAudioUrl(ayah.globalAyahNumber);
      audioRef.current.play()
        .then(() => { setPlayingAyahNumber(ayah.globalAyahNumber); setIsPlayingAudio(true); })
        .catch(() => setIsPlayingAudio(false));
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
      className="relative w-full h-[calc(100dvh-130px)] sm:h-[calc(100dvh-140px)] flex flex-col select-none overflow-hidden"
      dir="rtl"
    >
      {/* ══ 1. HEADER BAR ══ */}
      <header className="h-11 px-2 flex items-center justify-between border-b border-[#C6A15B]/20 bg-[#FAF7F2]/90 dark:bg-[#18231C]/90 backdrop-blur-md shrink-0 z-30 rounded-2xl mb-2">
        <div className="flex items-center gap-1.5">
          {/* Back to Dashboard */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-[#C6A15B]/20 text-xs font-bold text-[#26352A] dark:text-[#E8DDD0] transition-colors cursor-pointer"
            title="العودة إلى الرئيسية"
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
        <div className="text-center">
          {pageData?.surahsPresent?.[0] && (
            <span className="text-xs sm:text-sm font-bold font-spiritual-serif text-[#1D211E] dark:text-[#F6F1E7]">
              سورة {pageData.surahsPresent[0].arabicName}
            </span>
          )}
        </div>

        {/* Search + Bookmark */}
        <div className="flex items-center gap-1">
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
      <div className="flex-grow flex items-stretch justify-center gap-3 w-full overflow-hidden">
        {/* ── Mushaf viewport (pointer target) ── */}
        <main
          ref={viewportRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          className={`relative h-full overflow-hidden [perspective:1400px] transition-all duration-300 cursor-grab active:cursor-grabbing ${
            activeAyah ? 'w-full lg:w-[56%] max-w-xl' : 'w-full max-w-xl'
          }`}
          style={{ touchAction: 'none' }}
        >
          {/* Underlying page (revealed as current slides away) */}
          {showUnderlying === 'next' && nextPageData && (
            <div className="absolute inset-1 z-10 pointer-events-none">
              <MushafPageContent
                data={nextPageData}
                isUnderlying
                activeAyah={null}
                activeBookmark={activeBookmark}
                playingAyahNumber={null}
                isPlayingAudio={false}
                isDragging={false}
                onAyahClick={() => {}}
              />
            </div>
          )}
          {showUnderlying === 'prev' && prevPageData && (
            <div className="absolute inset-1 z-10 pointer-events-none">
              <MushafPageContent
                data={prevPageData}
                isUnderlying
                activeAyah={null}
                activeBookmark={activeBookmark}
                playingAyahNumber={null}
                isPlayingAudio={false}
                isDragging={false}
                onAyahClick={() => {}}
              />
            </div>
          )}

          {/* Current Mushaf page — translated by drag/animation */}
          {pageData && !loading && (
            <div
              ref={mushafDivRef}
              className="absolute inset-1 z-20"
              style={{ willChange: 'transform', transform: 'translateX(0)', transition: 'none' }}
            >
              <MushafPageContent
                data={pageData}
                isUnderlying={false}
                activeAyah={activeAyah}
                activeBookmark={activeBookmark}
                playingAyahNumber={playingAyahNumber}
                isPlayingAudio={isPlayingAudio}
                isDragging={isDraggingRef.current}
                onAyahClick={(ayah) => setActiveAyah(ayah)}
              />
            </div>
          )}

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
      <footer className="h-12 px-3 flex items-center justify-between border-t border-[#C6A15B]/20 bg-[#FAF7F2]/90 dark:bg-[#18231C]/90 backdrop-blur-md shrink-0 z-30 rounded-2xl mt-2">
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
                  onClick={() => setIsSearchOpen(false)}
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
                  className="w-full pr-10 pl-3 py-2 rounded-xl bg-white dark:bg-[#18231C] border border-[#C6A15B]/30 text-xs focus:outline-none focus:border-[#C6A15B]"
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
                      setIsSearchOpen(false);
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
