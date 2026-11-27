import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Check, Heart, Star, Sunrise, Sunset, Moon } from 'lucide-react';
import { AdhkarCategory, AdhkarItem } from '../../types';
import { ADHKAR_CATEGORY_LIST, getAdhkarItemById } from '../../data/adhkar';
import { UseAdhkarResult } from '../../hooks/useAdhkar';
import { TactileButton } from '../ui/MotionPrimitives';
import { StarEightPoint, SubtleArch } from '../landing/IslamicOrnaments';

interface AdhkarHomeProps {
  adhkar: UseAdhkarResult;
  onOpenCategory: (category: AdhkarCategory, opts?: { initialItemId?: string }) => void;
  onOpenSource: (item: AdhkarItem) => void;
  onOpenDua?: () => void;
}

const CATEGORY_META = ADHKAR_CATEGORY_LIST;
const CATEGORY_ICONS = { morning: Sunrise, evening: Sunset, sleep: Moon };

export const AdhkarHome: React.FC<AdhkarHomeProps> = ({
  adhkar,
  onOpenCategory,
}) => {
  const favoriteItems = useMemo(
    () =>
      adhkar.favorites
        .map((id) => getAdhkarItemById(id))
        .filter((item): item is AdhkarItem => Boolean(item)),
    [adhkar.favorites]
  );

  const completedWirds = CATEGORY_META.filter(
    (c) => adhkar.getCategoryProgress(c.category).completed === adhkar.getCategoryProgress(c.category).total
  ).length;

  return (
    <div className="qada-adhkar-home space-y-6" dir="rtl">
      {/* ═══════ HERO ═══════ */}
      <div className="qada-adhkar-intro relative overflow-hidden rounded-3xl p-6 sm:p-8">
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

      {/* ═══════ CATEGORY CARDS ═══════ */}
      <div className="qada-adhkar-library qada-adhkar-category-grid">
        {CATEGORY_META.map((cat) => {
          const progress = adhkar.getCategoryProgress(cat.category);
          const isComplete = progress.completed === progress.total && progress.total > 0;
          const CategoryIcon = CATEGORY_ICONS[cat.category];
          return (
            <TactileButton
              key={cat.category}
              onClick={() => onOpenCategory(cat.category)}
              ariaLabel={`ورد ${cat.title}`}
              className="qada-surface-card qada-adhkar-category-tile w-full bg-white dark:bg-[#1F2E24] border border-[#C6A15B]/20 shadow-sm hover:border-[#C6A15B]/50 transition-all group cursor-pointer"
            >
              <motion.div
                initial={{ rotate: -8 }}
                whileHover={{ rotate: 6, scale: 1.04 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="qada-adhkar-category-icon"
              >
                <CategoryIcon size={25} />
              </motion.div>
              <h3 className="text-sm font-bold font-landing-display text-[#1D211E] dark:text-[#F6F1E7]">{cat.title}</h3>
              <span className="qada-adhkar-category-description">{cat.description}</span>
              <span className={`qada-adhkar-category-count${isComplete ? ' is-complete' : ''}`}>
                {isComplete ? <Check className="w-3 h-3" /> : null}
                {progress.completed} / {progress.total}
              </span>
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

