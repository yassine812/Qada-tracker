import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  Plus, Minus, Sunrise, Sun, SunMedium, Sunset, Moon,
  Check, TrendingUp, Info, Calendar, Sparkles, AlertCircle,
  ChevronDown, X, ShieldCheck, History, PencilLine, Calculator,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import {
  PRAYERS_LIST,
  PrayerKey,
  DEFAULT_ZAKAT_CONFIG,
  DEFAULT_ZAKAT_ASSETS,
  ZakatAssets,
  ZakatSavedState,
} from '../types';
import { formatNumber, parseCurrencyInput } from '../utils/formatters';
import { getZakatState, saveZakatState } from '../storage/indexedDb';
import { PageTransition, AnimatedNumber, TactileButton, AnimatedProgressBar } from '../components/ui/MotionPrimitives';
import { ModalPortal } from '../components/ui/ModalPortal';
import { StarEightPoint, SubtleArch } from '../components/landing/IslamicOrnaments';

const prayerIcons: Record<PrayerKey, React.ComponentType<{ className?: string }>> = {
  fajr: Sunrise,
  dhuhr: Sun,
  asr: SunMedium,
  maghrib: Sunset,
  isha: Moon,
};

// ══════════════════════════════════════════════════════════════════
// 1. PRAYERS TRACKER (الصلوات الفائتة)
// ══════════════════════════════════════════════════════════════════
const PrayerQadaList: React.FC = () => {
  const { counters, recordQuickPrayer, updatePrayerRemainingCount } = useApp();
  const [justCompletedPrayer, setJustCompletedPrayer] = useState<PrayerKey | null>(null);

  const handleQuickAdd = useCallback(async (key: PrayerKey) => {
    const ok = await recordQuickPrayer(key, 1);
    if (ok) {
      setJustCompletedPrayer(key);
      setTimeout(() => setJustCompletedPrayer(null), 1000);
    }
  }, [recordQuickPrayer]);

  const handleDecrement = useCallback(async (key: PrayerKey) => {
    if (!counters) return;
    const current = counters[key]?.remaining || 0;
    // Add 1 back to remaining
    await updatePrayerRemainingCount(key, current + 1);
  }, [counters, updatePrayerRemainingCount]);

  if (!counters) return null;

  const prayerKeys: PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const totalRemaining = prayerKeys.reduce((sum, key) => sum + (counters[key]?.remaining || 0), 0);
  const totalCompleted = prayerKeys.reduce((sum, key) => sum + (counters[key]?.completed || 0), 0);
  const totalAll = totalRemaining + totalCompleted;
  const overallPercentage = totalAll > 0 ? Math.round((totalCompleted / totalAll) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Overview Progress Area */}
      <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-white/90 to-[#F6F1E7]/70 dark:from-[#26352A]/90 dark:to-[#18231C]/90 border border-[#C6A15B]/25 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <StarEightPoint size={14} color="#C6A15B" />
            <span className="text-xs uppercase tracking-wider text-[#7E8C7F] dark:text-[#A9B7A3] font-semibold">
              سجل الصلوات الفائتة
            </span>
          </div>
          <span className="text-xs font-bold text-[#C6A15B]">
            {overallPercentage}% مكتمل
          </span>
        </div>

        <div className="flex items-baseline justify-between mb-3">
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold font-landing-display text-[#1D211E] dark:text-[#F6F1E7]">
              <AnimatedNumber value={totalRemaining} />
              <span className="text-sm font-normal text-[#C6A15B] mr-2">صلاة متبقية</span>
            </div>
            <span className="text-xs text-[#7E8C7F] dark:text-[#A9B7A3]">
              أنجزت: {formatNumber(totalCompleted)} صلاة
            </span>
          </div>
        </div>

        <AnimatedProgressBar percentage={overallPercentage} height="h-2" />
      </div>

      {/* Prayer Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
        {PRAYERS_LIST.map((prayer) => {
          const item = counters[prayer.key];
          const Icon = prayerIcons[prayer.key];
          const isJustDone = justCompletedPrayer === prayer.key;
          const isComplete = item.remaining === 0;
          const prayerTotal = item.completed + item.remaining;
          const prayerPct = prayerTotal > 0 ? Math.round((item.completed / prayerTotal) * 100) : 0;

          return (
            <motion.div
              key={prayer.key}
              layout
              className={`relative overflow-hidden p-4 rounded-2xl transition-all duration-300 border ${
                isJustDone
                  ? 'bg-[#3C6E47]/10 border-[#3C6E47]/40 dark:bg-[#3C6E47]/20 shadow-md'
                  : 'bg-white/80 dark:bg-[#1F2E24] border-[#C6A15B]/15 hover:border-[#C6A15B]/40 shadow-sm'
              }`}
            >
              {/* Subtle top arch decoration */}
              <div className="absolute top-2 left-3 opacity-10 pointer-events-none">
                <SubtleArch className="w-8 h-12 text-[#C6A15B]" color="#C6A15B" />
              </div>

              <div className="flex items-center justify-between gap-3 relative z-10">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-[#26352A]/5 dark:bg-[#C6A15B]/10 border border-[#C6A15B]/20 flex items-center justify-center text-[#C6A15B]">
                    <Icon className="w-6 h-6 stroke-[1.8]" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold font-landing-display text-[#1D211E] dark:text-[#F6F1E7]">
                        صلاة {prayer.arabicName}
                      </h4>
                      {isComplete && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3C6E47]/20 text-[#3C6E47] dark:text-[#6BA06B] font-bold">
                          تم القضاء
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#7E8C7F] dark:text-[#A9B7A3] mt-0.5">
                      <span>متبقي:</span>
                      <span className="font-bold text-[#1D211E] dark:text-[#F6F1E7] font-mono">
                        <AnimatedNumber value={item.remaining} />
                      </span>
                      <span>• أنجزت: {formatNumber(item.completed)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Decrement / Undo button if needed */}
                  <TactileButton
                    onClick={() => handleDecrement(prayer.key)}
                    className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/5 text-[#7E8C7F] dark:text-[#A9B7A3] hover:text-[#1D211E] dark:hover:text-[#F6F1E7] flex items-center justify-center text-xs"
                    title="تعديل (+1 للمتبقي)"
                    ariaLabel="تعديل"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </TactileButton>

                  {/* Primary Complete (+1) Button */}
                  <TactileButton
                    onClick={() => handleQuickAdd(prayer.key)}
                    disabled={isComplete}
                    className={`h-11 px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors ${
                      isJustDone
                        ? 'bg-[#3C6E47] text-white'
                        : isComplete
                        ? 'bg-black/5 dark:bg-white/5 text-[#7E8C7F] cursor-not-allowed'
                        : 'bg-[#26352A] dark:bg-[#C6A15B] text-[#F6F1E7] dark:text-[#18231C] hover:opacity-90'
                    }`}
                  >
                    {isJustDone ? (
                      <>
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>أُنجزت</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>قضيت واحدة</span>
                      </>
                    )}
                  </TactileButton>
                </div>
              </div>

              {/* Progress bar per prayer */}
              <div className="mt-3 pt-2.5 border-t border-black/5 dark:border-white/5 flex items-center gap-3 text-[10px] text-[#7E8C7F] dark:text-[#A9B7A3]">
                <AnimatedProgressBar percentage={prayerPct} height="h-1" className="flex-1" />
                <span className="font-mono">{prayerPct}%</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// 2. FASTING TRACKER (الصيام)
// ══════════════════════════════════════════════════════════════════
interface FastingRecord {
  id: string;
  date: string; // YYYY-MM-DD
  days: number; // number of fasts completed that session
  reason?: string;
  timestamp: number;
}

interface FastingState {
  remainingDays: number; // current Qada fasting balance (missed days)
  completedDays: number; // total completed fasts (historical total)
  records: FastingRecord[]; // history of completed fasts
}

type FastingReasonType = 'QADA' | 'SPECIAL_CASE';

const FASTING_REASONS: { key: string; label: string; reasonType: FastingReasonType; femaleOnly?: boolean }[] = [
  { key: 'menstruation', label: 'الحيض', reasonType: 'QADA', femaleOnly: true },
  { key: 'postpartum', label: 'النفاس', reasonType: 'QADA', femaleOnly: true },
  { key: 'pregnancy', label: 'الحمل', reasonType: 'QADA', femaleOnly: true },
  { key: 'breastfeeding', label: 'الرضاعة', reasonType: 'QADA', femaleOnly: true },
  { key: 'illness', label: 'المرض المؤقت', reasonType: 'QADA' },
  { key: 'travel', label: 'السفر', reasonType: 'QADA' },
  { key: 'permanent', label: 'العجز الدائم / المرض المزمن', reasonType: 'SPECIAL_CASE' },
  { key: 'other', label: 'سبب آخر', reasonType: 'QADA' },
];

const QADA_REASONS = FASTING_REASONS.filter((r) => r.reasonType === 'QADA');
const SPECIAL_CASE_REASONS = FASTING_REASONS.filter((r) => r.reasonType === 'SPECIAL_CASE');

const DEFAULT_FASTING_STATE: FastingState = {
  remainingDays: 0,
  completedDays: 0,
  records: [],
};

function loadFastingState(): FastingState {
  try {
    const raw = localStorage.getItem('qada_fasting_state');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          remainingDays: Number.isFinite(parsed.remainingDays) ? Math.max(0, Math.floor(parsed.remainingDays)) : 0,
          completedDays: Number.isFinite(parsed.completedDays) ? Math.max(0, Math.floor(parsed.completedDays)) : 0,
          records: Array.isArray(parsed.records) ? parsed.records : [],
        };
      }
    }
  } catch {
    // ignore corrupt state
  }
  return { ...DEFAULT_FASTING_STATE };
}

const FastingTracker: React.FC = () => {
  const { settings } = useApp();
  const isFemale = settings?.gender === 'female';

  const [state, setState] = useState<FastingState>(() => loadFastingState());
  const [showEdit, setShowEdit] = useState(false);
  const [editValue, setEditValue] = useState<string>('0');
  const [justRecorded, setJustRecorded] = useState(false);

  // ---- Simple add flow ----
  const [addDays, setAddDays] = useState<string>('7');
  const [addReason, setAddReason] = useState<string | null>(null);
  const [showReasonPicker, setShowReasonPicker] = useState(false);

  // ---- Chronic/permanent illness awareness ----
  const [showChronicDialog, setShowChronicDialog] = useState(false);
  const [chronicAcknowledged, setChronicAcknowledged] = useState(false);

  // ---- Estimation tool (optional) ----
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcYears, setCalcYears] = useState('2');
  const [calcChatrPerYear, setCalcChatrPerYear] = useState('30');
  const [calcMissedPerYear, setCalcMissedPerYear] = useState('10');

  const persist = (next: FastingState) => {
    localStorage.setItem('qada_fasting_state', JSON.stringify(next));
  };

  const updateState = (updater: (prev: FastingState) => FastingState) => {
    setState((prev) => {
      const next = updater(prev);
      persist(next);
      return next;
    });
  };

  // Record a fast today (decrement remaining, append to history)
  const handleAddFastedDay = (days: number = 1, reason?: string) => {
    const toComplete = Math.min(Math.max(1, days), state.remainingDays);
    if (toComplete <= 0) return;
    const record: FastingRecord = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString().slice(0, 10),
      days: toComplete,
      reason,
      timestamp: Date.now(),
    };
    updateState((prev) => ({
      remainingDays: prev.remainingDays - toComplete,
      completedDays: prev.completedDays + toComplete,
      records: [record, ...prev.records],
    }));
    setJustRecorded(true);
    setTimeout(() => setJustRecorded(false), 1400);
  };

  // Manually set the remaining balance (does NOT touch history)
  const handleSaveEdit = () => {
    const parsed = parseCurrencyInput(editValue);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    const clamped = Math.min(9999, Math.floor(parsed));
    updateState((prev) => ({ ...prev, remainingDays: clamped }));
    setShowEdit(false);
  };

  const openEdit = () => {
    setEditValue(String(state.remainingDays));
    setShowEdit(true);
  };

  const calcEstimatedFastingDays = () => {
    const years = Math.max(0, Math.floor(Number(calcYears) || 0));
    const chatr = Math.max(0, Math.floor(Number(calcChatrPerYear) || 0));
    const missed = Math.max(0, Math.floor(Number(calcMissedPerYear) || 0));
    return Math.max(0, years * (chatr - missed));
  };

  const clampedCalcDays = Math.max(0, calcEstimatedFastingDays());

  // Apply the estimated number explicitly (never automatic)
  const applyEstimated = () => {
    if (clampedCalcDays <= 0) return;
    updateState((prev) => ({
      ...prev,
      remainingDays: Math.min(9999, prev.remainingDays + clampedCalcDays),
    }));
  };

  // Simple add: user controls the exact number; reason is metadata only
  const handleAddMissingDays = (days: number) => {
    if (!Number.isFinite(days) || days <= 0) return;
    const add = Math.min(9999, Math.floor(days));
    updateState((prev) => ({
      ...prev,
      remainingDays: Math.min(9999, prev.remainingDays + add),
    }));
    setAddDays('7');
    setAddReason(null);
  };

  const qadaAvailableReasons = QADA_REASONS.filter((r) => !r.femaleOnly || isFemale);
  const specialCaseAvailableReasons = SPECIAL_CASE_REASONS.filter((r) => !r.femaleOnly || isFemale);

  const selectedReason = addReason ? FASTING_REASONS.find((r) => r.key === addReason) : undefined;
  const selectedReasonType: FastingReasonType | null = selectedReason ? selectedReason.reasonType : null;
  const isSpecialCase = selectedReasonType === 'SPECIAL_CASE';

  const selectReason = (key: string) => {
    const reason = FASTING_REASONS.find((r) => r.key === key);
    if (!reason) return;
    setAddReason(key);
    if (reason.reasonType === 'SPECIAL_CASE') {
      // Special case: open guidance immediately, never auto-add Qada days
      setChronicAcknowledged(false);
      setShowChronicDialog(true);
    }
  };

  const closeChronicDialog = () => {
    setShowChronicDialog(false);
    if (addReason === 'permanent') {
      setChronicAcknowledged(true);
    }
  };

  // Single entry point for the "add days" action — blocks SPECIAL_CASE
  const handleAddAction = () => {
    if (isSpecialCase) {
      setChronicAcknowledged(false);
      setShowChronicDialog(true);
      return;
    }
    handleAddMissingDays(parseCurrencyInput(addDays));
  };

  // Reason-specific contextual label/help (never determines the number)
  const reasonReminder = (() => {
    switch (addReason) {
      case 'menstruation':
        return 'عدد أيام الحيض التي أفطرتِ فيها خلال رمضان (يُدخله المستخدم).';
      case 'postpartum':
        return 'عدد الأيام التي أفطرتِ فيها بسبب النفاس (يُدخله المستخدم).';
      case 'pregnancy':
      case 'breastfeeding':
        return 'عدد الأيام التي أفطرتها (يُدخله المستخدم). قد تختلف الأحكام بحسب المذهب والحالة.';
      case 'illness':
        return 'عدد الأيام التي أفطرتها بسبب المرض المؤقت.';
      case 'travel':
        return 'عدد الأيام التي أفطرتها بسبب السفر.';
      default:
        return addReason ? 'أدخل عدد الأيام الفائتة. هذا العدد يحدده المستخدم — ليس السبب.' : null;
    }
  })();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Main Summary Card */}
      <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-white/90 to-[#F6F1E7]/70 dark:from-[#26352A]/90 dark:to-[#18231C]/90 border border-[#C6A15B]/25 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <StarEightPoint size={14} color="#C6A15B" />
          <span className="text-xs uppercase tracking-wider text-[#7E8C7F] dark:text-[#A9B7A3] font-semibold">
            قضاء الصيام والتطوع
          </span>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold font-landing-display text-[#1D211E] dark:text-[#F6F1E7]">
              {state.remainingDays} <span className="text-sm font-normal text-[#C6A15B]">أيام متبقية</span>
            </h3>
            <p className="text-xs text-[#7E8C7F] dark:text-[#A9B7A3] mt-0.5">
              أيام صمتها حتى الآن: {state.completedDays} يوم
            </p>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-[#C6A15B]/15 border border-[#C6A15B]/30 text-[#C6A15B] flex items-center justify-center">
            <Moon className="w-7 h-7" />
          </div>
        </div>

        {/* Success animation after recording */}
        <AnimatePresence>
          {justRecorded && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-3 flex items-center gap-2 rounded-xl bg-[#3C6E47]/10 dark:bg-[#3C6E47]/20 border border-[#3C6E47]/30 px-3 py-2 text-xs font-bold text-[#3C6E47] dark:text-[#6BA06B]"
            >
              <Check className="w-4 h-4" />
              <span>تم تسجيل صيام اليوم — {state.remainingDays} يوم متبقي</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-3 border-t border-black/5 dark:border-white/5">
          <TactileButton
            onClick={() => handleAddFastedDay(1)}
            className="flex-1 py-3 rounded-xl bg-[#26352A] dark:bg-[#C6A15B] text-[#F6F1E7] dark:text-[#18231C] font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>تسجيل صيام اليوم</span>
          </TactileButton>
        </div>

        {/* Edit button — prominent and discoverable */}
        <button
          type="button"
          onClick={openEdit}
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[#C6A15B]/35 bg-[#C6A15B]/10 text-[#B8893A] dark:text-[#D4A84A] text-xs font-bold hover:bg-[#C6A15B]/15 transition-colors cursor-pointer"
        >
          <PencilLine className="w-3.5 h-3.5" />
          <span>تعديل العدد</span>
        </button>
      </div>

      {/* Due days summary */}
      <div className="lg:row-span-2 p-5 rounded-2xl bg-white/80 dark:bg-[#1F2E24] border border-[#C6A15B]/15 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-[#1D211E] dark:text-[#F6F1E7]">
          <Calendar className="w-4 h-4 text-[#C6A15B]" />
          <span>الأيام المستحقة</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold font-landing-display text-[#1D211E] dark:text-[#F6F1E7]">
            {state.remainingDays}
          </span>
          <span className="text-xs text-[#7E8C7F] dark:text-[#A9B7A3]">يوم قضاء متبقٍ</span>
        </div>

        {/* ── Simple add flow ── */}
        <div className="rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-[#C6A15B]/15 p-4 space-y-3">
          <h4 className="text-[11px] font-bold text-[#1D211E] dark:text-[#F6F1E7]">
            {isSpecialCase ? 'حالة خاصة — عجز دائم' : 'إضافة أيام قضاء'}
          </h4>

          {/* Custom reason selector — NOT a native dropdown */}
          <div>
            <label className="text-[11px] font-semibold text-[#7E8C7F] dark:text-[#A9B7A3] block mb-1">
              سبب الفطر
            </label>
            <button
              type="button"
              onClick={() => setShowReasonPicker(true)}
              className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/[0.07] border border-[#C6A15B]/30 text-sm font-bold text-[#1D211E] dark:text-[#F6F1E7] hover:border-[#C6A15B] transition-colors cursor-pointer"
            >
              <span className={selectedReason ? '' : 'text-[#7E8C7F] dark:text-[#A9B7A3]'}>
                {selectedReason ? selectedReason.label : 'اختر السبب'}
              </span>
              <ChevronDown className="w-4 h-4 text-[#C6A15B]" />
            </button>
          </div>

          {/* SPECIAL_CASE: guidance flow — never a Qada-day input by default */}
          {isSpecialCase ? (
            <div className="rounded-xl bg-[#B8893A]/10 border border-[#B8893A]/30 p-3 space-y-2">
              <p className="text-[11px] font-bold text-[#B8893A] dark:text-[#D4A84A] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                حالة خاصة
              </p>
              <p className="text-[10px] leading-relaxed text-[#7E8C7F] dark:text-[#A9B7A3]">
                لا تتم إضافة أيام قضاء تلقائيًا في هذه الحالة. قد يختلف الحكم الشرعي (قضاء أو فدية) بحسب حالتك ومذهبك.
              </p>
              <p className="text-[10px] leading-relaxed text-[#7E8C7F] dark:text-[#A9B7A3]">
                سلامتك أولًا: لا تصم إذا كان الصيام يضر بصحتك أو يخالف توجيه طبيبك. استشر عالمًا موثوقًا لمعرفة الحكم المناسب لحالتك.
              </p>
              {chronicAcknowledged && (
                <p className="text-[10px] leading-relaxed text-[#7E8C7F] dark:text-[#A9B7A3]">
                  إذا كنت غير متأكد من الحكم المناسب لحالتك، استشر عالمًا موثوقًا قبل إدخال عدد الأيام.
                </p>
              )}
              <button
                type="button"
                onClick={() => { setChronicAcknowledged(false); setShowChronicDialog(true); }}
                className="w-full mt-1 py-2.5 rounded-xl bg-[#26352A] dark:bg-[#C6A15B] text-[#F6F1E7] dark:text-[#18231C] text-xs font-bold cursor-pointer"
              >
                عرض التنبيه الشرعي
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className="text-[11px] font-semibold text-[#7E8C7F] dark:text-[#A9B7A3] block mb-1">
                  عدد الأيام الفائتة
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  value={addDays}
                  onChange={(e) => setAddDays(e.target.value.replace(/[^\d]/g, ''))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/[0.07] border border-[#C6A15B]/30 text-sm font-bold text-[#1D211E] dark:text-[#F6F1E7] focus:outline-none focus:border-[#C6A15B]"
                />
              </div>

              {/* Reason-specific contextual reminder (never the number) */}
              {addReason && reasonReminder && (
                <p className="text-[10px] leading-relaxed text-[#7E8C7F] dark:text-[#A9B7A3] bg-[#C6A15B]/10 border border-[#C6A15B]/20 rounded-lg px-2.5 py-2">
                  {reasonReminder}
                </p>
              )}

              <TactileButton
                onClick={handleAddAction}
                disabled={(parseCurrencyInput(addDays) || 0) <= 0}
                className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  (parseCurrencyInput(addDays) || 0) > 0
                    ? 'bg-[#26352A] dark:bg-[#C6A15B] text-[#F6F1E7] dark:text-[#18231C]'
                    : 'bg-black/10 dark:bg-white/10 text-[#7E8C7F] dark:text-[#A9B7A3] cursor-not-allowed'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة {Math.max(0, parseCurrencyInput(addDays) || 0)} أيام</span>
              </TactileButton>
            </>
          )}
        </div>

        {/* ── Optional estimation tool ── */}
        <div className="pt-1 border-t border-[#C6A15B]/10">
          <button
            type="button"
            onClick={() => setShowCalculator((s) => !s)}
            className="w-full flex items-center justify-between gap-2 py-1.5 text-xs font-bold text-[#C6A15B] cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5" />
              <span>حساب تقديري</span>
              <Info className="w-3 h-3 opacity-70" />
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCalculator ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence initial={false}>
            {showCalculator && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="pt-3 space-y-3">
                  <div className="grid grid-cols-1 gap-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-[#7E8C7F] dark:text-[#A9B7A3] block mb-1">عدد السنوات:</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        dir="ltr"
                        value={calcYears}
                        onChange={(e) => setCalcYears(e.target.value.replace(/[^\d]/g, ''))}
                        className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/[0.07] border border-[#C6A15B]/30 text-sm font-bold text-[#1D211E] dark:text-[#F6F1E7] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#7E8C7F] dark:text-[#A9B7A3] block mb-1">عدد أيام رمضان في السنة (29 أو 30):</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        dir="ltr"
                        value={calcChatrPerYear}
                        onChange={(e) => setCalcChatrPerYear(e.target.value.replace(/[^\d]/g, ''))}
                        className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/[0.07] border border-[#C6A15B]/30 text-sm font-bold text-[#1D211E] dark:text-[#F6F1E7] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#7E8C7F] dark:text-[#A9B7A3] block mb-1">عدد الأيام التي صمتها تقريبًا (في السنة):</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        dir="ltr"
                        value={calcMissedPerYear}
                        onChange={(e) => setCalcMissedPerYear(e.target.value.replace(/[^\d]/g, ''))}
                        className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/[0.07] border border-[#C6A15B]/30 text-sm font-bold text-[#1D211E] dark:text-[#F6F1E7] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Formula — never hidden */}
                  {clampedCalcDays > 0 && (
                    <div className="rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-[#C6A15B]/15 px-3 py-2.5 space-y-1 text-[11px]">
                      <div className="flex justify-between"><span className="text-[#7E8C7F] dark:text-[#A9B7A3]">عدد السنوات</span><span className="font-bold text-[#1D211E] dark:text-[#F6F1E7]" dir="ltr">{Math.max(0, Math.floor(Number(calcYears) || 0))}</span></div>
                      <div className="flex justify-between"><span className="text-[#7E8C7F] dark:text-[#A9B7A3]">× أيام فائتة في السنة (تقريبًا)</span><span className="font-bold text-[#1D211E] dark:text-[#F6F1E7]" dir="ltr">{Math.max(0, Math.floor(Number(calcChatrPerYear) || 0) - Math.floor(Number(calcMissedPerYear) || 0))}</span></div>
                      <div className="border-t border-dashed border-[#C6A15B]/25 pt-1 flex justify-between"><span className="font-bold text-[#1D211E] dark:text-[#F6F1E7]">= الأيام المقدرة</span><span className="font-bold text-[#C6A15B]" dir="ltr">{clampedCalcDays} يومًا</span></div>
                    </div>
                  )}

                  <div className="flex items-start gap-2 rounded-xl bg-[#B8893A]/10 border border-[#B8893A]/30 px-3 py-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#B8893A] dark:text-[#D4A84A]" />
                    <p className="text-[10px] leading-relaxed text-[#7E8C7F] dark:text-[#A9B7A3]">
                      <span className="font-bold text-[#B8893A] dark:text-[#D4A84A]">تقدير تقريبي — </span>
                      هذا تقدير حسابي فقط بناءً على الأرقام التي أدخلتها. راجع تقديرك وعدّله قبل اعتماده.
                    </p>
                  </div>

                  <TactileButton
                    onClick={applyEstimated}
                    disabled={clampedCalcDays <= 0}
                    className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      clampedCalcDays > 0
                        ? 'bg-[#26352A] dark:bg-[#C6A15B] text-[#F6F1E7] dark:text-[#18231C]'
                        : 'bg-black/10 dark:bg-white/10 text-[#7E8C7F] dark:text-[#A9B7A3] cursor-not-allowed'
                    }`}
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>اعتماد {clampedCalcDays} يومًا</span>
                  </TactileButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Qada vs Fidya distinction */}
      <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#1F2E24] border border-[#C6A15B]/15 shadow-sm space-y-3">
        <div className="text-[11px] font-bold text-[#1D211E] dark:text-[#F6F1E7] flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-[#C6A15B]" />
          <span>القضاء والفدية</span>
        </div>
        <div className="space-y-2.5">
          <div className="flex items-start gap-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-[#C6A15B]/15 p-3">
            <div className="w-7 h-7 rounded-lg bg-[#3C6E47]/15 text-[#3C6E47] dark:text-[#6BA06B] flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#1D211E] dark:text-[#F6F1E7]">قضاء الصيام</p>
              <p className="text-[10px] leading-relaxed text-[#7E8C7F] dark:text-[#A9B7A3]">
                للأيام التي يمكن للمستخدم قضاؤها لاحقًا وفق حالته (كالحيض، النفاس، السفر، المرض المؤقت).
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-xl bg-[#B8893A]/10 dark:bg-[#B8893A]/10 border border-[#B8893A]/25 p-3">
            <div className="w-7 h-7 rounded-lg bg-[#B8893A]/15 text-[#B8893A] dark:text-[#D4A84A] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#1D211E] dark:text-[#F6F1E7]">الفدية</p>
              <p className="text-[10px] leading-relaxed text-[#7E8C7F] dark:text-[#A9B7A3]">
                قد تتعلق ببعض حالات العجز الدائم عن الصيام، وفق الحكم الشرعي المطبق على الحالة. لا تُحتسب هنا تلقائيًا — استشر عالمًا موثوقًا.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fasting history */}
      <div className="p-5 rounded-2xl bg-white/80 dark:bg-[#1F2E24] border border-[#C6A15B]/15 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1D211E] dark:text-[#F6F1E7]">
            <History className="w-4 h-4 text-[#C6A15B]" />
            <span>سجل الصيام</span>
          </div>
          <span className="text-[10px] text-[#7E8C7F] dark:text-[#A9B7A3]">{state.records.length} سجل</span>
        </div>

        {state.records.length === 0 ? (
          <p className="text-xs text-[#7E8C7F] dark:text-[#A9B7A3] leading-relaxed">
            لم تُسجّل أيام صيام بعد. سجّل أول يوم قضاء بالزر أعلاه.
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {state.records.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between gap-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-[#C6A15B]/15 px-3 py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#C6A15B]/15 text-[#C6A15B] flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1D211E] dark:text-[#F6F1E7]">تم تسجيل صيام قضاء</p>
                    <p className="text-[10px] text-[#7E8C7F] dark:text-[#A9B7A3]">
                      {rec.date}
                      {rec.reason && FASTING_REASONS.find((r) => r.key === rec.reason) ? ` — ${FASTING_REASONS.find((r) => r.key === rec.reason)!.label}` : ''}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-[#C6A15B]">{rec.days} يوم</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sunnah Fasting Days Reminder */}
      <div className="p-5 rounded-2xl bg-white/80 dark:bg-[#1F2E24] border border-[#C6A15B]/15 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#1D211E] dark:text-[#F6F1E7]">
          <Calendar className="w-4 h-4 text-[#C6A15B]" />
          <span>أيام الصيام المستحبة</span>
        </div>
        <ul className="text-xs text-[#4A584C] dark:text-[#A9B7A3] space-y-2 leading-relaxed font-spiritual-serif text-sm">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C6A15B]" />
            <span>صيام الإثنين والخميس من كل أسبوع.</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C6A15B]" />
            <span>صيام الأيام البيض (13، 14، 15 من كل شهر هجري).</span>
          </li>
        </ul>
        <div className="flex items-start gap-2 text-[10px] text-[#7E8C7F] dark:text-[#A9B7A3]">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#C6A15B]" />
          <span>
            هذه الأداة للمساعدة في تتبّع القضاء وليست فتوى. تختلف بعض الأحكام المتعلقة بأسباب الفطر (كالحيض والنفاس والسفر) باختلاف المذهب والحالة الشخصية.
          </span>
        </div>
      </div>

      <ModalPortal active={showEdit || showReasonPicker || showChronicDialog}>
      {/* ⓘ Edit modal (centered) */}
      <AnimatePresence>
        {showEdit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setShowEdit(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showEdit && (
          <motion.div
            dir="rtl"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="qada-modal-viewport fixed z-50 flex items-center justify-center"
          >
            <div role="dialog" aria-modal="true" aria-labelledby="fasting-edit-title" className="qada-modal-panel w-full max-w-sm rounded-3xl bg-[#FAF8F3] dark:bg-[#1C2820] border border-[#C6A15B]/35 shadow-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#C6A15B]/15 pb-2">
                <h3 id="fasting-edit-title" className="text-sm font-bold font-spiritual-serif text-[#1D211E] dark:text-[#F6F1E7]">
                  تعديل أيام الصيام
                </h3>
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="p-1 rounded-full text-[#7E8C7F] hover:text-black dark:hover:text-white cursor-pointer"
                  aria-label="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <p className="text-[11px] text-[#7E8C7F] dark:text-[#A9B7A3] mb-2">الأيام المتبقية</p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditValue(String(Math.max(0, (parseCurrencyInput(editValue) || 0) - 1)))}
                    className="w-11 h-11 rounded-full bg-[#C6A15B]/15 border border-[#C6A15B]/30 text-[#C6A15B] flex items-center justify-center hover:bg-[#C6A15B]/25 transition-colors cursor-pointer"
                    aria-label="إنقاص"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <div className="flex-1 max-w-[140px]">
                    <input
                      type="text"
                      inputMode="numeric"
                      aria-label="الأيام المتبقية"
                      dir="ltr"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value.replace(/[^\d]/g, ''))}
                      className="w-full text-center px-3 py-3 rounded-xl bg-black/5 dark:bg-white/[0.07] border border-[#C6A15B]/30 text-2xl font-extrabold text-[#1D211E] dark:text-[#F6F1E7] focus:outline-none focus:border-[#C6A15B]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditValue(String(Math.min(9999, (parseCurrencyInput(editValue) || 0) + 1)))}
                    className="w-11 h-11 rounded-full bg-[#C6A15B]/15 border border-[#C6A15B]/30 text-[#C6A15B] flex items-center justify-center hover:bg-[#C6A15B]/25 transition-colors cursor-pointer"
                    aria-label="زيادة"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-center text-[10px] text-[#7E8C7F] dark:text-[#A9B7A3] mt-2">
                  يمكنك الكتابة مباشرة أو استخدام (-/+) — الحد الأقصى 9999.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="flex-1 py-2.5 rounded-xl bg-black/5 dark:bg-white/10 text-xs font-bold text-[#7E8C7F] dark:text-[#A9B7A3] hover:bg-black/10 dark:hover:bg-white/15 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <TactileButton
                  onClick={handleSaveEdit}
                  className="flex-1 py-2.5 rounded-xl bg-[#26352A] dark:bg-[#C6A15B] text-[#F6F1E7] dark:text-[#18231C] font-bold text-xs flex items-center justify-center gap-2"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>حفظ</span>
                </TactileButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom reason picker — centered modal */}
      <AnimatePresence>
        {showReasonPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setShowReasonPicker(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showReasonPicker && (
          <motion.div
            dir="rtl"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="qada-modal-viewport fixed z-50 flex items-center justify-center"
          >
            <div role="dialog" aria-modal="true" aria-label="سبب الفطر" className="qada-modal-panel w-full max-w-sm rounded-3xl bg-[#FAF8F3] dark:bg-[#1C2820] border border-[#C6A15B]/35 shadow-2xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#C6A15B]/15 pb-2">
                <h3 className="text-sm font-bold font-spiritual-serif text-[#1D211E] dark:text-[#F6F1E7]">
                  سبب الفطر
                </h3>
                <button
                  type="button"
                  onClick={() => setShowReasonPicker(false)}
                  className="p-1 rounded-full text-[#7E8C7F] hover:text-black dark:hover:text-white cursor-pointer"
                  aria-label="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-[#7E8C7F] dark:text-[#A9B7A3]">اختر سبب الفطر (سبب توضيحي فقط — لا يحدد عدد الأيام).</p>

              {/* QADA-eligible reasons */}
              <p className="text-[10px] font-bold text-[#7E8C7F] dark:text-[#A9B7A3] pt-1">قضاء محتمل</p>
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {qadaAvailableReasons.map((r) => {
                  const active = addReason === r.key;
                  return (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => {
                        selectReason(r.key);
                        setShowReasonPicker(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-3.5 py-3 rounded-xl border text-sm font-bold transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#C6A15B]/15 dark:bg-[#C6A15B]/20 border-[#C6A15B]/50 text-[#1D211E] dark:text-[#F6F1E7]'
                          : 'bg-black/[0.02] dark:bg-white/[0.03] border-[#C6A15B]/15 text-[#4A584C] dark:text-[#C6CFC0] hover:bg-[#C6A15B]/10'
                      }`}
                    >
                      <span>{r.label}</span>
                      {active ? (
                        <Check className="w-4 h-4 text-[#C6A15B]" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border-2 border-[#C6A15B]/40" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* SPECIAL_CASE — separate section, different treatment */}
              <p className="text-[10px] font-bold text-[#B8893A] dark:text-[#D4A84A] pt-2">حالة خاصة — عجز دائم</p>
              <div className="space-y-1.5">
                {specialCaseAvailableReasons.map((r) => {
                  const active = addReason === r.key;
                  return (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => {
                        selectReason(r.key);
                        setShowReasonPicker(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-3.5 py-3 rounded-xl border text-sm font-bold transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#B8893A]/15 dark:bg-[#B8893A]/20 border-[#B8893A]/50 text-[#1D211E] dark:text-[#F6F1E7]'
                          : 'bg-[#B8893A]/5 dark:bg-white/[0.03] border-[#B8893A]/25 text-[#4A584C] dark:text-[#C6CFC0] hover:bg-[#B8893A]/10'
                      }`}
                    >
                      <span>{r.label}</span>
                      {active ? (
                        <Check className="w-4 h-4 text-[#B8893A] dark:text-[#D4A84A]" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border-2 border-[#B8893A]/40" />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] leading-relaxed text-[#7E8C7F] dark:text-[#A9B7A3]">
                عند اختيار حالة العجز الدائم لن تُضاف أيام قضاء تلقائيًا، ويُعرض تنبيه شرعي.
              </p>
              <div className="pt-2 border-t border-[#C6A15B]/15">
                <button
                  type="button"
                  onClick={() => setShowReasonPicker(false)}
                  className="w-full py-2.5 rounded-xl bg-[#26352A] dark:bg-[#C6A15B] text-[#F6F1E7] dark:text-[#18231C] text-xs font-bold cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chronic illness awareness — never auto-add Qada days */}
      <AnimatePresence>
        {showChronicDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setShowChronicDialog(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showChronicDialog && (
          <motion.div
            dir="rtl"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="qada-modal-viewport fixed z-50 flex items-center justify-center"
          >
            <div role="dialog" aria-modal="true" aria-label="تنبيه شرعي" className="qada-modal-panel w-full max-w-sm rounded-3xl bg-[#FAF8F3] dark:bg-[#1C2820] border border-[#C6A15B]/35 shadow-2xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-[#B8893A]/15 text-[#B8893A] dark:text-[#D4A84A] flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold font-spiritual-serif text-[#1D211E] dark:text-[#F6F1E7]">تنبيه شرعي</h3>
              </div>

              <div className="rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-[#C6A15B]/15 p-3.5 space-y-2.5">
                <p className="text-xs leading-relaxed text-[#4A584C] dark:text-[#C6CFC0]">
                  إذا كان العجز عن الصيام دائمًا بسبب مرض مزمن أو كِبَر السن، فقد تكون <span className="font-bold">الفدية</span> هي الحكم بدل القضاء في بعض الحالات.
                </p>
                <p className="text-xs leading-relaxed text-[#4A584C] dark:text-[#C6CFC0]">
                  يختلف الحكم بحسب الحالة والتفاصيل الفقهية، لذلك لا تعتمد هذه الحاسبة كفتوى.
                </p>
                <p className="text-xs leading-relaxed text-[#4A584C] dark:text-[#C6CFC0]">
                  استشر عالمًا موثوقًا لمعرفة الحكم المناسب لحالتك.
                </p>
              </div>

              <div className="flex items-start gap-2 rounded-xl bg-[#3C6E47]/10 border border-[#3C6E47]/30 p-3">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-[#3C6E47] dark:text-[#6BA06B]" />
                <p className="text-xs leading-relaxed text-[#4A584C] dark:text-[#C6CFC0]">
                  <span className="font-bold text-[#3C6E47] dark:text-[#6BA06B]">سلامتك أولًا: </span>
                  لا تصم إذا كان الصيام يضر بصحتك أو يخالف توجيه طبيبك. استشر طبيبًا موثوقًا، واسأل عالمًا مؤهلًا عن الحكم الشرعي المناسب.
                </p>
              </div>

              <p className="text-[11px] leading-relaxed text-[#7E8C7F] dark:text-[#A9B7A3]">
                لم تُضف أيام قضاء تلقائيًا.
              </p>

              <TactileButton
                onClick={closeChronicDialog}
                className="w-full py-3 rounded-xl bg-[#26352A] dark:bg-[#C6A15B] text-[#F6F1E7] dark:text-[#18231C] font-bold text-xs flex items-center justify-center"
              >
                <span>فهمت</span>
              </TactileButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </ModalPortal>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// 3. ZAKAT CALCULATOR (الزكاة) — Tunisia 🇹🇳
// Real interactive calculator: controlled inputs, live calculation,
// hawl toggle, nisab status, persistence, validation.
// ══════════════════════════════════════════════════════════════════
type ZakatField = keyof ZakatAssets;

function loadZakatState(): ZakatSavedState {
  try {
    const raw = localStorage.getItem('qada_zakat_state');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed === 'object' &&
        parsed.assets &&
        typeof parsed.assets === 'object'
      ) {
        return {
          assets: { ...DEFAULT_ZAKAT_ASSETS, ...parsed.assets },
          hawlSatisfied: parsed.hawlSatisfied !== false,
        };
      }
    }
  } catch {
    // ignore corrupt state
  }
  return { assets: { ...DEFAULT_ZAKAT_ASSETS }, hawlSatisfied: true };
}

function numberToRaw(value: number): string {
  return value === 0 ? '' : String(value);
}

function toRawValues(assets: ZakatAssets): Record<ZakatField, string> {
  const out = {} as Record<ZakatField, string>;
  (Object.keys(DEFAULT_ZAKAT_ASSETS) as ZakatField[]).forEach((k) => {
    out[k] = numberToRaw(assets[k]);
  });
  return out;
}

const ZAKAT_INFO_SHEETS: Record<string, { title: string; text: string }> = {
  nisab: {
    title: 'ما هو النصاب؟',
    text: 'النصاب هو الحد الأدنى من المال الزكوي الذي إذا بلغه المال، وتحققت بقية الشروط الشرعية، وجبت الزكاة.\n\nالنصاب المعتمد في هذه الحاسبة:\n34 369.356 د.ت\n\nلسنة: 1448 هـ\n\nالمعدل المستخدم في الحساب: 2.5%',
  },
  hawl: {
    title: 'ما المقصود بحولان الحول؟',
    text: 'هو مرور حول هجري كامل على المال مع تحقق الشروط المتعلقة بالزكاة.\n\nفي هذه الحاسبة، يمكنك تحديد ما إذا كان الحول قد اكتمل.\n\nملاحظة: قد تختلف بعض التفاصيل الفقهية باختلاف نوع المال والمذهب والحالة الشخصية.',
  },
  assets: {
    title: 'الأموال الخاضعة للزكاة',
    text: 'يشمل المال الخاضع لزكاة المال: النقد والسيولة، الحسابات البنكية والادخار، الذهب والفضة، الاستثمارات، الديون المستحقة لك، ومخزون التجارة.\n\nيُخصم من ذلك الديون والالتزامات القابلة للخصم المستحقة عليك.\n\nقد تختلف بعض الأحكام بحسب نوع المال والمذهب والحالة الشخصية.',
  },
  investments: {
    title: 'الاستثمارات',
    text: 'يختلف حكم زكاة الاستثمارات بحسب نوعها:\n\n• الأسهم التي تُدار وتُتاجر بها: تجب زكاتها كعروض التجارة.\n• الصناديق الاستثمارية: يختلف الحكم بحسب محتواها.\n• العقارات المؤجرة: يختلف الحكم بحسب المذهب.\n\nهذا الحساب إرشادي، ويُنصح بمراجعة جهة علمية موثوقة لحالة استثمارية خاصة.',
  },
  gold: {
    title: 'الذهب والفضة',
    text: 'أدخل القيمة النقدية الحالية للذهب أو الفضة التي تريد إدخالها في حساب الزكاة.\n\nقد تختلف الأحكام المتعلقة بالحلي والاستعمال الشخصي والاستثمار حسب الحالة والمذهب.',
  },
  silver: {
    title: 'قيمة الفضة',
    text: 'أدخل القيمة النقدية الحالية للفضة بالدينار التونسي بحسب السعر الحالي في السوق.\n\nيختلف حكم الزكاة في الفضة بحسب المذهب والحالة الشخصية.',
  },
  cash: {
    title: 'النقد والسيولة',
    text: 'أدخل الأموال النقدية التي تملكها بالدينار التونسي.\n\nمثال:\n40 000 د.ت',
  },
  bankAccounts: {
    title: 'الحسابات البنكية والادخار',
    text: 'أدخل الأموال والمدخرات الموجودة في حساباتك البنكية بالدينار التونسي.',
  },
  liabilities: {
    title: 'الديون والالتزامات',
    text: 'هذا الحقل مخصص للالتزامات التي تدخل ضمن الديون القابلة للخصم وفق طريقة الحساب المعتمدة.\n\nقد تختلف أحكام خصم الديون باختلاف الحالة والمذهب.',
  },
  moneyOwed: {
    title: 'ديون لك / أموال مستحقة لك',
    text: 'أموال مستحقة لك من أشخاص آخرين أو جهات أخرى. هذه تُضاف إلى إجمالي الأموال الخاضعة للزكاة كأصول.\n\nملاحظة: لا تخلط بين هذا وبين الديون القابلة للخصم (الالتزامات عليك).',
  },
  businessInventory: {
    title: 'مخزون التجارة',
    text: 'البضائع المُخزّنة للبيع في النشاط التجاري أو الحرفي. تُحسب زكاتها كعروض التجارة عند بلغها النصاب وتحقق شرط الحول.',
  },
};

const ZakatSummaryRow: React.FC<{
  label: string;
  value: React.ReactNode;
  muted?: boolean;
  strong?: boolean;
  small?: boolean;
}> = ({ label, value, muted, strong, small }) => (
  <div className="flex items-center justify-between gap-2">
    <span
      className={`${small ? 'text-[10px]' : 'text-xs'} ${
        muted
          ? 'text-[#7E8C7F] dark:text-[#A9B7A3]'
          : 'text-[#4A584C] dark:text-[#C6CFC0]'
      }`}
    >
      {label}
    </span>
    <span
      className={`font-bold ${
        strong
          ? 'text-sm text-[#1D211E] dark:text-[#F6F1E7]'
          : small
          ? 'text-[10px] text-[#7E8C7F] dark:text-[#A9B7A3]'
          : muted
          ? 'text-xs text-[#7E8C7F] dark:text-[#A9B7A3]'
          : 'text-xs text-[#1D211E] dark:text-[#F6F1E7]'
      }`}
    >
      {value}
    </span>
  </div>
);

const ZakatCalculator: React.FC = () => {
  const [assets, setAssets] = useState<ZakatAssets>(() => loadZakatState().assets);
  const [rawValues, setRawValues] = useState<Record<ZakatField, string>>(() =>
    toRawValues(loadZakatState().assets)
  );
  const [hawlSatisfied, setHawlSatisfied] = useState<boolean>(() => loadZakatState().hawlSatisfied);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [infoSheet, setInfoSheet] = useState<{ title: string; text: string } | null>(null);
  const [invalidField, setInvalidField] = useState<ZakatField | null>(null);
  const invalidTimer = useRef<number | null>(null);
  const hasUserInteracted = useRef(false);

  const config = DEFAULT_ZAKAT_CONFIG;

  // Load authoritative state from IndexedDB on mount (only if the user hasn't typed yet)
  useEffect(() => {
    let mounted = true;
    getZakatState()
      .then((saved) => {
        if (!mounted || !saved || hasUserInteracted.current) return;
        const mergedAssets = { ...DEFAULT_ZAKAT_ASSETS, ...saved.assets };
        setAssets(mergedAssets);
        setRawValues(toRawValues(mergedAssets));
        setHawlSatisfied(saved.hawlSatisfied);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // Debounced persistence (local-first: IndexedDB + localStorage mirror)
  useEffect(() => {
    const t = setTimeout(() => {
      saveZakatState({ assets, hawlSatisfied }).catch(() => {});
    }, 300);
    return () => {
      clearTimeout(t);
      saveZakatState({ assets, hawlSatisfied }).catch(() => {});
    };
  }, [assets, hawlSatisfied]);

  useEffect(() => {
    return () => {
      if (invalidTimer.current) window.clearTimeout(invalidTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!infoSheet) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setInfoSheet(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [infoSheet]);

  // ── Calculation engine ──
  // eligibleAssets = cash + bankSavings + gold/silver + investments + moneyOwed + businessInventory
  const totalEligibleAssets = useMemo(() => {
    return (
      assets.cash +
      assets.bankAccounts +
      assets.gold +
      assets.silver +
      assets.investments +
      assets.moneyOwed +
      assets.businessInventory
    );
  }, [assets]);

  const liabilities = useMemo(() => Math.max(0, assets.liabilities), [assets.liabilities]);

  const netZakatableWealth = useMemo(() => {
    return Math.max(0, totalEligibleAssets - liabilities);
  }, [totalEligibleAssets, liabilities]);

  const aboveNisab = netZakatableWealth >= config.nisab;

  const zakatDue = useMemo(() => {
    if (!hawlSatisfied || !aboveNisab) return 0;
    return Math.round(netZakatableWealth * config.rate * 1000) / 1000;
  }, [hawlSatisfied, aboveNisab, netZakatableWealth, config.rate]);

  // ── Input handling with validation ──
  const handleInputChange = (field: ZakatField, raw: string) => {
    hasUserInteracted.current = true;
    // Allow digits, dots, commas, and spaces — parseCurrencyInput handles all conventions
    const cleaned = raw.replace(/[^\d.,\s]/g, '');
    if (cleaned !== raw) {
      setInvalidField(field);
      if (invalidTimer.current) window.clearTimeout(invalidTimer.current);
      invalidTimer.current = window.setTimeout(() => setInvalidField(null), 1600);
    } else {
      setInvalidField((prev) => (prev === field ? null : prev));
    }
    setRawValues((prev) => ({ ...prev, [field]: cleaned }));
    const num = parseCurrencyInput(cleaned);
    setAssets((prev) => ({
      ...prev,
      [field]: num,
    }));
  };

  const formatTND = (value: number): React.ReactNode => {
    const num = formatNumber(Math.round(value * 1000) / 1000, { maximumFractionDigits: 3 }).replace(/,/g, ' ');
    return (
      <>
        <span dir="ltr" className="inline-block whitespace-nowrap" style={{ unicodeBidi: 'isolate' }}>
          {num}
        </span>{' '}
        <span className="currency" dir="rtl">
          {config.currencySymbol}
        </span>
      </>
    );
  };

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/[0.07] border text-sm font-bold text-[#1D211E] dark:text-[#F6F1E7] placeholder:text-[#7E8C7F] dark:placeholder:text-[#A9B7A3] focus:outline-none transition-colors';

  const renderField = (field: ZakatField, label: string, infoKey?: string, description?: string) => (
    <div>
      <div className="flex items-center gap-1 mb-1">
        <label className="text-[11px] font-semibold text-[#7E8C7F] dark:text-[#A9B7A3]">
          {label}
        </label>
        {infoKey && (
          <button
            type="button"
            onClick={() => setInfoSheet(ZAKAT_INFO_SHEETS[infoKey])}
            className="text-[#C6A15B] hover:opacity-80 cursor-pointer shrink-0"
            aria-label={`شرح ${label}`}
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {description && (
        <p className="text-[10px] text-[#7E8C7F] dark:text-[#A9B7A3] mb-1.5 leading-relaxed">
          {description}
        </p>
      )}
      <div className="relative" dir="ltr">
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          dir="ltr"
          style={{ unicodeBidi: 'isolate' }}
          value={rawValues[field]}
          onChange={(e) => handleInputChange(field, e.target.value)}
          placeholder="40 000"
          className={`${inputClass} pl-12 text-left ${
            invalidField === field
              ? 'border-[#9E3A3A]/60 dark:border-[#CC6666]/60'
              : 'border-[#C6A15B]/30 focus:border-[#C6A15B] dark:focus:border-[#C6A15B]'
          }`}
        />
        <span
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#7E8C7F] dark:text-[#A9B7A3] pointer-events-none select-none"
          dir="rtl"
        >
          {config.currencySymbol}
        </span>
      </div>
      {rawValues[field] === '' && (
        <p className="text-[10px] text-[#7E8C7F] dark:text-[#A9B7A3] mt-1">
          مثال:{' '}
          <span dir="ltr" className="font-mono font-bold" style={{ unicodeBidi: 'isolate' }}>
            40 000
          </span>{' '}
          {config.currencySymbol}
        </p>
      )}
      {invalidField === field && (
        <p className="text-[10px] text-[#9E3A3A] dark:text-[#CC6666] mt-1">
          يُرجى إدخال أرقام فقط (أمثلة: 40 000 أو 40000 أو 40,000)
        </p>
      )}
    </div>
  );

  // Status state: green (due), amber (hawl pending), muted (below nisab)
  const status = (() => {
    if (!hawlSatisfied) {
      return {
        label: 'لم يكتمل الحول',
        hint: 'لا زكاة حتى يمر حول هجري كامل (12 شهرًا قمريًا) على بلوغ المال النصاب.',
        tone: 'amber' as const,
      };
    }
    if (aboveNisab) {
      return {
        label: 'بلغ النصاب — تجب عليك الزكاة',
        hint: '',
        tone: 'green' as const,
      };
    }
    return {
      label: 'لم يبلغ النصاب — لا تجب الزكاة حاليًا',
      hint: 'المال أقل من النصاب الشرعي فلا زكاة فيه.',
      tone: 'muted' as const,
    };
  })();

  return (
    <div className="space-y-6 relative">
      {/* Atmospheric background glow */}
      <div className="absolute inset-x-0 -top-8 h-64 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-[radial-gradient(ellipse_at_center,rgba(198,161,91,0.12)_0%,transparent_70%)]" />
        <div className="absolute top-12 left-1/4 w-40 h-40 bg-[radial-gradient(circle,rgba(60,110,71,0.08)_0%,transparent_70%)]" />
        <div className="absolute top-8 right-1/4 w-32 h-32 bg-[radial-gradient(circle,rgba(198,161,91,0.06)_0%,transparent_70%)]" />
      </div>

      {/* Content */}
      <div className="space-y-6 relative z-10">
      {/* Nisab Overview Card */}
      <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-white/90 to-[#F6F1E7]/70 dark:from-[#26352A]/90 dark:to-[#18231C]/90 border border-[#C6A15B]/25 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs uppercase tracking-wider text-[#7E8C7F] dark:text-[#A9B7A3] font-semibold">
              نصاب الزكاة الشرعي ({config.currentHijriYear} هـ)
            </span>
            <button
              type="button"
              onClick={() => setInfoSheet(ZAKAT_INFO_SHEETS.nisab)}
              className="text-[#C6A15B] hover:opacity-80 cursor-pointer"
              aria-label="شرح النصاب"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
          <TrendingUp className="w-4 h-4 text-[#C6A15B]" />
        </div>

        <div className="text-2xl sm:text-3xl font-extrabold font-landing-display text-[#1D211E] dark:text-[#F6F1E7] mb-2">
          {formatTND(config.nisab)}
        </div>
        <p className="text-xs text-[#7E8C7F] dark:text-[#A9B7A3]">
          قيمة النصاب المحددة من قِبل مفتي الجمهورية التونسية للعام الهجري {config.currentHijriYear} هـ — بمعدل زكاة {config.rate * 100}% بعد حولان الحول ({config.hawlMonths} شهرًا هجريًا).
        </p>

        {/* Zakat Due Result with clear status */}
        <div
          className={`mt-5 p-4 rounded-2xl border text-center transition-all ${
            status.tone === 'green'
              ? 'bg-[#3C6E47]/10 border-[#3C6E47]/40 dark:bg-[#3C6E47]/20'
              : status.tone === 'amber'
              ? 'bg-[#B8893A]/10 border-[#B8893A]/40 dark:bg-[#B8893A]/15'
              : 'bg-black/5 dark:bg-white/5 border-transparent'
          }`}
        >
          <span className="text-xs font-bold block mb-1 text-[#1D211E] dark:text-[#F6F1E7]">
            هل تجب عليك الزكاة؟
          </span>
          <span className="text-xs font-semibold block mb-2 text-[#7E8C7F] dark:text-[#A9B7A3]">
            الزكاة المستحقة (2.5%)
          </span>
          <span
            className={`text-3xl font-extrabold font-landing-display ${
              status.tone === 'green'
                ? 'text-[#3C6E47] dark:text-[#6BA06B]'
                : 'text-[#1D211E] dark:text-[#F6F1E7]'
            }`}
          >
            {formatTND(zakatDue)}
          </span>
          <div
            className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
              status.tone === 'green'
                ? 'bg-[#3C6E47]/15 text-[#3C6E47] dark:text-[#6BA06B]'
                : status.tone === 'amber'
                ? 'bg-[#B8893A]/15 text-[#B8893A] dark:text-[#D4A84A]'
                : 'bg-black/5 dark:bg-white/10 text-[#7E8C7F] dark:text-[#A9B7A3]'
            }`}
          >
            {status.tone === 'green' ? (
              <Check className="w-3 h-3" />
            ) : (
              <AlertCircle className="w-3 h-3" />
            )}
            {status.label}
          </div>
          {status.hint && (
            <p className="text-[11px] mt-1.5 text-[#7E8C7F] dark:text-[#A9B7A3]">{status.hint}</p>
          )}

          {/* Net wealth vs Nisab comparison */}
          <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/10 space-y-2">
            <div className="flex justify-between text-[10px]">
              <span className="text-[#7E8C7F] dark:text-[#A9B7A3]">صافي المال الخاضع للزكاة</span>
              <span className="font-bold font-mono text-[#1D211E] dark:text-[#F6F1E7]">{formatTND(netZakatableWealth)}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-[#7E8C7F] dark:text-[#A9B7A3]">النصاب ({config.currentHijriYear} هـ)</span>
              <span className="font-bold font-mono text-[#7E8C7F] dark:text-[#A9B7A3]">{formatTND(config.nisab)}</span>
            </div>
            <div className="pt-1">
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-[#7E8C7F] dark:text-[#A9B7A3]">نسبة الوصول للنصاب</span>
                <span className={`font-bold ${aboveNisab ? 'text-[#3C6E47] dark:text-[#6BA06B]' : 'text-[#B8893A] dark:text-[#D4A84A]'}`}>
                  {Math.min(100, Math.round((netZakatableWealth / config.nisab) * 100))}%
                </span>
              </div>
              <AnimatedProgressBar
                percentage={Math.min(100, (netZakatableWealth / config.nisab) * 100)}
                height="h-1.5"
                barColor={aboveNisab ? 'bg-gradient-to-l from-[#3C6E47] to-[#6BA06B]' : 'bg-gradient-to-l from-[#B8893A] to-[#D4A84A]'}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hawl state — must be explicit, never silently assumed */}
      <div className="p-5 rounded-2xl bg-white/80 dark:bg-[#1F2E24] border border-[#C6A15B]/15 shadow-sm space-y-3">
        <div className="flex items-center gap-1.5">
          <h4 className="text-xs font-bold text-[#1D211E] dark:text-[#F6F1E7]">حولان الحول</h4>
          <button
            type="button"
            onClick={() => setInfoSheet(ZAKAT_INFO_SHEETS.hawl)}
            className="text-[#C6A15B] hover:opacity-80 cursor-pointer"
            aria-label="شرح حولان الحول"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[11px] text-[#7E8C7F] dark:text-[#A9B7A3]">
          هل مرّ حول هجري كامل ({config.hawlMonths} شهرًا قمريًا) على بلوغ المال النصاب؟
        </p>
        <div className="flex gap-2">
          {[
            { v: true, l: 'نعم، مرّ الحول' },
            { v: false, l: 'لا، لم يمضِ الحول' },
          ].map((opt) => (
            <button
              key={String(opt.v)}
              type="button"
              onClick={() => {
                hasUserInteracted.current = true;
                setHawlSatisfied(opt.v);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors border cursor-pointer ${
                hawlSatisfied === opt.v
                  ? 'bg-[#26352A]/10 dark:bg-[#C6A15B]/20 border-[#C6A15B]/40 text-[#1D211E] dark:text-[#F6F1E7]'
                  : 'bg-black/5 dark:bg-white/5 border-transparent text-[#7E8C7F] dark:text-[#A9B7A3]'
              }`}
            >
              {opt.l}
            </button>
          ))}
        </div>
        {!hawlSatisfied && (
          <p className="text-[11px] text-[#B8893A] dark:text-[#D4A84A]">
            طالما لم يكتمل الحول الهجري على المال، لا تُحتسب الزكاة عليه الآن.
          </p>
        )}
      </div>

      {/* Input Fields */}
      <div className="p-5 rounded-2xl bg-white/80 dark:bg-[#1F2E24] border border-[#C6A15B]/15 shadow-sm space-y-4">
        <h4 className="text-xs font-bold text-[#1D211E] dark:text-[#F6F1E7] flex items-center gap-1.5">
          <StarEightPoint size={11} color="#C6A15B" />
          <span>الأموال الخاضعة للحساب ({config.currencySymbol})</span>
          <button
            type="button"
            onClick={() => setInfoSheet(ZAKAT_INFO_SHEETS.assets)}
            className="text-[#C6A15B] hover:opacity-80 cursor-pointer"
            aria-label="شرح الأموال الخاضعة للزكاة"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </h4>

        {/* Number format instruction — keeps the calculator self-explanatory */}
        <div className="rounded-xl bg-[#C6A15B]/10 dark:bg-[#C6A15B]/10 border border-[#C6A15B]/20 px-3 py-2.5 space-y-1">
          <p className="text-[10px] font-bold text-[#1D211E] dark:text-[#F6F1E7]">
            طريقة إدخال المبلغ
          </p>
          <p className="text-[10px] leading-relaxed text-[#7E8C7F] dark:text-[#A9B7A3]">
            أدخل المبلغ بالدينار التونسي. يمكنك كتابة{' '}
            <span className="font-mono font-bold text-[#1D211E] dark:text-[#F6F1E7]" dir="ltr">40 000</span>{' '}
            أو <span className="font-mono font-bold text-[#1D211E] dark:text-[#F6F1E7]" dir="ltr">40,000</span>{' '}
            أو <span className="font-mono font-bold text-[#1D211E] dark:text-[#F6F1E7]" dir="ltr">40000</span>
            {' '}— وستُحتسب تلقائيًا كـ <span className="font-mono font-bold text-[#1D211E] dark:text-[#F6F1E7]" dir="ltr">40 000</span> د.ت.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {renderField('cash', 'النقد والسيولة', 'cash', 'الأموال النقدية التي تملكها حاليًا (النقود في المنزل أو المحفظة).')}
          {renderField('bankAccounts', 'الحسابات البنكية والادخار', 'bankAccounts', 'الأموال الموجودة في حساباتك البنكية والمدخرات.')}
          {renderField('gold', 'قيمة الذهب الحالية', 'gold', 'أدخل القيمة النقدية الحالية للذهب الخاضع للحساب.')}
          {renderField('silver', 'قيمة الفضة الحالية', 'silver', 'أدخل القيمة النقدية الحالية للفضة الخاضعة للحساب.')}
        </div>

        {/* Add asset panel (keeps main view compact) */}
        <button
          type="button"
          onClick={() => setShowAddAsset((s) => !s)}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-[#C6A15B]/35 text-xs font-bold text-[#C6A15B] hover:bg-[#C6A15B]/10 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>إضافة أصل</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${showAddAsset ? 'rotate-180' : ''}`}
          />
        </button>

        <AnimatePresence initial={false}>
          {showAddAsset && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {renderField('investments', 'الاستثمارات', 'investments', 'الأموال المُستثمرة في الأسهم أو الصناديق أو غيرها. قد يختلف حكم الزكاة بحسب نوع الاستثمار.')}
                {renderField('moneyOwed', 'ديون لك / أموال مستحقة لك', 'moneyOwed', 'أموال مستحقة لك من أشخاص آخرين. هذه تُضاف كأصل ولا تُخصم.')}
                {renderField('businessInventory', 'مخزون التجارة', 'businessInventory', 'البضائع المُخزّنة للبيع في النشاط التجاري.')}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Liabilities — always visible, separate from assets */}
        <div className="pt-2 border-t border-[#C6A15B]/10">
          {renderField('liabilities', 'الديون والالتزامات القابلة للخصم', 'liabilities', 'الالتزامات التي يسمح الحكم المعتمد بخصمها من المال الخاضع للزكاة.')}
        </div>
      </div>

      {/* Live calculation breakdown — updates instantly with every input */}
      <div className="p-5 rounded-2xl bg-white/80 dark:bg-[#1F2E24] border border-[#C6A15B]/15 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-[#1D211E] dark:text-[#F6F1E7]">ملخص الحساب</h4>
          <span className="text-[10px] text-[#7E8C7F] dark:text-[#A9B7A3]">{config.currencySymbol}</span>
        </div>

        <ZakatSummaryRow
          label="إجمالي الأموال الخاضعة للزكاة"
          value={formatTND(totalEligibleAssets)}
        />
        <ZakatSummaryRow
          label="الديون والالتزامات القابلة للخصم"
          value={formatTND(liabilities)}
          muted
        />
        <div className="border-t border-dashed border-[#C6A15B]/25 pt-2.5">
          <ZakatSummaryRow
            label="صافي المال الخاضع للزكاة"
            value={formatTND(netZakatableWealth)}
            strong
          />
        </div>
        <ZakatSummaryRow
          label={`النصاب (${config.currentHijriYear} هـ)`}
          value={formatTND(config.nisab)}
          muted
          small
        />

        <div
          className={`pt-2 mt-1 rounded-xl border text-center py-3 ${
            zakatDue > 0
              ? 'bg-[#3C6E47]/10 border-[#3C6E47]/40 dark:bg-[#3C6E47]/20'
              : 'bg-black/5 dark:bg-white/5 border-transparent'
          }`}
        >
          <span className="text-[11px] font-semibold block text-[#7E8C7F] dark:text-[#A9B7A3]">
            الزكاة المستحقة ({config.rate * 100}%)
          </span>
          <span
            className={`text-xl font-extrabold font-landing-display ${
              zakatDue > 0
                ? 'text-[#3C6E47] dark:text-[#6BA06B]'
                : 'text-[#1D211E] dark:text-[#F6F1E7]'
            }`}
          >
            {formatTND(zakatDue)}
          </span>
        </div>
      </div>

      {/* How the calculation works — expandable, keeps main screen clean */}
      <div className="p-5 rounded-2xl bg-white/80 dark:bg-[#1F2E24] border border-[#C6A15B]/15 shadow-sm">
        <button
          type="button"
          onClick={() => setShowExplanation((s) => !s)}
          className="w-full flex items-center justify-between gap-2 cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#1D211E] dark:text-[#F6F1E7]">كيف يتم الحساب؟</span>
            <Info className="w-3.5 h-3.5 text-[#C6A15B]" />
          </span>
          <ChevronDown
            className={`w-4 h-4 text-[#C6A15B] transition-transform ${showExplanation ? 'rotate-180' : ''}`}
          />
        </button>

        <AnimatePresence initial={false}>
          {showExplanation && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-3 space-y-3 text-[11px] text-[#4A584C] dark:text-[#C6CFC0]">
                <p className="leading-relaxed">
                  يجمع التطبيق أموالك الخاضعة للزكاة، يخصم الالتزامات القابلة للخصم، ثم يقارن صافي المال بالنصاب. إذا بلغ النصاب وتحققت بقية الشروط، يُحتسب{' '}
                  <span className="font-bold">{config.rate * 100}%</span> من صافي المال.
                </p>

                <div className="rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-[#C6A15B]/15 p-3 space-y-1">
                  <p className="font-bold text-[#1D211E] dark:text-[#F6F1E7]">مثال (بلغ النصاب):</p>
                  <div className="flex justify-between"><span>إجمالي الأموال</span><span className="font-mono font-bold" dir="ltr">40 000 د.ت</span></div>
                  <div className="flex justify-between"><span>الالتزامات القابلة للخصم</span><span className="font-mono font-bold" dir="ltr">0 د.ت</span></div>
                  <div className="flex justify-between"><span>صافي المال</span><span className="font-mono font-bold" dir="ltr">40 000 د.ت</span></div>
                  <div className="flex justify-between"><span>النصاب</span><span className="font-mono font-bold" dir="ltr">34 369.356 د.ت</span></div>
                  <p className="pt-1 leading-relaxed">بما أن صافي المال بلغ النصاب:</p>
                  <div className="font-mono font-bold text-[#1D211E] dark:text-[#F6F1E7]" dir="ltr">40 000 × 2.5% = 1 000 د.ت</div>
                  <div className="flex justify-between text-xs font-bold text-[#3C6E47] dark:text-[#6BA06B]">
                    <span>الزكاة المستحقة:</span><span className="font-mono" dir="ltr">1 000 د.ت</span>
                  </div>
                </div>

                <div className="rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-[#C6A15B]/15 p-3 space-y-1">
                  <p className="font-bold text-[#1D211E] dark:text-[#F6F1E7]">مثال (دون النصاب):</p>
                  <div className="flex justify-between"><span>صافي المال</span><span className="font-mono font-bold" dir="ltr">786 د.ت</span></div>
                  <div className="flex justify-between"><span>النصاب</span><span className="font-mono font-bold" dir="ltr">34 369.356 د.ت</span></div>
                  <p className="pt-1 leading-relaxed">
                    <span className="font-mono font-bold" dir="ltr">786 &lt; 34 369.356</span>
                    {' '}— لم يبلغ المال النصاب، لذلك:
                  </p>
                  <div className="flex justify-between text-xs font-bold text-[#7E8C7F] dark:text-[#A9B7A3]">
                    <span>الزكاة المستحقة:</span><span className="font-mono" dir="ltr">0 د.ت</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fiqh disclaimer */}
      <div className="p-4 rounded-xl bg-[#F4F1EC] dark:bg-white/5 flex items-start gap-2.5 text-xs text-[#7E8C7F] dark:text-[#A9B7A3] border border-[#C6A15B]/15">
        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-[#C6A15B]" />
        <span>
          هذه الحاسبة أداة مساعدة لتقدير زكاة المال وليست فتوى شرعية. قد تختلف بعض الأحكام المتعلقة ببعض أنواع الأموال والديون والاستثمارات باختلاف الحالة والمذهب. يُنصح بالرجوع إلى جهة علمية موثوقة عند الحاجة.
        </span>
      </div>

      {/* ⓘ Info panel — bottom sheet on mobile, side panel on desktop */}
      <AnimatePresence>
        {infoSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setInfoSheet(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {infoSheet && (
          <motion.div
            dir="rtl"
            initial={{ y: '100%', opacity: 1 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 sm:bottom-16 z-50 mx-auto w-full max-w-md px-3 pb-3 sm:pb-0"
          >
            <div className="rounded-t-3xl sm:rounded-3xl bg-[#FAF8F3] dark:bg-[#1C2820] border border-[#C6A15B]/35 shadow-2xl p-5 space-y-3">
              <div className="w-10 h-1 rounded-full bg-black/20 dark:bg-white/20 mx-auto sm:hidden" />
              <div className="flex items-center justify-between border-b border-[#C6A15B]/15 pb-2">
                <h3 className="text-sm font-bold font-spiritual-serif text-[#1D211E] dark:text-[#F6F1E7]">
                  {infoSheet.title}
                </h3>
                <button
                  type="button"
                  onClick={() => setInfoSheet(null)}
                  className="p-1 rounded-full text-[#7E8C7F] hover:text-black dark:hover:text-white cursor-pointer"
                  aria-label="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs leading-relaxed text-[#4A584C] dark:text-[#C6CFC0] whitespace-pre-line">
                {infoSheet.text}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// MAIN IBADAT PAGE WITH SUB-TABS
// ══════════════════════════════════════════════════════════════════
export const IbadatPage: React.FC = () => {
  const { ibadatSubTab, setIbadatSubTab } = useApp();

  const tabs = [
    { id: 'prayers' as const, label: 'الصلوات الفائتة' },
    { id: 'fasting' as const, label: 'الصيام' },
    { id: 'zakat' as const, label: 'الزكاة' },
  ];

  return (
    <PageTransition className="space-y-6 pb-24 text-right select-none">
      {/* Sub-Tab Navigation Bar */}
      <div className="flex p-1 rounded-2xl bg-white/70 dark:bg-[#1F2E24] border border-[#C6A15B]/20 backdrop-blur-md">
        {tabs.map((tab) => {
          const isActive = ibadatSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setIbadatSubTab(tab.id)}
              className="relative flex-1 py-2.5 lg:py-3 rounded-xl text-xs lg:text-sm font-bold transition-colors cursor-pointer select-none"
              style={{
                color: isActive ? 'var(--qada-primary)' : 'var(--qada-text-muted)',
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="ibadat-subtab-pill"
                  className="absolute inset-0 rounded-xl bg-[#26352A]/10 dark:bg-[#C6A15B]/20 border border-[#C6A15B]/30"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={ibadatSubTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {ibadatSubTab === 'prayers' && <PrayerQadaList />}
          {ibadatSubTab === 'fasting' && <FastingTracker />}
          {ibadatSubTab === 'zakat' && <ZakatCalculator />}
        </motion.div>
      </AnimatePresence>
    </PageTransition>
  );
};
