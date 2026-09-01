import React, { useState } from 'react';
import { Plus, Minus, ArrowLeft, Info, Sparkles, Check, SlidersHorizontal } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateMissedPrayers, createInitialCounters, formatArabicNumber } from '../utils/calculator';
import { PRAYERS_LIST, PrayerCounters, PrayerKey } from '../types';

export const OnboardingPage: React.FC = () => {
  const { completeOnboarding } = useApp();

  const [pubertyAge, setPubertyAge] = useState<number>(14);
  const [currentAge, setCurrentAge] = useState<number>(25);
  const [frequency, setFrequency] = useState<number>(60);
  const [showCustomBreakdown, setShowCustomBreakdown] = useState(false);
  const [customCounts, setCustomCounts] = useState<{ [key in PrayerKey]?: number }>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dynamic live calculation
  const calc = calculateMissedPrayers(pubertyAge, currentAge, frequency);

  const getEffectivePrayerCount = (key: PrayerKey): number => {
    if (customCounts[key] !== undefined) {
      return customCounts[key]!;
    }
    return calc.perPrayer[key];
  };

  const handleCustomCountChange = (key: PrayerKey, val: number) => {
    setCustomCounts((prev) => ({
      ...prev,
      [key]: Math.max(0, Math.floor(val)),
    }));
  };

  const handlePubertyChange = (delta: number) => {
    const next = pubertyAge + delta;
    if (next >= 7 && next < currentAge) {
      setPubertyAge(next);
      setErrorMsg(null);
    } else if (next >= currentAge) {
      setErrorMsg('سن البلوغ يجب أن يكون أقل من العمر الحالي');
    }
  };

  const handleCurrentAgeChange = (delta: number) => {
    const next = currentAge + delta;
    if (next > pubertyAge && next <= 120) {
      setCurrentAge(next);
      setErrorMsg(null);
    } else if (next <= pubertyAge) {
      setErrorMsg('العمر الحالي يجب أن يكون أكبر من سن البلوغ');
    }
  };

  const handleSubmit = async () => {
    if (currentAge <= pubertyAge) {
      setErrorMsg('يجب أن يكون العمر الحالي أكبر من سن البلوغ');
      return;
    }

    if (showCustomBreakdown) {
      const finalCounters: PrayerCounters = {
        fajr: {
          initial: getEffectivePrayerCount('fajr'),
          remaining: getEffectivePrayerCount('fajr'),
          completed: 0,
        },
        dhuhr: {
          initial: getEffectivePrayerCount('dhuhr'),
          remaining: getEffectivePrayerCount('dhuhr'),
          completed: 0,
        },
        asr: {
          initial: getEffectivePrayerCount('asr'),
          remaining: getEffectivePrayerCount('asr'),
          completed: 0,
        },
        maghrib: {
          initial: getEffectivePrayerCount('maghrib'),
          remaining: getEffectivePrayerCount('maghrib'),
          completed: 0,
        },
        isha: {
          initial: getEffectivePrayerCount('isha'),
          remaining: getEffectivePrayerCount('isha'),
          completed: 0,
        },
      };
      await completeOnboarding(pubertyAge, currentAge, frequency, finalCounters);
    } else {
      await completeOnboarding(pubertyAge, currentAge, frequency);
    }
  };

  const totalEffectiveMissed =
    getEffectivePrayerCount('fajr') +
    getEffectivePrayerCount('dhuhr') +
    getEffectivePrayerCount('asr') +
    getEffectivePrayerCount('maghrib') +
    getEffectivePrayerCount('isha');

  return (
    <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#1C1D1A] text-[#2D2D2A] dark:text-[#EAE7E0] pb-12 pt-6 px-4 flex flex-col max-w-md mx-auto relative selection:bg-[#E8E4D9] selection:text-[#2D2D2A]">
      {/* Top Brand Header */}
      <header className="flex items-center justify-between py-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-[#FAF9F5] dark:bg-[#252622] border border-[#E8E4D9] dark:border-[#3D3E37] text-[#5A5A40] dark:text-[#C8C7B9] flex items-center justify-center">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3c-4 4-8 8-8 14a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4c0-6-4-10-8-14z" />
              <path d="M12 3v4" />
            </svg>
          </div>
          <div>
            <span className="font-bold text-lg font-brand-serif text-[#2D2D2A] dark:text-[#EAE7E0]">قضاء</span>
            <span className="text-[11px] text-[#8E8E80] dark:text-[#A6A699] block leading-none">متابعة الصلوات الفائتة</span>
          </div>
        </div>
      </header>

      {/* Main Title Section */}
      <section className="text-center mt-2 mb-6 flex flex-col items-center">
        <div className="w-14 h-14 bg-[#FAF9F5] dark:bg-[#252622] border border-[#E8E4D9] dark:border-[#3D3E37] rounded-full flex items-center justify-center mb-3 text-[#5A5A40] dark:text-[#C8C7B9]">
          <Sparkles className="w-7 h-7" />
        </div>
        <h1 className="font-bold text-2xl font-brand-serif text-[#2D2D2A] dark:text-[#EAE7E0] mb-1">
          إعداد الحساب
        </h1>
        <p className="text-sm text-[#8E8E80] dark:text-[#A6A699] max-w-[280px]">
          أهلاً بك في قضاء. لنبدأ بتقدير عدد الصلوات الفائتة.
        </p>
      </section>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs text-center font-medium">
          {errorMsg}
        </div>
      )}

      {/* Configuration Cards */}
      <div className="flex flex-col gap-4 flex-grow">
        {/* Puberty Age Card */}
        <div className="bg-[#FAF9F5] dark:bg-[#252622] border border-[#E8E4D9] dark:border-[#3D3E37] rounded-[24px] p-5 shadow-[0_4px_16px_rgba(90,90,64,0.04)]">
          <label className="block font-bold text-base text-[#2D2D2A] dark:text-[#EAE7E0] mb-0.5">
            سن البلوغ
          </label>
          <p className="text-xs text-[#8E8E80] dark:text-[#A6A699] mb-3">
            العمر الذي بدأ فيه التكليف الشرعي
          </p>
          <div className="flex items-center justify-between bg-[#F0EEE6] dark:bg-[#1C1D1A] rounded-full p-1.5 border border-[#E8E4D9] dark:border-[#3D3E37]">
            <button
              type="button"
              onClick={() => handlePubertyChange(-1)}
              className="w-11 h-11 rounded-full bg-white dark:bg-[#2A2B26] text-[#5A5A40] dark:text-[#C8C7B9] hover:bg-gray-100 transition-colors flex items-center justify-center shadow-sm"
              aria-label="إنقاص سن البلوغ"
            >
              <Minus className="w-5 h-5" />
            </button>
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-3xl font-brand-serif text-[#5A5A40] dark:text-[#C8C7B9]">
                {pubertyAge}
              </span>
              <span className="text-xs text-[#8E8E80] dark:text-[#A6A699]">سنة</span>
            </div>
            <button
              type="button"
              onClick={() => handlePubertyChange(1)}
              className="w-11 h-11 rounded-full bg-[#5A5A40] dark:bg-[#C8C7B9] text-white dark:text-[#1C1D1A] hover:opacity-90 transition-opacity flex items-center justify-center shadow-sm"
              aria-label="زيادة سن البلوغ"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current Age Card */}
        <div className="bg-[#FAF9F5] dark:bg-[#252622] border border-[#E8E4D9] dark:border-[#3D3E37] rounded-[24px] p-5 shadow-[0_4px_16px_rgba(90,90,64,0.04)]">
          <label className="block font-bold text-base text-[#2D2D2A] dark:text-[#EAE7E0] mb-0.5">
            العمر الحالي
          </label>
          <p className="text-xs text-[#8E8E80] dark:text-[#A6A699] mb-3">
            عمرك في الوقت الحالي
          </p>
          <div className="flex items-center justify-between bg-[#F0EEE6] dark:bg-[#1C1D1A] rounded-full p-1.5 border border-[#E8E4D9] dark:border-[#3D3E37]">
            <button
              type="button"
              onClick={() => handleCurrentAgeChange(-1)}
              className="w-11 h-11 rounded-full bg-white dark:bg-[#2A2B26] text-[#5A5A40] dark:text-[#C8C7B9] hover:bg-gray-100 transition-colors flex items-center justify-center shadow-sm"
              aria-label="إنقاص العمر الحالي"
            >
              <Minus className="w-5 h-5" />
            </button>
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-3xl font-brand-serif text-[#5A5A40] dark:text-[#C8C7B9]">
                {currentAge}
              </span>
              <span className="text-xs text-[#8E8E80] dark:text-[#A6A699]">سنة</span>
            </div>
            <button
              type="button"
              onClick={() => handleCurrentAgeChange(1)}
              className="w-11 h-11 rounded-full bg-[#5A5A40] dark:bg-[#C8C7B9] text-white dark:text-[#1C1D1A] hover:opacity-90 transition-opacity flex items-center justify-center shadow-sm"
              aria-label="زيادة العمر الحالي"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Prayer Frequency Card */}
        <div className="bg-[#FAF9F5] dark:bg-[#252622] border border-[#E8E4D9] dark:border-[#3D3E37] rounded-[24px] p-5 shadow-[0_4px_16px_rgba(90,90,64,0.04)]">
          <div className="flex justify-between items-end mb-2">
            <div>
              <label className="block font-bold text-base text-[#2D2D2A] dark:text-[#EAE7E0] mb-0.5">
                نسبة الصلاة التقريبية
              </label>
              <p className="text-xs text-[#8E8E80] dark:text-[#A6A699]">
                نسبة ما كنت تؤديه من الصلوات في الماضي
              </p>
            </div>
            <div className="text-left">
              <span className="font-bold text-xl font-brand-serif text-[#5A5A40] dark:text-[#C8C7B9]">
                {frequency}%
              </span>
            </div>
          </div>

          <div className="px-1 py-2">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={frequency}
              onChange={(e) => setFrequency(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between font-medium text-[11px] text-[#8E8E80] dark:text-[#A6A699] mt-1">
              <span>0% (لم أصلي)</span>
              <span>50%</span>
              <span>100% (ملتزم تماماً)</span>
            </div>
          </div>

          <p className="text-[11px] text-[#8E8E80] dark:text-[#A6A699] bg-[#F0EEE6] dark:bg-[#1C1D1A] p-2.5 rounded-xl mt-3 leading-relaxed border border-[#E8E4D9] dark:border-[#3D3E37]">
            "هذا تقدير شخصي لعدد الصلوات التي كنت تؤديها خلال هذه الفترة."
          </p>
        </div>

        {/* Dynamic Calculation Live Banner */}
        <div className="bg-[#F0EEE6] dark:bg-[#252622] border border-[#E8E4D9] dark:border-[#3D3E37] rounded-[24px] p-4 text-center">
          <div className="text-xs font-semibold text-[#5A5A40] dark:text-[#C8C7B9] mb-1">
            إجمالي الصلوات المقدرة للفائتة:
          </div>
          <div className="font-bold text-3xl font-brand-serif text-[#5A5A40] dark:text-[#C8C7B9]">
            {formatArabicNumber(totalEffectiveMissed)} صلاة
          </div>
          <div className="text-xs text-[#8E8E80] dark:text-[#A6A699] mt-1">
            {calc.years} سنوات ({formatArabicNumber(calc.days)} يوم) × 5 صلوات يومياً
          </div>

          {/* Toggle manual customization of 5 prayers */}
          <button
            type="button"
            onClick={() => setShowCustomBreakdown(!showCustomBreakdown)}
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#5A5A40] dark:text-[#C8C7B9] font-semibold underline underline-offset-4"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showCustomBreakdown ? 'إخفاء تخصيص الصلوات' : 'تعديل توزيع كل صلاة يدوياً قبل التأكيد'}</span>
          </button>

          {showCustomBreakdown && (
            <div className="mt-3 pt-3 border-t border-[#E8E4D9] dark:border-[#3D3E37] space-y-2 text-right">
              <p className="text-[11px] text-[#8E8E80] dark:text-[#A6A699] text-center mb-2">
                يمكنك كتابة عدد مخصص لكل صلاة إذا كنت تتذكر قضاء بعضها:
              </p>
              {PRAYERS_LIST.map((prayer) => (
                <div
                  key={prayer.key}
                  className="flex items-center justify-between bg-white dark:bg-[#1C1D1A] p-2.5 rounded-xl border border-[#E8E4D9] dark:border-[#3D3E37]"
                >
                  <span className="font-semibold text-xs text-[#2D2D2A] dark:text-[#EAE7E0]">
                    {prayer.arabicName}
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      value={getEffectivePrayerCount(prayer.key)}
                      onChange={(e) => handleCustomCountChange(prayer.key, Number(e.target.value) || 0)}
                      className="w-24 px-2 py-1 bg-[#F0EEE6] dark:bg-[#252622] border border-[#E8E4D9] dark:border-[#3D3E37] rounded-lg text-sm font-bold text-center text-[#5A5A40] dark:text-[#C8C7B9]"
                    />
                    <span className="text-xs text-[#8E8E80] dark:text-[#A6A699]">صلاة</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Button & Religious Disclaimer */}
      <div className="mt-6">
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full bg-[#5A5A40] hover:bg-[#484833] dark:bg-[#C8C7B9] dark:hover:bg-[#B8B7A8] text-white dark:text-[#1C1D1A] font-bold text-base py-4 rounded-full shadow-[0_4px_16px_rgba(90,90,64,0.2)] transition-all active:scale-98 flex items-center justify-center gap-3"
        >
          <span>احسب الصلوات الفائتة وابدأ</span>
          <ArrowLeft className="w-5 h-5" />
        </button>

        <p className="mt-4 text-center text-xs text-[#8E8E80] dark:text-[#A6A699] leading-relaxed flex items-start justify-center gap-1.5 px-2">
          <Info className="w-4 h-4 shrink-0 text-[#5A5A40] dark:text-[#C8C7B9] mt-0.5" />
          <span>
            الأعداد المحسوبة تقديرية لأغراض المتابعة الشخصية، ويُرجى الرجوع إلى عالم موثوق لمعرفة الحكم الشرعي المناسب لحالتك.
          </span>
        </p>
      </div>
    </div>
  );
};
