import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Check, ChevronDown, ChevronUp, Info, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AdhkarCategory, AdhkarItem } from '../../types';
import { ADHKAR_CATEGORY_LIST, getAdhkarItems } from '../../data/adhkar';
import { UseAdhkarResult } from '../../hooks/useAdhkar';
import { useApp } from '../../context/AppContext';
import { playSoftClickSound, triggerHaptic } from '../../utils/streak';
import { CircularProgressRing, TactileButton } from '../ui/MotionPrimitives';
import { StarEightPoint, OrnamentalDivider } from '../landing/IslamicOrnaments';

interface AdhkarReaderProps {
  category: AdhkarCategory;
  adhkar: UseAdhkarResult;
  onBack: () => void;
  onOpenSource: (item: AdhkarItem) => void;
  initialItemId?: string;
}

const CATEGORY_META = ADHKAR_CATEGORY_LIST;

export const AdhkarReader: React.FC<AdhkarReaderProps> = ({
  category,
  adhkar,
  onBack,
  onOpenSource,
  initialItemId,
}) => {
  const { settings, showToast } = useApp();
  const items = useMemo(() => getAdhkarItems(category), [category]);
  const meta = CATEGORY_META.find((c) => c.category === category)!;

  const [index, setIndex] = useState(0);
  const [flash, setFlash] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [pulse, setPulse] = useState(0);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const item = items[Math.min(index, items.length - 1)];
  const itemProgress = adhkar.getItemProgress(category, item.id);
  const catProgress = adhkar.getCategoryProgress(category);
  const isLast = index >= items.length - 1;
  const isNight =
    category === 'sleep' || new Date().getHours() >= 20 || new Date().getHours() < 4;

  const isLongText = item.arabicText.length > 240;

  // Reset when the category changes
  useEffect(() => {
    setFlash(false);
    setCelebrating(false);
    if (initialItemId) {
      const target = items.findIndex((it) => it.id === initialItemId);
      setIndex(target >= 0 ? target : 0);
    } else {
      setIndex(0);
    }
  }, [category, initialItemId, items]);

  useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
  }, []);

  const advance = useCallback(() => {
    setFlash(false);
    setIndex((prev) => Math.min(prev + 1, items.length - 1));
  }, [items.length]);

  const goNext = useCallback(() => {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    if (isLast) return;
    setFlash(false);
    setIndex((prev) => prev + 1);
  }, [isLast]);

  const goPrev = useCallback(() => {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    setIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleTap = useCallback(
    (e: React.MouseEvent) => {
      if (celebrating) return;
      if (itemProgress.completed) return;
      if (settings?.soundEnabled) playSoftClickSound();
      if (settings?.hapticsEnabled) triggerHaptic();

      // Gentle radiating particle burst at tap point
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const result = adhkar.recordTap(category, item.id);
      if (!result) return;

      if (result.completed) {
        setFlash(true);
        if (settings?.soundEnabled) playSoftClickSound();
        if (isLast) {
          // All dhikr completed → celebration
          setCelebrating(true);
          try {
            confetti({
              particleCount: 60,
              spread: 75,
              origin: { y: 0.6 },
              colors: ['#C6A15B', '#A9B7A3', '#3C6E47', '#F6F1E7'],
            });
          } catch {}
          showToast('ما شاء الله، أتممت الأذكار اليوم 🌿', 'success');
        } else {
          // Auto-advance to the next dhikr
          autoAdvanceTimer.current = setTimeout(advance, 1600);
        }
        setPulse((p) => p + 1);
      }
    },
    [advance, adhkar, category, celebrating, isLast, item.id, itemProgress.completed, settings, showToast]
  );

  // ── Completion screen ──────────────────────────────────────────
  if (celebrating) {
    return (
      <div
        className={`relative overflow-hidden rounded-3xl p-8 text-center border ${
          isNight
            ? 'bg-gradient-to-br from-[#18202E] to-[#0E1520] border-[#C6A15B]/25 text-[#F6F1E7]'
            : 'bg-white/90 dark:bg-[#1F2E24] border-[#C6A15B]/25'
        }`}
      >
        {isNight && <StarField />}

        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="relative"
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-[#C6A15B]/15 border-2 border-[#C6A15B] flex items-center justify-center mb-5">
            <motion.span
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            >
              <Sparkles className="w-8 h-8 text-[#C6A15B]" />
            </motion.span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold font-landing-display mb-2">
            ما شاء الله، أتممت {meta.title}
          </h3>
          <p className="text-sm font-spiritual-serif text-[#7E8C7F] dark:text-[#A9B7A3] mb-6">
            «الَّذِينَ يَذْكُرُونَ اللَّهَ قِيَامًا وَقُعُودًا وَعَلَىٰ جُنُوبِهِمْ»
          </p>

          <div className="inline-flex items-center gap-3 rounded-2xl bg-[#C6A15B]/10 border border-[#C6A15B]/25 px-5 py-3 mb-6">
            <StarEightPoint size={16} color="#C6A15B" />
            <span className="text-sm font-bold text-[#C6A15B]">
              أكملت {catProgress.completed} من {catProgress.total} أذكار
            </span>
          </div>

          <div className="flex flex-col gap-2.5 max-w-[260px] mx-auto">
            <TactileButton
              onClick={() => {
                if (settings?.soundEnabled) playSoftClickSound();
                onBack();
              }}
              className="w-full py-3 rounded-xl bg-[#26352A] dark:bg-[#C6A15B] text-[#F6F1E7] dark:text-[#18231C] text-xs font-bold shadow-sm"
            >
              العودة للأذكار
            </TactileButton>
            <TactileButton
              onClick={() => {
                if (settings?.soundEnabled) playSoftClickSound();
                setCelebrating(false);
                setIndex(0);
              }}
              className="w-full py-3 rounded-xl bg-black/5 dark:bg-white/5 text-xs font-bold text-[#1D211E] dark:text-[#F6F1E7]"
            >
              إعادة القراءة من البداية
            </TactileButton>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border ${
        isNight
          ? 'bg-gradient-to-b from-[#18202E] to-[#0E1520] border-[#C6A15B]/25'
          : 'bg-white/90 dark:bg-[#1F2E24] border-[#C6A15B]/25'
      }`}
    >
      {isNight && <StarField />}

      {/* Header */}
      <div className="relative flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-1.5">
          <TactileButton
            onClick={goPrev}
            disabled={index === 0}
            ariaLabel="الذكر السابق"
            className="p-2 rounded-xl bg-black/5 dark:bg-white/5 text-[#7E8C7F] disabled:opacity-30"
          >
            <ChevronUp className="w-4 h-4" />
          </TactileButton>
          <TactileButton
            onClick={goNext}
            disabled={isLast}
            ariaLabel="الذكر التالي"
            className="p-2 rounded-xl bg-black/5 dark:bg-white/5 text-[#7E8C7F] disabled:opacity-30"
          >
            <ChevronDown className="w-4 h-4" />
          </TactileButton>
        </div>

        <div className="text-center">
          <span className="block text-[10px] text-[#7E8C7F] dark:text-[#A9B7A3] font-semibold uppercase tracking-wider">
            {meta.icon} {meta.title}
          </span>
          <span className="text-xs font-bold text-[#C6A15B]">
            الذكر {index + 1} من {items.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <TactileButton
            onClick={() => onOpenSource(item)}
            ariaLabel="مصدر الذكر"
            className="p-2 rounded-xl bg-black/5 dark:bg-white/5 text-[#7E8C7F] hover:text-[#C6A15B]"
          >
            <Info className="w-4 h-4" />
          </TactileButton>
          <TactileButton
            onClick={onBack}
            ariaLabel="عودة"
            className="p-2 rounded-xl bg-black/5 dark:bg-white/5 text-[#7E8C7F] hover:text-[#1D211E] dark:hover:text-[#F6F1E7]"
          >
            <ArrowRight className="w-4 h-4" />
          </TactileButton>
        </div>
      </div>

      {/* Scrollable dhikr text */}
      <div
        className="relative px-6 sm:px-8 pt-5 pb-2 max-h-[42vh] overflow-y-auto qada-scroll-thin"
        dir="rtl"
      >
        <div className="flex justify-center mb-4">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${
              itemProgress.completed
                ? 'bg-[#3C6E47]/10 text-[#3C6E47] border-[#3C6E47]/25'
                : 'bg-[#C6A15B]/10 text-[#C6A15B] border-[#C6A15B]/25'
            }`}
          >
            {itemProgress.completed ? <Check className="w-3 h-3" /> : <StarEightPoint size={9} color="#C6A15B" />}
            <span>{item.title}</span>
          </span>
        </div>

        <p
          className={`font-spiritual-serif font-bold leading-relaxed text-center ${
            isLongText ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl'
          } ${isNight ? 'text-[#F6F1E7]' : 'text-[#1D211E] dark:text-[#F6F1E7]'}`}
        >
          {item.arabicText}
        </p>

        <div className="flex justify-center mt-4">
          <span className="text-[11px] text-[#7E8C7F] dark:text-[#A9B7A3]">
            يُكرَّر {item.repetitions} {item.repetitions === 1 ? 'مرة' : 'مرات'}
          </span>
        </div>

        <OrnamentalDivider accentColor={isNight ? '#8FA3A0' : '#C6A15B'} className="my-5" />
      </div>

      {/* Tap-to-count ring */}
      <div className="relative px-6 pb-6 flex flex-col items-center">
        <div className="relative" onClick={handleTap} role="button" aria-label="اضغط للذكر">
          <motion.div
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 420, damping: 24 }}
            className={`${itemProgress.completed ? 'pointer-events-none' : 'cursor-pointer rounded-full'}`}
          >
            <CircularProgressRing
              percentage={itemProgress.completed ? 100 : (itemProgress.count / item.repetitions) * 100}
              size={168}
              strokeWidth={9}
              circleColor={isNight ? 'rgba(143,163,160,0.15)' : 'rgba(198,161,91,0.15)'}
              progressColor={
                isNight ? '#A9B7A3' : item.repetitions > 30 ? '#3C6E47' : '#C6A15B'
              }
            >
              <div className={`text-center ${isNight ? 'text-[#F6F1E7]' : ''}`}>
                <span className="block text-4xl font-extrabold font-landing-display leading-none">
                  {itemProgress.count}
                </span>
                <span
                  className={`block text-[10px] mt-1 ${
                    isNight ? 'text-[#8FA3A0]' : 'text-[#7E8C7F] dark:text-[#A9B7A3]'
                  }`}
                >
                  / {item.repetitions}
                </span>
              </div>
            </CircularProgressRing>
          </motion.div>

          {/* Completed stamp */}
          <AnimatePresence>
            {itemProgress.completed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-14 h-14 rounded-full bg-[#3C6E47] text-[#F6F1E7] flex items-center justify-center shadow-lg shadow-[#3C6E47]/30">
                  <Check className="w-7 h-7 stroke-[3]" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Flash ripples */}
          <AnimatePresence>
            {flash && (
              <motion.div
                initial={{ opacity: 0.5, scale: 0.7 }}
                animate={{ opacity: 0, scale: 1.6 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                className="absolute inset-0 rounded-full border-2 border-[#C6A15B]"
              />
            )}
          </AnimatePresence>
          <motion.span
            key={pulse}
            initial={{ opacity: 0.45, scale: 0.6 }}
            animate={{ opacity: 0, scale: 1.25 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute inset-0 rounded-full bg-[#C6A15B]/20 pointer-events-none"
          />
        </div>

        {/* Big tap target */}
        <TactileButton
          onClick={handleTap}
          disabled={itemProgress.completed}
          className={`mt-5 w-full py-4 rounded-2xl font-bold text-sm transition-all border ${
            itemProgress.completed
              ? 'bg-[#3C6E47]/10 text-[#3C6E47] border-[#3C6E47]/25'
              : isNight
                ? 'bg-[#C6A15B] text-[#18231C] border-[#C6A15B] shadow-lg shadow-[#C6A15B]/20'
                : 'bg-[#26352A] dark:bg-[#C6A15B] text-[#F6F1E7] dark:text-[#18231C] border-transparent shadow-sm'
          }`}
        >
          {itemProgress.completed ? (
            <span className="flex items-center justify-center gap-2">
              <Check className="w-4 h-4 stroke-[3]" />
              تم هذا الذكر، تقبل الله منك
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span className="text-xs bg-black/10 dark:bg-black/15 rounded-lg px-2 py-0.5">+1</span>
              اضغط للذكر
            </span>
          )}
        </TactileButton>

        {/* Category progress */}
        <div className="mt-4 w-full flex items-center justify-between text-[11px] text-[#7E8C7F] dark:text-[#A9B7A3]">
          <span>تقدم الورد</span>
          <span className="font-bold text-[#C6A15B]">
            {catProgress.completed} / {catProgress.total} أذكار
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Subtle twinkling star field for the sleep/night collections ───
const STAR_POSITIONS: Array<{ top: string; left: string; delay: number; size: number }> = [
  { top: '8%', left: '12%', delay: 0.2, size: 2 },
  { top: '16%', left: '78%', delay: 0.9, size: 3 },
  { top: '30%', left: '6%', delay: 1.4, size: 2 },
  { top: '42%', left: '88%', delay: 0.5, size: 2 },
  { top: '58%', left: '8%', delay: 1.1, size: 3 },
  { top: '70%', left: '82%', delay: 0.3, size: 2 },
  { top: '85%', left: '16%', delay: 1.7, size: 2 },
  { top: '12%', left: '42%', delay: 2.1, size: 2 },
  { top: '66%', left: '55%', delay: 0.7, size: 2 },
  { top: '90%', left: '70%', delay: 1.3, size: 3 },
];

const StarField: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {STAR_POSITIONS.map((star, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-[#E8DDD0]"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            boxShadow: '0 0 6px rgba(232,221,208,0.8)',
          }}
          animate={{ opacity: [0.2, 0.9, 0.2], scale: [1, 1.25, 1] }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            delay: star.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};