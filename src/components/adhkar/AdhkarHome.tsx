import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BookOpen, Check, Heart, Search, Star, X } from 'lucide-react';
import { AdhkarCategory, AdhkarItem } from '../../types';
import { ADHKAR_CATEGORY_LIST, getAdhkarItemById, searchAdhkar as searchAdhkarData } from '../../data/adhkar';
import { UseAdhkarResult } from '../../hooks/useAdhkar';
import { AnimatedProgressBar, TactileButton } from '../ui/MotionPrimitives';
import { StarEightPoint, SubtleArch } from '../landing/IslamicOrnaments';

interface AdhkarHomeProps {
  adhkar: UseAdhkarResult;
  onOpenCategory: (category: AdhkarCategory, opts?: { initialItemId?: string }) => void;
  onOpenSource: (item: AdhkarItem) => void;
}

const CATEGORY_META = ADHKAR_CATEGORY_LIST;

export const AdhkarHome: React.FC<AdhkarHomeProps> = ({
  adhkar,
  onOpenCategory,
  onOpenSource,
}) => {
  const [query, setQuery] = useState('');

  const favoriteItems = useMemo(
    () =>
      adhkar.favorites
        .map((id) => getAdhkarItemById(id))
        .filter((item): item is AdhkarItem => Boolean(item)),
    [adhkar.favorites]
  );

  const searchResults = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return searchAdhkarData(q);
  }, [query]);

  const completedWirds = CATEGORY_META.filter(
    (c) => adhkar.getCategoryProgress(c.category).completed === adhkar.getCategoryProgress(c.category).total
  ).length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* ═══════ HERO ═══════ */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#26352A] to-[#18231C] text-[#F6F1E7] border border-[#C6A15B]/30 shadow-lg">
        <div className="absolute -top-6 -left-6 opacity-20 pointer-events-none">
          <SubtleArch className="w-24 h-32 text-[#C6A15B]" color="#C6A15B" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="flex items-center gap-2 mb-2">
            <StarEightPoint size={16} color="#C6A15B" />
            <span className="text-xs font-bold text-[#C6A15B] uppercase tracking-wider">
              الأذكار اليومية
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-landing-display mb-2">
            اذكر الله تَطمئنّ قلوبك
          </h2>
          <p className="text-sm font-spiritual-serif text-[#A9B7A3] max-w-md">
            «أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ» — ثلاث أوراد يومية سريعة تبدأ بها يومك وتختمه.
          </p>

          <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#C6A15B]/15 border border-[#C6A15B]/30">
            <Star className="w-4 h-4 text-[#C6A15B] fill-current" />
            <span className="text-xs font-bold text-[#C6A15B]">
              أوراد اليوم المكتملة: {completedWirds} من {CATEGORY_META.length}
            </span>
          </div>
        </motion.div>
      </div>

      {/* ═══════ SEARCH ═══════ */}
      <div>
        <div className="relative">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7E8C7F]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث في الأذكار عن نص أو مصدر…"
            className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white dark:bg-[#1F2E24] border border-[#C6A15B]/20 text-sm text-[#1D211E] dark:text-[#F6F1E7] placeholder:text-[#7E8C7F]/70 focus:outline-none focus:border-[#C6A15B]/60 transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[#7E8C7F] hover:text-[#1D211E] dark:hover:text-[#F6F1E7] cursor-pointer"
              aria-label="مسح البحث"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-3 rounded-2xl bg-white dark:bg-[#1F2E24] border border-[#C6A15B]/20 overflow-hidden"
            >
              <div className="px-4 py-2.5 text-[10px] font-bold text-[#7E8C7F] border-b border-black/5 dark:border-white/5">
                نتائج البحث ({searchResults.length})
              </div>
              {searchResults.slice(0, 8).map((item) => {
                const catMeta = CATEGORY_META.find((c) => c.category === item.category)!;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onOpenCategory(item.category, { initialItemId: item.id })}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-[#F6F1E7] dark:hover:bg-[#26352A] transition-colors text-right cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#C6A15B]/12 text-[#C6A15B] flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-[#1D211E] dark:text-[#F6F1E7] truncate">
                          {item.title}
                        </span>
                        <span className="block text-[10px] text-[#7E8C7F] mt-0.5">
                          {catMeta.icon} {catMeta.title} • {item.source}
                        </span>
                      </div>
                    </div>
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={`مصدر ${item.title}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenSource(item);
                      }}
                      className="p-1.5 rounded-lg text-[#7E8C7F] hover:text-[#C6A15B] shrink-0 cursor-pointer"
                    >
                      <InfoIcon />
                    </span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══════ CATEGORY CARDS ═══════ */}
      <div className="space-y-3">
        {CATEGORY_META.map((cat, i) => {
          const progress = adhkar.getCategoryProgress(cat.category);
          const isComplete = progress.completed === progress.total && progress.total > 0;
          return (
            <TactileButton
              key={cat.category}
              onClick={() => onOpenCategory(cat.category)}
              className="w-full text-right rounded-3xl p-5 bg-white dark:bg-[#1F2E24] border border-[#C6A15B]/20 shadow-sm hover:border-[#C6A15B]/50 transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={{ rotate: -8 }}
                    whileHover={{ rotate: 6 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#26352A] to-[#18231C] border border-[#C6A15B]/30 flex items-center justify-center text-xl shrink-0"
                  >
                    {cat.icon}
                  </motion.div>
                  <div>
                    <h3 className="text-sm font-bold font-landing-display text-[#1D211E] dark:text-[#F6F1E7]">
                      {cat.title}
                    </h3>
                    <span className="text-[10px] text-[#7E8C7F] dark:text-[#A9B7A3]">
                      {cat.description} • {progress.total} أذكار
                    </span>
                  </div>
                </div>

                <span
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-2xl text-[10px] font-bold ${
                    isComplete
                      ? 'bg-[#3C6E47]/10 text-[#3C6E47] border border-[#3C6E47]/25'
                      : progress.completed > 0
                        ? 'bg-[#C6A15B]/10 text-[#C6A15B] border border-[#C6A15B]/25'
                        : 'bg-[#26352A]/5 dark:bg-[#C6A15B]/10 text-[#26352A] dark:text-[#C6A15B] border border-[#C6A15B]/20'
                  }`}
                >
                  {isComplete ? <Check className="w-3 h-3" /> : null}
                  {isComplete ? 'مكتمل' : progress.completed > 0 ? 'متابعة' : 'ابدأ'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <AnimatedProgressBar
                  percentage={progress.percentage}
                  height="h-1.5"
                  className="flex-1"
                  barColor={
                    isComplete
                      ? 'bg-gradient-to-l from-[#3C6E47] to-[#6BA06B]'
                      : undefined
                  }
                />
                <span className="text-[11px] font-bold text-[#C6A15B] whitespace-nowrap">
                  {progress.completed}/{progress.total}
                </span>
              </div>
            </TactileButton>
          );
        })}
      </div>

      {/* ═══════ FAVORITES ═══════ */}
      {favoriteItems.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-3 px-1">
            <Heart className="w-3.5 h-3.5 text-[#C6A15B] fill-current" />
            <h3 className="text-xs font-bold font-landing-display text-[#1D211E] dark:text-[#F6F1E7]">
              أذكارك المفضلة
            </h3>
            <span className="text-[10px] text-[#7E8C7F]">({favoriteItems.length})</span>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-2 qada-scroll-thin">
            {favoriteItems.map((item) => {
              const catMeta = CATEGORY_META.find((c) => c.category === item.category)!;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onOpenCategory(item.category, { initialItemId: item.id })}
                  className="shrink-0 w-44 p-3.5 rounded-2xl bg-white dark:bg-[#1F2E24] border border-[#C6A15B]/20 hover:border-[#C6A15B]/50 text-right transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[#C6A15B]">{catMeta.icon}</span>
                    <span className="text-[10px] text-[#7E8C7F]">{catMeta.title}</span>
                  </div>
                  <span className="block text-[11px] font-bold text-[#1D211E] dark:text-[#F6F1E7] leading-snug line-clamp-2">
                    {item.title}
                  </span>
                  <span className="block text-[9px] text-[#7E8C7F] mt-1 truncate">
                    {item.repetitions} {item.repetitions === 1 ? 'مرة' : 'مرات'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const InfoIcon: React.FC<{ color?: string }> = ({ color = 'currentColor' }) => {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
};