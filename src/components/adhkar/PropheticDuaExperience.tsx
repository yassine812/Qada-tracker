import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RefreshCw,
  Copy,
  Check,
  Heart,
  BookOpen,
  Search,
  Share2,
  Calendar,
  X,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { usePropheticDuas } from '../../hooks/usePropheticDuas';
import { useApp } from '../../context/AppContext';
import { playSoftClickSound, triggerHaptic } from '../../utils/streak';
import { TactileButton } from '../ui/MotionPrimitives';
import { StarEightPoint, SubtleArch, OrnamentalDivider } from '../landing/IslamicOrnaments';
import { PROPHETIC_DUAS_BOOK_META, PropheticDua } from '../../data/propheticDuas';
import { formatArabicNumber } from '../../utils/calculator';

export const PropheticDuaExperience: React.FC = () => {
  const { settings, showToast } = useApp();
  const {
    currentDua,
    dailyDua,
    shownCount,
    totalCount,
    cycleNumber,
    isFavorite,
    favorites,
    searchQuery,
    searchResults,
    setSearchQuery,
    nextDua,
    selectDuaById,
    toggleFavorite,
  } = usePropheticDuas();

  const [isCopied, setIsCopied] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [showBookInfoModal, setShowBookInfoModal] = useState(false);
  const [currentRepetition, setCurrentRepetition] = useState(0);

  const targetRepetition = currentDua.repetition || 1;

  // Handle next Dua with audio/haptic feedback
  const handleNext = useCallback(() => {
    if (settings?.soundEnabled) playSoftClickSound();
    if (settings?.hapticsEnabled) triggerHaptic();
    setCurrentRepetition(0);
    nextDua();
  }, [nextDua, settings]);

  // Handle favorite toggle with feedback
  const handleToggleFavorite = useCallback(() => {
    if (settings?.soundEnabled) playSoftClickSound();
    if (settings?.hapticsEnabled) triggerHaptic();
    toggleFavorite();
    showToast(
      isFavorite ? 'تمت الإزالة من الأدعية المفضلة' : 'تمت الإضافة إلى الأدعية المفضلة ❤️',
      'info'
    );
  }, [isFavorite, settings, showToast, toggleFavorite]);

  // Handle copy with full attribution
  const handleCopy = useCallback(async () => {
    const textToCopy = `« ${currentDua.arabic} »\n\nالمصدر: ${currentDua.source} (${currentDua.hadithNumber})\nعن ${currentDua.narrator}\n[من كتاب ${PROPHETIC_DUAS_BOOK_META.sourceBook} للشيخ ${PROPHETIC_DUAS_BOOK_META.compiler}]`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      showToast('تم نسخ الدعاء ومصدره إلى الحافظة', 'success');
      setTimeout(() => setIsCopied(false), 2200);
    } catch {
      showToast('تعذر نسخ الدعاء', 'error');
    }
  }, [currentDua, showToast]);

  // Handle share (Web Share API)
  const handleShare = useCallback(async () => {
    const textToShare = `« ${currentDua.arabic} »\n\nالمصدر: ${currentDua.source} (${currentDua.hadithNumber})\nعن ${currentDua.narrator}\n[من أدعية النبي ﷺ — تطبيق قضاء]`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `دعاء نبوي: ${currentDua.title}`,
          text: textToShare,
        });
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  }, [currentDua, handleCopy]);

  // Jump to today's Prophetic Dua
  const handleJumpToDaily = useCallback(() => {
    if (settings?.soundEnabled) playSoftClickSound();
    if (settings?.hapticsEnabled) triggerHaptic();
    selectDuaById(dailyDua.id);
    setCurrentRepetition(0);
    showToast(`دعاء اليوم: ${dailyDua.title}`, 'info');
  }, [dailyDua, selectDuaById, settings, showToast]);

  const isCurrentDailyDua = currentDua.id === dailyDua.id;

  return (
    <div className="space-y-5" dir="rtl">
      {/* ════════ TOP BAR & HEADER ════════ */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-[#C6A15B] animate-pulse" />
            <span className="text-[11px] font-bold text-[#C6A15B] uppercase tracking-wider">
              المجموعة النبوية المحققة
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-landing-display text-[#1D211E] dark:text-[#F6F1E7]">
            أدعية النبي ﷺ
          </h2>
        </div>

        {/* Quick Actions: Search, Favorites, Info, Daily */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowSearchModal(true)}
            aria-label="بحث في الأدعية"
            title="بحث في الأدعية النبوية"
            className="p-2.5 rounded-xl bg-white/80 dark:bg-[#1F2E24] border border-[#C6A15B]/20 text-[#7E8C7F] hover:text-[#C6A15B] dark:text-[#A9B7A3] dark:hover:text-[#C6A15B] transition-colors cursor-pointer shadow-xs"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowFavoritesModal(true)}
            aria-label="الأدعية المفضلة"
            title="الأدعية المفضلة"
            className="relative p-2.5 rounded-xl bg-white/80 dark:bg-[#1F2E24] border border-[#C6A15B]/20 text-[#7E8C7F] hover:text-[#C6A15B] dark:text-[#A9B7A3] dark:hover:text-[#C6A15B] transition-colors cursor-pointer shadow-xs"
          >
            <Heart className={`w-4 h-4 ${favorites.length > 0 ? 'text-[#C6A15B] fill-current' : ''}`} />
            {favorites.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#C6A15B] text-[#18231C] text-[9px] font-bold flex items-center justify-center">
                {favorites.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handleJumpToDaily}
            aria-label="دعاء اليوم"
            title="دعاء اليوم النبوي"
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer shadow-xs ${
              isCurrentDailyDua
                ? 'bg-[#C6A15B]/20 border-[#C6A15B] text-[#C6A15B]'
                : 'bg-white/80 dark:bg-[#1F2E24] border-[#C6A15B]/20 text-[#7E8C7F] hover:text-[#C6A15B] dark:text-[#A9B7A3]'
            }`}
          >
            <Calendar className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowBookInfoModal(true)}
            aria-label="معلومات الكتاب"
            title="توثيق مصدر الكتاب"
            className="p-2.5 rounded-xl bg-white/80 dark:bg-[#1F2E24] border border-[#C6A15B]/20 text-[#7E8C7F] hover:text-[#C6A15B] dark:text-[#A9B7A3] dark:hover:text-[#C6A15B] transition-colors cursor-pointer shadow-xs"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ════════ CYCLE PROGRESS BADGE ════════ */}
      <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-white/70 dark:bg-[#1F2E24]/70 border border-[#C6A15B]/15 text-[11px] backdrop-blur-xs">
        <div className="flex items-center gap-1.5 text-[#7E8C7F] dark:text-[#A9B7A3]">
          <Sparkles className="w-3.5 h-3.5 text-[#C6A15B]" />
          <span>
            الدعاء <strong className="text-[#1D211E] dark:text-[#F6F1E7]">{formatArabicNumber(currentDua.number)}</strong> من <strong className="text-[#C6A15B]">{formatArabicNumber(totalCount)}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#7E8C7F] dark:text-[#A9B7A3]">
            الدورة العشوائية: {formatArabicNumber(cycleNumber)}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-[#C6A15B]/15 text-[#C6A15B] font-bold text-[10px]">
            {formatArabicNumber(shownCount)} / {formatArabicNumber(totalCount)}
          </span>
        </div>
      </div>

      {/* ════════ MAIN EDITORIAL DUA CARD ════════ */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-white/95 to-[#F9F7F1]/90 dark:from-[#1F2E24] dark:to-[#18241C] border border-[#C6A15B]/30 shadow-lg text-center">
        {/* Subtle Decorative Arch in background */}
        <div className="absolute -top-8 -left-8 opacity-10 dark:opacity-5 pointer-events-none">
          <SubtleArch className="w-36 h-48 text-[#C6A15B]" color="#C6A15B" />
        </div>
        <div className="absolute -bottom-8 -right-8 opacity-10 dark:opacity-5 pointer-events-none rotate-180">
          <SubtleArch className="w-36 h-48 text-[#C6A15B]" color="#C6A15B" />
        </div>

        {/* Top Badges: Category & Verified Source */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-5 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#26352A]/5 dark:bg-[#C6A15B]/15 text-[#26352A] dark:text-[#C6A15B] border border-[#C6A15B]/25">
            <StarEightPoint size={12} color="#C6A15B" />
            <span>دعاء نبوي • مصدر موثوق</span>
          </span>

          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-black/5 dark:bg-white/5 text-[#7E8C7F] dark:text-[#A9B7A3]">
            {currentDua.category}
          </span>

          {isCurrentDailyDua && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#3C6E47]/15 text-[#3C6E47] border border-[#3C6E47]/30">
              <Calendar className="w-3 h-3" />
              <span>دعاء اليوم</span>
            </span>
          )}
        </div>

        {/* Animated Dua Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentDua.id}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10"
          >
            {/* Dua Number & Title */}
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#C6A15B]/15 border border-[#C6A15B]/30 text-xs font-bold text-[#C6A15B] mb-2 font-landing-display">
                {formatArabicNumber(currentDua.number)}
              </div>
              <h3 className="text-sm font-bold text-[#7E8C7F] dark:text-[#A9B7A3]">
                {currentDua.title}
              </h3>
            </div>

            {/* Arabic Prophetic Dua Text */}
            <div className="my-6 px-2 sm:px-6">
              <p className="font-spiritual-serif text-2xl sm:text-3xl font-bold text-[#1D211E] dark:text-[#F6F1E7] leading-[2.1] tracking-wide select-text text-center">
                « {currentDua.arabic} »
              </p>
            </div>

            <OrnamentalDivider accentColor="#C6A15B" className="my-6 max-w-xs mx-auto opacity-70" />

            {/* Footnote / Hadith Attribution Section */}
            <div className="space-y-2 p-4 rounded-2xl bg-white/60 dark:bg-black/20 border border-[#C6A15B]/20 text-right text-xs">
              <div className="flex items-center justify-between gap-2 border-b border-black/5 dark:border-white/5 pb-2">
                <div className="flex items-center gap-1.5 text-[#C6A15B] font-bold">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>المصدر: {currentDua.source}</span>
                </div>
                {currentDua.authenticity && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#3C6E47]/10 text-[#3C6E47] dark:text-[#6BA06B] font-bold">
                    {currentDua.authenticity}
                  </span>
                )}
              </div>

              <div className="text-[11px] text-[#7E8C7F] dark:text-[#A9B7A3] pt-1 leading-relaxed">
                <div>الراوي: <strong className="text-[#1D211E] dark:text-[#F6F1E7]">{currentDua.narrator}</strong></div>
                <div>رقم الحديث: <span dir="ltr" className="inline-block">{currentDua.hadithNumber}</span></div>
                {currentDua.footnote && (
                  <div className="mt-1 text-[10px] text-[#7E8C7F]/90 dark:text-[#A9B7A3]/90 italic">
                    {currentDua.footnote}
                  </div>
                )}
              </div>
            </div>

            {/* Repetition counter if specified */}
            {targetRepetition > 1 && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (settings?.soundEnabled) playSoftClickSound();
                    if (settings?.hapticsEnabled) triggerHaptic();
                    const next = currentRepetition + 1;
                    setCurrentRepetition(next);
                    if (next === targetRepetition) {
                      showToast('تقبل الله منك ورد هذا الدعاء المبارك 🌿', 'success');
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                    currentRepetition >= targetRepetition
                      ? 'bg-[#3C6E47]/20 border-[#3C6E47] text-[#3C6E47]'
                      : 'bg-[#C6A15B]/15 border-[#C6A15B]/40 text-[#C6A15B] hover:bg-[#C6A15B]/25'
                  }`}
                >
                  {currentRepetition >= targetRepetition ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>اكتمل التكرار ({formatArabicNumber(targetRepetition)}/{formatArabicNumber(targetRepetition)})</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>تكرار الدعاء ({formatArabicNumber(currentRepetition)}/{formatArabicNumber(targetRepetition)})</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ════════ ACTION TOOLBAR ════════ */}
        <div className="flex items-center justify-center gap-2.5 pt-6 mt-2 border-t border-black/5 dark:border-white/5 relative z-10">
          {/* Favorite Toggle Button */}
          <TactileButton
            onClick={handleToggleFavorite}
            aria-label={isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
            className={`p-3 rounded-2xl border transition-colors flex items-center justify-center ${
              isFavorite
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-500'
                : 'bg-black/5 dark:bg-white/5 border-transparent text-[#7E8C7F] dark:text-[#A9B7A3] hover:text-rose-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </TactileButton>

          {/* Copy Button */}
          <TactileButton
            onClick={handleCopy}
            className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-xs font-bold text-[#1D211E] dark:text-[#F6F1E7] flex items-center justify-center gap-1.5 transition-colors"
            title="نسخ الدعاء ومصدره"
          >
            {isCopied ? <Check className="w-4 h-4 text-[#3C6E47]" /> : <Copy className="w-4 h-4" />}
          </TactileButton>

          {/* Share Button */}
          <TactileButton
            onClick={handleShare}
            className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-xs font-bold text-[#1D211E] dark:text-[#F6F1E7] flex items-center justify-center gap-1.5 transition-colors"
            title="مشاركة الدعاء"
          >
            <Share2 className="w-4 h-4" />
          </TactileButton>

          {/* "دعاء آخر" Primary Button */}
          <TactileButton
            onClick={handleNext}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#26352A] to-[#18231C] dark:from-[#C6A15B] dark:to-[#B5914A] text-[#F6F1E7] dark:text-[#18231C] text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>دعاء آخر</span>
          </TactileButton>
        </div>
      </div>

      {/* ════════ SEARCH MODAL / SHEET ════════ */}
      <AnimatePresence>
        {showSearchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-3xl bg-white dark:bg-[#1F2E24] border border-[#C6A15B]/30 shadow-2xl overflow-hidden"
              dir="rtl"
            >
              {/* Header */}
              <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-[#C6A15B]" />
                  <h3 className="font-bold text-sm text-[#1D211E] dark:text-[#F6F1E7]">
                    البحث في الأدعية النبوية ({formatArabicNumber(totalCount)} دعاء)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSearchModal(false)}
                  className="p-1 rounded-lg text-[#7E8C7F] hover:text-[#1D211E] dark:hover:text-[#F6F1E7]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Input */}
              <div className="p-4 border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
                <div className="relative">
                  <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7E8C7F]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث بالنص، الراوي، البخاري، مسلم، الاستغفار..."
                    autoFocus
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-[#18231C] border border-[#C6A15B]/20 text-xs text-[#1D211E] dark:text-[#F6F1E7] placeholder:text-[#7E8C7F]/70 focus:outline-none focus:border-[#C6A15B]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#7E8C7F]"
                    >
                      مسح
                    </button>
                  )}
                </div>
              </div>

              {/* Results List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 qada-scroll-thin">
                {searchResults.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#7E8C7F]">
                    لم يتم العثور على نتائج مطابقة لـ «{searchQuery}»
                  </div>
                ) : (
                  searchResults.map((dua) => (
                    <button
                      key={dua.id}
                      type="button"
                      onClick={() => {
                        selectDuaById(dua.id);
                        setShowSearchModal(false);
                      }}
                      className={`w-full text-right p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        dua.id === currentDua.id
                          ? 'bg-[#C6A15B]/15 border-[#C6A15B]'
                          : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/5 hover:border-[#C6A15B]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-[#C6A15B]">
                          دعاء #{formatArabicNumber(dua.number)} • {dua.title}
                        </span>
                        <span className="text-[9px] text-[#7E8C7F]">{dua.source}</span>
                      </div>
                      <p className="font-spiritual-serif text-xs leading-relaxed text-[#1D211E] dark:text-[#F6F1E7] line-clamp-2">
                        {dua.arabic}
                      </p>
                      <div className="mt-2 text-[9px] text-[#7E8C7F] flex items-center gap-2">
                        <span>عن {dua.narrator}</span>
                        <span>•</span>
                        <span>{dua.category}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ════════ FAVORITES MODAL / SHEET ════════ */}
      <AnimatePresence>
        {showFavoritesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-3xl bg-white dark:bg-[#1F2E24] border border-[#C6A15B]/30 shadow-2xl overflow-hidden"
              dir="rtl"
            >
              {/* Header */}
              <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500 fill-current" />
                  <h3 className="font-bold text-sm text-[#1D211E] dark:text-[#F6F1E7]">
                    الأدعية النبوية المفضلة ({favorites.length})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFavoritesModal(false)}
                  className="p-1 rounded-lg text-[#7E8C7F] hover:text-[#1D211E] dark:hover:text-[#F6F1E7]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Favorites List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 qada-scroll-thin">
                {favorites.length === 0 ? (
                  <div className="py-16 text-center space-y-2">
                    <Heart className="w-10 h-10 text-[#7E8C7F]/40 mx-auto" />
                    <p className="text-xs text-[#7E8C7F]">
                      لم تقم بحفظ أي أدعية نبوية في المفضلة بعد.
                    </p>
                    <p className="text-[11px] text-[#7E8C7F]/70">
                      اضغط على زر القلب لحفظ أي دعاء والرجوع إليه بسرعة.
                    </p>
                  </div>
                ) : (
                  favorites.map((dua) => (
                    <div
                      key={dua.id}
                      className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 flex items-start justify-between gap-3"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          selectDuaById(dua.id);
                          setShowFavoritesModal(false);
                        }}
                        className="flex-1 text-right cursor-pointer"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-[#C6A15B]">
                            دعاء #{formatArabicNumber(dua.number)} • {dua.title}
                          </span>
                        </div>
                        <p className="font-spiritual-serif text-xs leading-relaxed text-[#1D211E] dark:text-[#F6F1E7] line-clamp-2">
                          {dua.arabic}
                        </p>
                        <span className="text-[9px] text-[#7E8C7F] mt-1 block">
                          المصدر: {dua.source}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleFavorite(dua.id)}
                        title="إزالة من المفضلة"
                        className="p-2 text-rose-500 hover:text-rose-600 transition-colors"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ════════ BOOK SOURCE INFO MODAL ════════ */}
      <AnimatePresence>
        {showBookInfoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-[#1F2E24] border border-[#C6A15B]/30 shadow-2xl text-right space-y-4"
              dir="rtl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#C6A15B]" />
                  <h3 className="font-bold text-base text-[#1D211E] dark:text-[#F6F1E7]">
                    توثيق مصدر الأدعية
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBookInfoModal(false)}
                  className="p-1 text-[#7E8C7F] hover:text-[#1D211E] dark:hover:text-[#F6F1E7]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-[#7E8C7F] dark:text-[#A9B7A3] leading-relaxed">
                <p>
                  مأخوذة بكاملها وبنصها المحقق من كتاب:
                  <br />
                  <strong className="text-sm text-[#1D211E] dark:text-[#F6F1E7]">
                    «{PROPHETIC_DUAS_BOOK_META.sourceBook}»
                  </strong>
                </p>
                <p>
                  تأليف فضيلة الشيخ المحدّث العلامة:
                  <br />
                  <strong className="text-sm text-[#C6A15B]">
                    {PROPHETIC_DUAS_BOOK_META.compiler}
                  </strong>
                  <br />
                  <span className="text-[10px]">
                    المدرِّس بالمسجد النبوي الشريف ورئيس الجامعة الإسلامية بالمدينة المنورة سابقاً.
                  </span>
                </p>
                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-[11px]">
                  ✓ تضم المجموعة <strong>29 دعاءً نبوياً صحيحاً ثابتاً</strong> من الصحيحين وكتب السنة المشرفة، محققة وموثقة بالرواة وأرقام الأحاديث الأصلية.
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowBookInfoModal(false)}
                className="w-full py-2.5 rounded-xl bg-[#26352A] dark:bg-[#C6A15B] text-[#F6F1E7] dark:text-[#18231C] text-xs font-bold"
              >
                إغلاق
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
