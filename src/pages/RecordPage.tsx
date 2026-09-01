import React, { useState } from 'react';
import { Plus, Minus, Zap, Check, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PRAYERS_LIST, PrayerKey } from '../types';
import { formatArabicNumber } from '../utils/calculator';

export const RecordPage: React.FC = () => {
  const { counters, recordTodayPrayers, recordQuickPrayer, setActiveTab, showToast } = useApp();

  // Multi-prayer state for Section 1: "قضاء اليوم"
  const [dailyCounts, setDailyCounts] = useState<{ [key in PrayerKey]: number }>({
    fajr: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
  });

  // Quick mode state for Section 2: "قضاء سريع"
  const [quickAmount, setQuickAmount] = useState<number | 'custom'>(10);
  const [customQuickAmount, setCustomQuickAmount] = useState<string>('');
  const [quickPrayer, setQuickPrayer] = useState<PrayerKey>('fajr');
  const [isSubmittingDaily, setIsSubmittingDaily] = useState(false);
  const [isSubmittingQuick, setIsSubmittingQuick] = useState(false);

  if (!counters) return null;

  const totalDaily: number = (dailyCounts.fajr || 0) +
    (dailyCounts.dhuhr || 0) +
    (dailyCounts.asr || 0) +
    (dailyCounts.maghrib || 0) +
    (dailyCounts.isha || 0);

  const handleStep = (key: PrayerKey, delta: number) => {
    const current = dailyCounts[key] || 0;
    const remaining = counters[key].remaining;
    const next = Math.max(0, current + delta);

    if (next > remaining) {
      return;
    }
    setDailyCounts((prev) => ({
      ...prev,
      [key]: next,
    }));
  };

  const handleDailySubmit = async () => {
    if (totalDaily === 0) return;
    setIsSubmittingDaily(true);
    const success = await recordTodayPrayers(dailyCounts);
    setIsSubmittingDaily(false);
    if (success) {
      setDailyCounts({
        fajr: 0,
        dhuhr: 0,
        asr: 0,
        maghrib: 0,
        isha: 0,
      });
      setActiveTab('dashboard');
    }
  };

  const handleQuickSubmit = async () => {
    let amount = 0;
    if (quickAmount === 'custom') {
      const parsed = Number(customQuickAmount.trim());
      if (isNaN(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
        showToast('يرجى إدخال عدد صحيح موجب بدون كسور', 'error');
        return;
      }
      amount = parsed;
    } else {
      amount = quickAmount;
    }

    if (amount <= 0) return;
    setIsSubmittingQuick(true);
    const success = await recordQuickPrayer(quickPrayer, amount);
    setIsSubmittingQuick(false);
    if (success) {
      if (quickAmount === 'custom') setCustomQuickAmount('');
      setActiveTab('dashboard');
    }
  };

  const effectiveQuickAmount =
    quickAmount === 'custom'
      ? (Number.isInteger(Number(customQuickAmount.trim())) && Number(customQuickAmount.trim()) > 0
          ? Number(customQuickAmount.trim())
          : 0)
      : quickAmount;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10">
      {/* SECTION 1: TODAY'S RECORDING */}
      <section className="space-y-4">
        <div className="flex justify-between items-baseline px-1">
          <div>
            <h2 className="font-bold text-xl text-[#2D2D2A] dark:text-[#EAE7E0]">
              تسجيل قضاء اليوم
            </h2>
            <p className="text-xs text-[#8E8E80] dark:text-[#A6A699] mt-0.5">
              سجل الصلوات التي قضيتها اليوم
            </p>
          </div>
          {totalDaily > 0 && (
            <span className="px-3 py-1 bg-[#F0EEE6] dark:bg-[#2A2B26] border border-[#E8E4D9] dark:border-[#3D3E37] text-[#5A5A40] dark:text-[#C8C7B9] text-xs font-bold rounded-full">
              المجموع: {totalDaily}
            </span>
          )}
        </div>

        <div className="space-y-3">
          {PRAYERS_LIST.map((prayer) => {
            const count = dailyCounts[prayer.key] || 0;
            const remaining = counters[prayer.key].remaining;
            const isCompleted = remaining === 0;

            return (
              <div
                key={prayer.key}
                className={`bg-[#FAF9F5] dark:bg-[#252622] rounded-[24px] p-4 flex items-center justify-between border transition-all ${
                  count > 0
                    ? 'border-[#5A5A40] dark:border-[#C8C7B9] shadow-[0_4px_16px_rgba(90,90,64,0.08)]'
                    : 'border-[#E8E4D9] dark:border-[#3D3E37] shadow-[0_2px_10px_rgba(0,0,0,0.02)]'
                } ${isCompleted ? 'opacity-50' : ''}`}
              >
                <div>
                  <h3 className="font-bold text-base text-[#2D2D2A] dark:text-[#EAE7E0]">
                    {prayer.arabicName}
                  </h3>
                  <p className="text-xs text-[#8E8E80] dark:text-[#A6A699]">
                    {isCompleted
                      ? 'مكتمل بالكامل ✓'
                      : `المتبقي: ${formatArabicNumber(remaining)}`}
                  </p>
                </div>

                {/* Counter Stepper [-] [number] [+] */}
                <div className="flex items-center gap-3 bg-[#F0EEE6] dark:bg-[#1C1D1A] rounded-full px-3 py-1.5 border border-[#E8E4D9] dark:border-[#3D3E37]">
                  <button
                    type="button"
                    onClick={() => handleStep(prayer.key, -1)}
                    disabled={count === 0 || isCompleted}
                    aria-label={`إنقاص ${prayer.arabicName}`}
                    className="w-8 h-8 rounded-full bg-white dark:bg-[#252622] text-[#5A5A40] dark:text-[#C8C7B9] disabled:opacity-30 hover:bg-[#EAE7E0] flex items-center justify-center transition-all active:scale-90 shadow-xs"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <span
                    className={`font-bold text-2xl min-w-[32px] text-center leading-none font-brand-serif ${
                      count > 0
                        ? 'text-[#5A5A40] dark:text-[#C8C7B9]'
                        : 'text-[#8E8E80] dark:text-[#A6A699]'
                    }`}
                  >
                    {count}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleStep(prayer.key, 1)}
                    disabled={count >= remaining || isCompleted}
                    aria-label={`زيادة ${prayer.arabicName}`}
                    className="w-8 h-8 rounded-full bg-[#5A5A40] text-white dark:bg-[#C8C7B9] dark:text-[#1C1D1A] disabled:opacity-30 hover:opacity-90 flex items-center justify-center transition-all active:scale-90 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleDailySubmit}
          disabled={totalDaily === 0 || isSubmittingDaily}
          className="w-full bg-[#C97C5D] hover:bg-[#b86e51] disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-base py-4 rounded-full shadow-[0_8px_20px_-6px_rgba(201,124,93,0.4)] transition-all active:scale-98 flex items-center justify-center gap-2 mt-2"
        >
          <Check className="w-5 h-5 stroke-[2.5]" />
          <span>
            {totalDaily > 0
              ? `تسجيل الصلوات (إجمالي اليوم: ${totalDaily})`
              : 'تسجيل الصلوات'}
          </span>
        </button>
      </section>

      {/* SECTION 2: QUICK RECORDING (قضاء سريع) */}
      <section className="bg-[#FAF9F5] dark:bg-[#252622] rounded-[28px] p-5 space-y-4 border border-[#E8E4D9] dark:border-[#3D3E37] shadow-[0_4px_16px_rgba(90,90,64,0.04)]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#C97C5D]/15 text-[#C97C5D] flex items-center justify-center">
            <Zap className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[#2D2D2A] dark:text-[#EAE7E0]">
              قضاء سريع
            </h3>
            <p className="text-[11px] text-[#8E8E80] dark:text-[#A6A699]">
              تسجيل عدد محدد لصلاة معينة بضغطة واحدة
            </p>
          </div>
        </div>

        {/* Count Selection */}
        <div>
          <span className="block text-xs font-semibold text-[#8E8E80] dark:text-[#A6A699] mb-2">
            العدد:
          </span>
          <div className="flex flex-wrap gap-2">
            {[5, 10, 15, 20].map((num) => {
              const isSelected = quickAmount === num;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => setQuickAmount(num)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                    isSelected
                      ? 'bg-[#5A5A40] text-white shadow-sm scale-105'
                      : 'bg-[#F0EEE6] dark:bg-[#1C1D1A] border border-[#E8E4D9] dark:border-[#3D3E37] text-[#2D2D2A] dark:text-[#EAE7E0] hover:bg-[#EAE7E0] dark:hover:bg-[#2A2B26]'
                  }`}
                >
                  {num}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setQuickAmount('custom')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                quickAmount === 'custom'
                  ? 'bg-[#5A5A40] text-white shadow-sm'
                  : 'bg-[#F0EEE6] dark:bg-[#1C1D1A] border border-[#E8E4D9] dark:border-[#3D3E37] text-[#2D2D2A] dark:text-[#EAE7E0]'
              }`}
            >
              مخصص
            </button>
          </div>

          {quickAmount === 'custom' && (
            <div className="mt-2.5">
              <input
                type="number"
                min="1"
                placeholder="أدخل عدد الصلوات المخصصة"
                value={customQuickAmount}
                onChange={(e) => setCustomQuickAmount(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-[#1C1D1A] border border-[#D1CDC2] dark:border-[#3D3E37] rounded-xl text-sm font-bold text-center text-[#2D2D2A] dark:text-[#EAE7E0] focus:outline-none focus:border-[#5A5A40]"
              />
            </div>
          )}
        </div>

        {/* Prayer Selection */}
        <div>
          <span className="block text-xs font-semibold text-[#8E8E80] dark:text-[#A6A699] mb-2">
            اختر الصلاة:
          </span>
          <div className="flex flex-wrap gap-2">
            {PRAYERS_LIST.map((prayer) => {
              const isSelected = quickPrayer === prayer.key;
              const remaining = counters[prayer.key].remaining;
              const isZero = remaining === 0;

              return (
                <button
                  key={prayer.key}
                  type="button"
                  disabled={isZero}
                  onClick={() => setQuickPrayer(prayer.key)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-[#5A5A40] text-white shadow-sm'
                      : 'bg-[#F0EEE6] dark:bg-[#1C1D1A] border border-[#E8E4D9] dark:border-[#3D3E37] text-[#2D2D2A] dark:text-[#EAE7E0] hover:bg-[#EAE7E0] dark:hover:bg-[#2A2B26]'
                  } ${isZero ? 'opacity-40 line-through' : ''}`}
                >
                  {prayer.arabicName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Submit Button */}
        <button
          type="button"
          onClick={handleQuickSubmit}
          disabled={effectiveQuickAmount <= 0 || isSubmittingQuick}
          className="w-full bg-[#5A5A40] hover:bg-[#4A4A33] dark:bg-[#C8C7B9] dark:hover:bg-[#b0afa0] dark:text-[#1C1D1A] text-white font-bold text-sm py-3.5 rounded-full transition-all active:scale-98 disabled:opacity-40 shadow-xs"
        >
          {effectiveQuickAmount > 0
            ? `تأكيد قضاء ${effectiveQuickAmount} صلوات ${
                PRAYERS_LIST.find((p) => p.key === quickPrayer)?.arabicName
              }`
            : 'تأكيد القضاء السريع'}
        </button>
      </section>
    </div>
  );
};
