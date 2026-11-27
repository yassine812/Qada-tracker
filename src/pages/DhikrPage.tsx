import { FeatureHelp } from '../components/guide/FeatureHelp';
import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, Copy, Check, Heart, BookOpen, Sparkles, Minus, RotateCcw,
  Info, CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { ADHKAR_LIST, getRandomDhikr, DhikrItem } from '../data/adhkar';
import { playSoftClickSound, triggerHaptic } from '../utils/streak';
import { PageTransition, AnimatedNumber, TactileButton, CircularProgressRing } from '../components/ui/MotionPrimitives';
import { StarEightPoint, SubtleArch, OrnamentalDivider } from '../components/landing/IslamicOrnaments';
import { AdhkarFeature } from '../components/adhkar/AdhkarFeature';
import { PropheticDuaExperience } from '../components/adhkar/PropheticDuaExperience';
import { formatArabicNumber } from '../utils/calculator';
import { ModalPortal } from '../components/ui/ModalPortal';

// ══════════════════════════════════════════════════════════════════
// 1. ISTIGHFAR COUNTER - inspired by Sahih al-Bukhari 6307
//    (Prophet ﷺ sought forgiveness 70+ times daily)
//    Presented as a personal daily target, NOT religiously obligatory Qada.
// ══════════════════════════════════════════════════════════════════
const IstighfarCounter: React.FC = () => {
  const {
    todayIstighfarCount, incrementIstighfar, decrementIstighfar,
    recordIstighfarBatch,
    istighfarData,
    settings,
  } = useApp();

  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [showBatchSheet, setShowBatchSheet] = useState(false);
  const [batchAmount, setBatchAmount] = useState('');
  const [batchSuccess, setBatchSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!showInfoSheet && !showBatchSheet) return;
    const app = document.querySelector<HTMLElement>('.qada-experience');
    const wasInert = app?.inert ?? false;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (app) app.inert = true;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowInfoSheet(false);
        setShowBatchSheet(false);
      }
      if (event.key !== 'Tab') return;
      const controls = document.querySelectorAll<HTMLElement>('.qada-istighfar-dialog button:not(:disabled), .qada-istighfar-dialog input');
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = overflow;
      if (app) app.inert = wasInert;
      document.removeEventListener('keydown', handleKey);
    };
  }, [showInfoSheet, showBatchSheet]);

  // Today's counter is always the fixed 70-count practice; the personal
  // historical goal is tracked separately below.
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
    <div className="qada-dhikr-counter space-y-6 text-center" data-help="istighfar">
      {/* Header */}
      <div>
        <span className="text-xs uppercase tracking-wider text-[#7E8C7F] dark:text-[#A9B7A3] font-semibold block mb-1">
          استغفار اليوم
        </span>
        <h3 className="text-2xl font-bold font-landing-display text-[#1D211E] dark:text-[#F6F1E7]">
          استغفار اليوم
        </h3>
        <p className="text-xs text-[#4A584C] dark:text-[#A9B7A3] mt-1 font-spiritual-serif max-w-xs mx-auto">
          هدفك اليومي: {formatArabicNumber(DAILY_TARGET)} مرة
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
          <motion.button
            type="button"
            aria-label="استغفر الله، إضافة واحدة"
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
              {isGoalReached ? (istighfarData?.hasCompletedSetup ? 'إضافة للهدف الشخصي' : 'اكتمل هدف اليوم') : 'استغفار الآن'}
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
          </motion.button>
        </div>

      {/* Goal Reached Celebration Banner */}
        {isGoalReached && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 px-4 py-2 rounded-full bg-[#C6A15B]/15 border border-[#C6A15B]/30 text-xs text-[#C6A15B] font-bold flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>ما شاء الله 🌿 أكملت هدف الاستغفار اليومي.</span>
          </motion.div>
        )}
      </div>

      {/* Secondary Controls: Decrement */}
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

      {/* Keep the personal goal visible throughout the day, not only after the daily target. */}
      {istighfarData?.hasCompletedSetup && istighfarData.historicalRemaining !== undefined && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-2">
          <div className="rounded-2xl border border-[#C6A15B]/25 bg-[#C6A15B]/10 px-4 py-3 text-right">
            <p className="text-sm font-bold text-[#C6A15B]">هدف الاستغفار الشخصي</p>
            <p className="mt-1 text-xs leading-6 text-[#7E8C7F] dark:text-[#A9B7A3]">
              {isGoalReached ? 'أكملت 70 لليوم؛ كل ضغطة إضافية تتقدم بهذا الهدف الشخصي.' : 'تابع وردك اليومي، وتابع تقدّم هدفك الشخصي هنا.'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-black/5 dark:bg-white/5 border border-[#C6A15B]/20 px-4 py-3">
              <span className="text-xs text-[#7E8C7F] dark:text-[#A9B7A3] font-semibold block">رقم الهدف</span>
              <p className="mt-1 text-lg font-bold font-landing-display text-[#1D211E] dark:text-[#F6F1E7]">{formatArabicNumber(istighfarData.historicalTotalTarget)}</p>
            </div>
            <div className="rounded-2xl bg-black/5 dark:bg-white/5 border border-[#C6A15B]/20 px-4 py-3">
              <span className="text-xs text-[#7E8C7F] dark:text-[#A9B7A3] font-semibold block">المتبقي</span>
              <p className="mt-1 text-lg font-bold font-landing-display text-[#C6A15B]">{formatArabicNumber(istighfarData.historicalRemaining)}</p>
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-[#C6A15B]/20">
            <div>
              <span className="text-xs text-[#7E8C7F] dark:text-[#A9B7A3] font-semibold block">المنجز من الهدف</span>
              <p className="text-lg font-bold font-landing-display text-[#C6A15B]">{formatArabicNumber(istighfarData.historicalCompleted)}</p>
              <p className="text-[10px] text-[#7E8C7F] dark:text-[#A9B7A3] mt-0.5">هدف شخصي للمتابعة، وليس قضاءً شرعيًا واجبًا</p>
            </div>
            <button type="button" onClick={() => setShowInfoSheet(true)} className="p-2 rounded-full bg-[#C6A15B]/15 border border-[#C6A15B]/30 text-[#C6A15B] hover:bg-[#C6A15B]/25 transition-colors" aria-label="معلومات عن هدف الاستغفار">
              <Info className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Manual batch entry: record counts performed away from the phone. */}
      <div className="flex flex-col items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => setShowBatchSheet(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#C6A15B]/40 bg-[#C6A15B]/10 text-sm font-bold text-[#8A6A2F] dark:text-[#C6A15B] hover:bg-[#C6A15B]/20 transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          <span>إضافة عدد</span>
        </button>
        <AnimatePresence>
          {batchSuccess && (
            <motion.span
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6 }}
              className="text-sm font-bold text-[#3C6E47] dark:text-[#A9D5A7]"
            >
              +{batchSuccess}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Hadith Info Bottom Sheet */}
      <ModalPortal active={showInfoSheet || showBatchSheet}>
      <AnimatePresence>
        {showInfoSheet && (
          <div className="qada-istighfar-dialog fixed inset-0 z-50 bg-black/50 backdrop-blur-xs" onClick={() => setShowInfoSheet(false)}>
            <div className="qada-modal-viewport fixed flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="qada-modal-panel w-full max-w-sm rounded-3xl bg-[#FAF7F2] dark:bg-[#252622] border border-[#C6A15B]/30 shadow-2xl p-5 text-right"
              role="dialog" aria-modal="true" aria-label="عن مصدر الهدف اليومي"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-sm text-[#1D211E] dark:text-[#F6F1E7]">
                  عن مصدر الهدف اليومي
                </h4>
                <button
                  type="button"
                  onClick={() => setShowInfoSheet(false)}
                  className="p-1 rounded-lg text-[#7E8C7F] hover:text-[#1D211E] dark:hover:text-[#F6F1E7]"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 p-4 rounded-2xl bg-white/60 dark:bg-black/20 border border-[#C6A15B]/20">
                <p className="font-spiritual-serif text-sm leading-relaxed text-[#1D211E] dark:text-[#F6F1E7]">
                  ورد في صحيح البخاري عن أبي هريرة رضي الله عنه أن النبي ﷺ قال:
                </p>
                <p className="font-spiritual-serif text-base leading-relaxed text-[#C6A15B] font-bold italic">
                  «والله إني لأستغفر الله وأتوب إليه في اليوم أكثر من سبعين مرة».
                </p>
              </div>

              <div className="space-y-2 text-xs text-[#7E8C7F] dark:text-[#A9B7A3] leading-relaxed">
                <p>
                  المقدار 70 مرة في التطبيق هو{' '}
                  <strong className="text-[#1D211E] dark:text-[#F6F1E7]">هدف يومي مستوحى من هذا الحديث</strong>،
                  أما العدد التاريخي فهو{' '}
                  <strong className="text-[#1D211E] dark:text-[#F6F1E7]">هدف شخصي للمتابعة وليس قضاءً شرعيًا واجبًا</strong>.
                </p>
                <p className="pt-2 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#C6A15B]" />
                  <span>المصدر: صحيح البخاري، حديث 6307</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowInfoSheet(false)}
                className="w-full mt-4 py-2.5 rounded-xl bg-[#26352A] dark:bg-[#C6A15B] text-[#F6F1E7] dark:text-[#18231C] text-xs font-bold"
              >
                فهمت
              </button>
            </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual batch bottom sheet */}
      <AnimatePresence>
        {showBatchSheet && (
          <div
            className="qada-istighfar-dialog fixed inset-0 z-50 bg-black/50 backdrop-blur-xs"
            onClick={() => setShowBatchSheet(false)}
          >
            <div className="qada-modal-viewport fixed flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="qada-modal-panel w-full max-w-sm rounded-3xl bg-[#FAF7F2] dark:bg-[#252622] border border-[#C6A15B]/30 shadow-2xl p-5 text-right"
              role="dialog" aria-modal="true" aria-labelledby="istighfar-batch-title"
              onClick={(e) => e.stopPropagation()}
              dir="rtl"
            >
              <div className="flex items-center justify-between mb-5">
                <h4 id="istighfar-batch-title" className="font-bold text-lg text-[#1D211E] dark:text-[#F6F1E7]">إضافة استغفار</h4>
                <button
                  type="button"
                  onClick={() => setShowBatchSheet(false)}
                  className="p-1.5 rounded-lg text-[#7E8C7F] hover:text-[#1D211E] dark:hover:text-[#F6F1E7]"
                  aria-label="إغلاق"
                >
                  <span className="text-xl leading-none">×</span>
                </button>
              </div>
              <p className="text-sm text-[#4A584C] dark:text-[#A9B7A3] mb-3">كم مرة استغفرت؟</p>
              <input
                autoFocus
                type="text"
                inputMode="numeric"
                dir="ltr"
                value={batchAmount}
                onChange={(e) => setBatchAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void (async () => {
                      if (!batchAmount.trim()) return;
                      const didSave = await recordIstighfarBatch(batchAmount);
                      if (didSave) {
                        setBatchSuccess(batchAmount.trim());
                        setBatchAmount('');
                        setShowBatchSheet(false);
                        setTimeout(() => setBatchSuccess(null), 1800);
                      }
                    })();
                  }
                }}
                placeholder="50"
                className="w-full rounded-2xl border border-[#C6A15B]/40 bg-white/80 dark:bg-[#1F2E24] px-4 py-3 text-center text-2xl font-bold text-[#1D211E] dark:text-[#F6F1E7] outline-none focus:ring-2 focus:ring-[#C6A15B]/40"
                aria-label="عدد الاستغفار"
              />
              <button
                type="button"
                onClick={async () => {
                  if (!batchAmount.trim()) return;
                  const didSave = await recordIstighfarBatch(batchAmount);
                  if (didSave) {
                    setBatchSuccess(batchAmount.trim());
                    setBatchAmount('');
                    setShowBatchSheet(false);
                    setTimeout(() => setBatchSuccess(null), 1800);
                  }
                }}
                disabled={!batchAmount.trim()}
                className="w-full mt-4 py-3 rounded-2xl bg-[#C6A15B] text-[#18231C] font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                إضافة
              </button>
              <p className="text-[11px] text-[#7E8C7F] dark:text-[#A9B7A3] text-center mt-3">
                هذا العدد يُضاف إلى الهدف الشخصي فقط، ولا يغيّر عدّاد استغفار اليوم (70).
              </p>
            </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
      </ModalPortal>
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
      <div className="qada-surface-card relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-white/90 dark:bg-[#1F2E24] border border-[#C6A15B]/25 shadow-sm text-center">
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
  const [activeTab, setActiveTab] = useState<'adhkar' | 'istighfar' | 'dua'>(() => window.location.pathname === '/app/adhkar' ? 'adhkar' : window.location.pathname === '/app/istighfar' ? 'istighfar' : 'dua');

  const SUBTABS: Array<{ key: 'adhkar' | 'istighfar' | 'dua'; label: string }> = [
    { key: 'dua', label: 'الدعاء' },
    { key: 'adhkar', label: 'الأذكار' },
    { key: 'istighfar', label: 'الاستغفار' },
  ];

  return (
    <PageTransition className="qada-app-page qada-guide-dhikr space-y-6 pb-24 text-right select-none" data-guide-page="dhikr">
      {/* Tab Switcher */}
      <div className="qada-segmented-control flex items-center gap-2 p-1 rounded-2xl bg-white/70 dark:bg-[#1F2E24] border border-[#C6A15B]/20 backdrop-blur-md" data-guide="dhikr">
        <div className="flex flex-1">
        {SUBTABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            aria-pressed={activeTab === tab.key}
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
        <FeatureHelp topic={activeTab === 'adhkar' ? 'adhkar' : activeTab === 'istighfar' ? 'istighfar' : 'dua'} />
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
