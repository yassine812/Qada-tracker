import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Copy, Check, Heart, BookOpen, Sparkles, Minus, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { ADHKAR_LIST, getRandomDhikr, DhikrItem } from '../data/adhkar';
import { playSoftClickSound, triggerHaptic } from '../utils/streak';
import { PageTransition, AnimatedNumber, TactileButton, CircularProgressRing } from '../components/ui/MotionPrimitives';
import { StarEightPoint, SubtleArch, OrnamentalDivider } from '../components/landing/IslamicOrnaments';
import { AdhkarFeature } from '../components/adhkar/AdhkarFeature';
import { PropheticDuaExperience } from '../components/adhkar/PropheticDuaExperience';

// ══════════════════════════════════════════════════════════════════
// 1. SATISFYING ISTIGHFAR INTERACTION
// ══════════════════════════════════════════════════════════════════
const IstighfarCounter: React.FC = () => {
  const {
    todayIstighfarCount, incrementIstighfar, decrementIstighfar,
    settings,
  } = useApp();

  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);

  const DAILY_TARGET = 70;
  const progressPct = Math.min(100, Math.round((todayIstighfarCount / DAILY_TARGET) * 100));
  const isGoalReached = todayIstighfarCount >= DAILY_TARGET;

  const handleTapOrb = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (settings?.soundEnabled) playSoftClickSound();
    if (settings?.hapticsEnabled) triggerHaptic();

    incrementIstighfar();

    // Spawn 4 gentle radiating gold particles
    const rect = e.currentTarget.getBoundingClientRect();
    const newParticles = [0, 90, 180, 270].map((angle, i) => {
      const rad = (angle * Math.PI) / 180;
      return {
        id: Date.now() + i,
        x: Math.cos(rad) * 45,
        y: Math.sin(rad) * 45,
      };
    });

    setParticles(newParticles);
    setTimeout(() => setParticles([]), 700);
  }, [incrementIstighfar, settings]);

  return (
    <div className="space-y-6 text-center">
      {/* Header */}
      <div>
        <span className="text-xs uppercase tracking-wider text-[#7E8C7F] dark:text-[#A9B7A3] font-semibold block mb-1">
          ورد الاستغفار اليومي
        </span>
        <h3 className="text-2xl font-bold font-landing-display text-[#1D211E] dark:text-[#F6F1E7]">
          ملازمة الاستغفار
        </h3>
        <p className="text-xs text-[#4A584C] dark:text-[#A9B7A3] mt-1 font-spiritual-serif max-w-xs mx-auto">
          «فَقُلْتُ اسْتَغْفِرُوا رَبَّكُمْ إِنَّهُ كَانَ غَفَّارًا»
        </p>
      </div>

      {/* Center Interactive Orb with Circular Progress */}
      <div className="flex flex-col items-center justify-center py-4">
        <div className="relative flex items-center justify-center">
          {/* Progress Ring */}
          <CircularProgressRing
            percentage={progressPct}
            size={240}
            strokeWidth={10}
            circleColor="rgba(198, 161, 91, 0.15)"
            progressColor="#C6A15B"
          />

          {/* Interactive Core Button */}
          <motion.div
            onClick={handleTapOrb}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.94 }}
            className={`absolute w-48 h-48 rounded-full flex flex-col items-center justify-center p-4 cursor-pointer select-none transition-all duration-300 shadow-xl ${
              isGoalReached
                ? 'bg-gradient-to-br from-[#26352A] to-[#18231C] text-[#F6F1E7] border-2 border-[#C6A15B]'
                : 'bg-white/90 dark:bg-[#1F2E24] text-[#1D211E] dark:text-[#F6F1E7] border border-[#C6A15B]/30 hover:border-[#C6A15B]'
            }`}
          >
            {/* Islamic Star */}
            <span className="text-[#C6A15B] mb-1.5">
              <StarEightPoint size={16} color="#C6A15B" />
            </span>

            {/* Dhikr text */}
            <span className="font-spiritual-serif text-lg sm:text-xl font-bold text-center leading-tight mb-2 text-[#C6A15B]">
              أَسْتَغْفِرُ اللَّهَ
            </span>

            {/* Counter */}
            <div className="flex items-baseline gap-1 font-landing-display">
              <span className="text-3xl font-extrabold">
                <AnimatedNumber value={todayIstighfarCount} />
              </span>
              <span className="text-xs text-[#7E8C7F] dark:text-[#A9B7A3]">
                / {DAILY_TARGET}
              </span>
            </div>

            <span className="text-[10px] text-[#7E8C7F] dark:text-[#A9B7A3] mt-1 tracking-wide">
              اضغط للتسبيح
            </span>

            {/* Radiating Floating Gold Particles */}
            {particles.map((p) => (
              <motion.span
                key={p.id}
                initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
                animate={{ opacity: 0, scale: 1.2, x: p.x, y: p.y }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="absolute w-2 h-2 rounded-full bg-[#C6A15B] pointer-events-none shadow-sm shadow-[#C6A15B]"
              />
            ))}
          </motion.div>
        </div>

        {/* Goal Reached Celebration Banner */}
        {isGoalReached && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 px-4 py-2 rounded-full bg-[#C6A15B]/15 border border-[#C6A15B]/30 text-xs text-[#C6A15B] font-bold flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>تم إتمام ورد الاستغفار اليومي، تقبل الله منك!</span>
          </motion.div>
        )}
      </div>

      {/* Secondary Controls: Decrement or adjust */}
      <div className="flex items-center justify-center gap-4 pt-2">
        <TactileButton
          onClick={() => decrementIstighfar()}
          disabled={todayIstighfarCount <= 0}
          className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 text-xs text-[#7E8C7F] dark:text-[#A9B7A3] flex items-center gap-1.5 hover:text-[#1D211E] dark:hover:text-[#F6F1E7]"
          title="خصم 1 في حال الخطأ"
        >
          <Minus className="w-3.5 h-3.5" />
          <span>تراجع (-1)</span>
        </TactileButton>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// 2. DUA & ADHKAR COMPONENT WITH CLEAR SOURCE BADGES
// ══════════════════════════════════════════════════════════════════
const DailyDua: React.FC = () => {
  const { settings, showToast } = useApp();
  const [dhikr, setDhikr] = useState<DhikrItem>(ADHKAR_LIST[0]);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const today = new Date();
    const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const index = Math.abs(dateSeed) % ADHKAR_LIST.length;
    setDhikr(ADHKAR_LIST[index]);
  }, []);

  const handleNextDua = useCallback(() => {
    if (settings?.soundEnabled) playSoftClickSound();
    if (settings?.hapticsEnabled) triggerHaptic();
    setDhikr(getRandomDhikr(dhikr.id));
  }, [dhikr.id, settings]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`${dhikr.text}\n(${dhikr.source})`);
      setIsCopied(true);
      showToast('تم نسخ الدعاء المبارك إلى الحافظة', 'success');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      showToast('تعذر النسخ', 'error');
    }
  }, [dhikr, showToast]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <span className="text-xs uppercase tracking-wider text-[#7E8C7F] dark:text-[#A9B7A3] font-semibold block mb-1">
          أدعية وأذكار مختارة
        </span>
        <h3 className="text-2xl font-bold font-landing-display text-[#1D211E] dark:text-[#F6F1E7]">
          دعاء اليوم والسكينة
        </h3>
      </div>

      {/* Editorial Parchment Card */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-white/90 dark:bg-[#1F2E24] border border-[#C6A15B]/25 shadow-sm text-center">
        {/* Religious Source Badge - Explicitly Distinguishing Verified Sources */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#26352A]/5 dark:bg-[#C6A15B]/15 text-[#26352A] dark:text-[#C6A15B] border border-[#C6A15B]/25">
            <StarEightPoint size={11} color="#C6A15B" />
            <span>مصدر ديني موثوق • من القرآن والسنة</span>
          </span>
        </div>

        {/* Animated Dua Text Container */}
        <AnimatePresence mode="wait">
          <motion.div
            key={dhikr.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6"
          >
            <p className="font-spiritual-serif text-xl sm:text-2xl font-bold text-[#1D211E] dark:text-[#F6F1E7] leading-relaxed max-w-lg mx-auto py-2">
              « {dhikr.text} »
            </p>

            <OrnamentalDivider accentColor="#C6A15B" className="my-6" />

            <div className="flex items-center justify-center gap-2 text-xs text-[#7E8C7F] dark:text-[#A9B7A3]">
              <BookOpen className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>المصدر: {dhikr.source}</span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <TactileButton
            onClick={handleCopy}
            className="flex-1 py-3 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-xs font-bold text-[#1D211E] dark:text-[#F6F1E7] flex items-center justify-center gap-2 transition-colors"
          >
            {isCopied ? <Check className="w-4 h-4 text-[#3C6E47]" /> : <Copy className="w-4 h-4" />}
            <span>{isCopied ? 'تم النسخ' : 'نسخ النص'}</span>
          </TactileButton>

          <TactileButton
            onClick={handleNextDua}
            className="flex-1 py-3 rounded-xl bg-[#26352A] dark:bg-[#C6A15B] text-[#F6F1E7] dark:text-[#18231C] text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>دعاء آخر</span>
          </TactileButton>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// MAIN DHIKR PAGE WITH ANIMATED PILL SWITCHER
// ══════════════════════════════════════════════════════════════════
export const DhikrPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'adhkar' | 'istighfar' | 'dua'>('adhkar');

  const SUBTABS: Array<{ key: 'adhkar' | 'istighfar' | 'dua'; label: string }> = [
    { key: 'adhkar', label: 'الأذكار' },
    { key: 'istighfar', label: 'الاستغفار' },
    { key: 'dua', label: 'الدعاء' },
  ];

  return (
    <PageTransition className="space-y-6 pb-24 text-right select-none">
      {/* Tab Switcher */}
      <div className="flex p-1 rounded-2xl bg-white/70 dark:bg-[#1F2E24] border border-[#C6A15B]/20 backdrop-blur-md">
        {SUBTABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className="relative flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer select-none"
            style={{
              color: activeTab === tab.key ? 'var(--qada-primary)' : 'var(--qada-text-muted)',
            }}
          >
            {activeTab === tab.key && (
              <motion.div
                layoutId="dhikr-subtab-pill"
                className="absolute inset-0 rounded-xl bg-[#26352A]/10 dark:bg-[#C6A15B]/20 border border-[#C6A15B]/30"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {activeTab === 'adhkar' && <AdhkarFeature onOpenDua={() => setActiveTab('dua')} />}
          {activeTab === 'istighfar' && <IstighfarCounter />}
          {activeTab === 'dua' && <PropheticDuaExperience />}
        </motion.div>
      </AnimatePresence>
    </PageTransition>
  );
};
