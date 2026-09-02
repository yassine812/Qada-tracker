import React, { useState } from 'react';
import { Plus, Minus, ArrowLeft, ArrowRight, Info, Sparkles, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateMissedPrayers, createInitialCounters, formatArabicNumber } from '../utils/calculator';
import { Gender } from '../types';

export const OnboardingPage: React.FC = () => {
  const { completeOnboarding, setupIstighfar } = useApp();

  // Step navigation
  const [step, setStep] = useState<number>(1);
  const totalSteps = 4;

  // Step 1: Personal info
  const [userName, setUserName] = useState<string>('');
  const [gender, setGender] = useState<Gender | null>(null);

  // Step 2: Ages
  const [pubertyAge, setPubertyAge] = useState<number>(14);
  const [currentAge, setCurrentAge] = useState<number>(25);

  // Step 3: Prayer frequency + menstruation
  const [frequency, setFrequency] = useState<number>(60);
  const [averageMenstruationDays, setAverageMenstruationDays] = useState<number>(7);

  // Istighfar setup state (shown on summary)
  const [istighfarStartAge, setIstighfarStartAge] = useState<number>(14);
  const [istighfarDailyTarget, setIstighfarDailyTarget] = useState<number>(70);
  const [setupIstighfarNow, setSetupIstighfarNow] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation for step navigation
  const canProceedStep1 = gender !== null;
  const canProceedStep2 = currentAge > pubertyAge && pubertyAge >= 7 && currentAge <= 120;

  // Live calculation for summary
  const calc = gender
    ? calculateMissedPrayers(
        pubertyAge,
        currentAge,
        frequency,
        gender === 'female'
          ? { gender: 'female', menstruationCalculationMode: 'average', averageMenstruationDays }
          : undefined
      )
    : calculateMissedPrayers(pubertyAge, currentAge, frequency);

  const totalEffectiveMissed = calc.estimatedMissed;

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

  const handleNext = () => {
    setErrorMsg(null);
    if (step === 1 && !canProceedStep1) {
      setErrorMsg('يرجى اختيار الجنس للمتابعة');
      return;
    }
    if (step === 2 && !canProceedStep2) {
      setErrorMsg('يجب أن يكون العمر الحالي أكبر من سن البلوغ');
      return;
    }
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (currentAge <= pubertyAge) {
      setErrorMsg('يجب أن يكون العمر الحالي أكبر من سن البلوغ');
      return;
    }

    setIsSubmitting(true);
    try {
      await completeOnboarding(pubertyAge, currentAge, frequency, {
        userName: userName || undefined,
        gender: gender || 'male',
        menstruationCalculationMode: gender === 'female' ? 'average' : undefined,
        averageMenstruationDays: gender === 'female' ? averageMenstruationDays : undefined,
      });

      // Setup istighfar if user chose to
      if (setupIstighfarNow && istighfarStartAge < currentAge) {
        await setupIstighfar(istighfarStartAge, currentAge, istighfarDailyTarget);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepIndicator = (
    <div className="flex items-center justify-center gap-1.5 mb-6">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={`h-1 rounded-full transition-all duration-300 ${
            i + 1 === step
              ? 'w-6 bg-[#5A5A40] dark:bg-[#C8C7B9]'
              : i + 1 < step
              ? 'w-2 bg-[#5A5A40] dark:bg-[#C8C7B9] opacity-50'
              : 'w-2 bg-[#D1CDC2] dark:bg-[#3D3E37]'
          }`}
        />
      ))}
    </div>
  );

  const stepLabel = (
    <p className="text-xs text-[#8E8E80] dark:text-[#A6A699] text-center mb-4">
      الخطوة {step} من {totalSteps}
    </p>
  );

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

      {/* Main Title */}
      <section className="text-center mt-2 mb-4 flex flex-col items-center">
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

      {stepIndicator}
      {stepLabel}

      {errorMsg && (
        <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs text-center font-medium">
          {errorMsg}
        </div>
      )}

      {/* Step Content */}
      <div className="flex flex-col gap-4 flex-grow">
        {/* ===== STEP 1: Personal Info ===== */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-[#FAF9F5] dark:bg-[#252622] border border-[#E8E4D9] dark:border-[#3D3E37] rounded-[24px] p-5 shadow-[0_4px_16px_rgba(90,90,64,0.04)]">
              <label className="block font-bold text-base text-[#2D2D2A] dark:text-[#EAE7E0] mb-0.5">
                الاسم
              </label>
              <p className="text-xs text-[#8E8E80] dark:text-[#A6A699] mb-3">
                اختياري — يمكنك إدخال اسمك الشخصي
              </p>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="اكتب اسمك"
                className="w-full px-4 py-3 bg-[#F0EEE6] dark:bg-[#1C1D1A] border border-[#E8E4D9] dark:border-[#3D3E37] rounded-2xl text-sm font-medium text-[#2D2D2A] dark:text-[#EAE7E0] placeholder:text-[#8E8E80] dark:placeholder:text-[#A6A699] focus:outline-none focus:ring-2 focus:ring-[#5A5A40] transition-all"
                dir="rtl"
              />
            </div>

            <div className="bg-[#FAF9F5] dark:bg-[#252622] border border-[#E8E4D9] dark:border-[#3D3E37] rounded-[24px] p-5 shadow-[0_4px_16px_rgba(90,90,64,0.04)]">
              <label className="block font-bold text-base text-[#2D2D2A] dark:text-[#EAE7E0] mb-0.5">
                الجنس <span className="text-rose-500">*</span>
              </label>
              <p className="text-xs text-[#8E8E80] dark:text-[#A6A699] mb-3">
                يُستخدم فقط لتقدير الصلوات بشكل صحيح
              </p>
              <div className="flex gap-3">
                {([
                  { id: 'male' as Gender, label: 'رجل', icon: '🧑' },
                  { id: 'female' as Gender, label: 'امرأة', icon: '👩' },
                ]).map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => { setGender(g.id); setErrorMsg(null); }}
                    className={`flex-1 py-4 rounded-2xl text-base font-bold transition-all border-2 ${
                      gender === g.id
                        ? 'bg-[#5A5A40] text-white border-[#5A5A40] shadow-md dark:bg-[#C8C7B9] dark:text-[#1C1D1A] dark:border-[#C8C7B9]'
                        : 'bg-white dark:bg-[#1C1D1A] border-[#E8E4D9] dark:border-[#3D3E37] text-[#2D2D2A] dark:text-[#EAE7E0] hover:border-[#5A5A40]/30'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{g.icon}</span>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== STEP 2: Ages ===== */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Puberty Age */}
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

            {/* Current Age */}
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
          </div>
        )}

        {/* ===== STEP 3: Prayer Frequency + Menstruation ===== */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
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
                هذا تقدير شخصي لعدد الصلوات التي كنت تؤديها خلال هذه الفترة.
              </p>
            </div>

            {/* Menstruation Section (women only) */}
            {gender === 'female' && (
              <div className="bg-[#FAF9F5] dark:bg-[#252622] border border-[#E8E4D9] dark:border-[#3D3E37] rounded-[24px] p-5 shadow-[0_4px_16px_rgba(90,90,64,0.04)] animate-in fade-in duration-200">
                <label className="block font-bold text-base text-[#2D2D2A] dark:text-[#EAE7E0] mb-0.5">
                  أيام الحيض
                </label>
                <p className="text-xs text-[#8E8E80] dark:text-[#A6A699] mb-1">
                  يمكنك إدخال تقدير لأيام الحيض التي لم تكن الصلاة مطلوبة فيها، حتى لا تدخل هذه الأيام في حساب الصلوات الفائتة.
                </p>
                <p className="text-[10px] text-[#8E8E80] dark:text-[#A6A699] bg-[#F0EEE6] dark:bg-[#1C1D1A] p-2.5 rounded-xl mb-4 leading-relaxed border border-[#E8E4D9] dark:border-[#3D3E37]">
                  الصلاة لا تُقضى عن أيام الحيض. هذا الحساب تقديري لتنظيم الصلوات التي كانت الصلاة مطلوبة فيها.
                </p>

                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-[#2D2D2A] dark:text-[#EAE7E0]">
                    متوسط عدد أيام الحيض في الشهر
                  </span>
                  <span className="text-sm font-bold font-brand-serif text-[#5A5A40] dark:text-[#C8C7B9]">
                    {averageMenstruationDays} يوم
                  </span>
                </div>
                <div className="flex items-center justify-between bg-[#F0EEE6] dark:bg-[#1C1D1A] rounded-xl p-1.5 border border-[#E8E4D9] dark:border-[#3D3E37]">
                  <button
                    type="button"
                    onClick={() => setAverageMenstruationDays((v) => Math.max(1, v - 1))}
                    className="w-10 h-10 rounded-lg bg-white dark:bg-[#2A2B26] flex items-center justify-center text-[#2D2D2A] dark:text-[#C8C7B9]"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-lg font-brand-serif text-[#5A5A40] dark:text-[#C8C7B9]">
                    {averageMenstruationDays} يوم/شهر
                  </span>
                  <button
                    type="button"
                    onClick={() => setAverageMenstruationDays((v) => Math.min(15, v + 1))}
                    className="w-10 h-10 rounded-lg bg-[#5A5A40] dark:bg-[#C8C7B9] text-white dark:text-[#1C1D1A] flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-[#8E8E80] dark:text-[#A6A699] mt-2 leading-relaxed text-center">
                  تقدير عدد أيام الحيض الشهرية (الحد الأدنى 1، الحد الأقصى 15)
                </p>
              </div>
            )}
          </div>
        )}

        {/* ===== STEP 4: Summary ===== */}
        {step === 4 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Summary Card */}
            <div className="bg-[#FAF9F5] dark:bg-[#252622] border border-[#E8E4D9] dark:border-[#3D3E37] rounded-[24px] p-5 shadow-[0_4px_16px_rgba(90,90,64,0.04)]">
              <h3 className="font-bold text-base text-[#2D2D2A] dark:text-[#EAE7E0] mb-4 text-center">
                ملخص الحساب
              </h3>

              {userName && (
                <div className="text-center text-xs text-[#8E8E80] dark:text-[#A6A699] mb-3">
                  مرحباً {userName}
                </div>
              )}

              {/* Prayer Summary */}
              <div className="bg-[#F0EEE6] dark:bg-[#1C1D1A] p-4 rounded-2xl border border-[#E8E4D9] dark:border-[#3D3E37] mb-3">
                <div className="text-xs font-semibold text-[#5A5A40] dark:text-[#C8C7B9] mb-2 text-center">
                  الصلوات المقدرة الفائتة
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(calc.perPrayer).map(([key, val]) => {
                    const names: Record<string, string> = {
                      fajr: 'الفجر',
                      dhuhr: 'الظهر',
                      asr: 'العصر',
                      maghrib: 'المغرب',
                      isha: 'العشاء',
                    };
                    return (
                      <div key={key} className="flex justify-between bg-white dark:bg-[#252622] px-3 py-2 rounded-xl border border-[#E8E4D9] dark:border-[#3D3E37]">
                        <span className="text-[#2D2D2A] dark:text-[#EAE7E0]">{names[key]}</span>
                        <span className="font-bold text-[#5A5A40] dark:text-[#C8C7B9]">{formatArabicNumber(val)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 pt-3 border-t border-[#E8E4D9] dark:border-[#3D3E37] text-center">
                  <span className="text-xs text-[#8E8E80] dark:text-[#A6A699]">المجموع: </span>
                  <span className="font-bold text-lg font-brand-serif text-[#5A5A40] dark:text-[#C8C7B9]">
                    {formatArabicNumber(totalEffectiveMissed)} صلاة
                  </span>
                </div>
              </div>

              {/* Menstruation exclusion info (women) */}
              {gender === 'female' && calc.menstruationDaysExcluded > 0 && (
                <div className="bg-white dark:bg-[#252622] p-3 rounded-2xl border border-[#E8E4D9] dark:border-[#3D3E37] text-center mb-3">
                  <span className="text-xs text-[#8E8E80] dark:text-[#A6A699]">
                    أيام الحيض المستثناة: <strong className="text-[#5A5A40] dark:text-[#C8C7B9]">{formatArabicNumber(calc.menstruationDaysExcluded)}</strong> يوم
                  </span>
                </div>
              )}

              <div className="text-[10px] text-[#8E8E80] dark:text-[#A6A699] text-center leading-relaxed">
                ({calc.years} سنوات × {formatArabicNumber(calc.days)} يوم
                {gender === 'female' && calc.menstruationDaysExcluded > 0
                  ? ` - ${formatArabicNumber(calc.menstruationDaysExcluded)} حيض`
                  : ''} × 5 صلوات × {100 - frequency}% فائتة)
              </div>
            </div>

            {/* Istighfar Setup Section */}
            <div className="bg-[#FAF9F5] dark:bg-[#252622] border border-[#E8E4D9] dark:border-[#3D3E37] rounded-[24px] p-5 shadow-[0_4px_16px_rgba(90,90,64,0.04)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🤍</span>
                  <span className="font-bold text-sm text-[#2D2D2A] dark:text-[#EAE7E0]">
                    إعداد الاستغفار السابق
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSetupIstighfarNow(!setupIstighfarNow)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    setupIstighfarNow ? 'bg-[#5A5A40]' : 'bg-[#D1CDC2] dark:bg-[#3D3E37]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                      setupIstighfarNow ? 'left-5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              {setupIstighfarNow && (
                <div className="space-y-3 pt-3 border-t border-[#E8E4D9] dark:border-[#3D3E37] animate-in fade-in duration-200">
                  <div>
                    <label className="block text-xs font-semibold text-[#8E8E80] dark:text-[#A6A699] mb-1">
                      متى بدأت تريد الالتزام بالاستغفار؟
                    </label>
                    <div className="flex items-center justify-between bg-[#F0EEE6] dark:bg-[#1C1D1A] rounded-full p-1.5 border border-[#E8E4D9] dark:border-[#3D3E37]">
                      <button
                        type="button"
                        onClick={() => setIstighfarStartAge((v) => Math.max(7, v - 1))}
                        className="w-10 h-10 rounded-full bg-white dark:bg-[#2A2B26] text-[#5A5A40] dark:text-[#C8C7B9] flex items-center justify-center shadow-sm"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <div className="flex items-baseline gap-1">
                        <span className="font-bold text-2xl font-brand-serif text-[#5A5A40] dark:text-[#C8C7B9]">
                          {istighfarStartAge}
                        </span>
                        <span className="text-xs text-[#8E8E80] dark:text-[#A6A699]">سنة</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIstighfarStartAge((v) => Math.min(currentAge - 1, v + 1))}
                        className="w-10 h-10 rounded-full bg-[#5A5A40] dark:bg-[#C8C7B9] text-white dark:text-[#1C1D1A] flex items-center justify-center shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#8E8E80] dark:text-[#A6A699] mb-1">
                      الهدف اليومي
                    </label>
                    <div className="flex items-center justify-between bg-[#F0EEE6] dark:bg-[#1C1D1A] rounded-full p-1.5 border border-[#E8E4D9] dark:border-[#3D3E37]">
                      <button
                        type="button"
                        onClick={() => setIstighfarDailyTarget((v) => Math.max(1, v - 10))}
                        className="w-10 h-10 rounded-full bg-white dark:bg-[#2A2B26] text-[#5A5A40] dark:text-[#C8C7B9] flex items-center justify-center shadow-sm"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <div className="flex items-baseline gap-1">
                        <span className="font-bold text-2xl font-brand-serif text-[#5A5A40] dark:text-[#C8C7B9]">
                          {istighfarDailyTarget}
                        </span>
                        <span className="text-xs text-[#8E8E80] dark:text-[#A6A699]">مرة يومياً</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIstighfarDailyTarget((v) => v + 10)}
                        className="w-10 h-10 rounded-full bg-[#5A5A40] dark:bg-[#C8C7B9] text-white dark:text-[#1C1D1A] flex items-center justify-center shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#F0EEE6] dark:bg-[#1C1D1A] p-3 rounded-2xl border border-[#E8E4D9] dark:border-[#3D3E37] text-center">
                    <div className="text-xs text-[#8E8E80] dark:text-[#A6A699] mb-1">
                      الاستغفار السابق (تقدير شخصي):
                    </div>
                    <div className="font-bold text-xl font-brand-serif text-[#C97C5D]">
                      {formatArabicNumber((currentAge - istighfarStartAge) * 365 * istighfarDailyTarget)} استغفار
                    </div>
                    <div className="text-[11px] text-[#8E8E80] dark:text-[#A6A699] mt-1">
                      ({currentAge - istighfarStartAge} سنوات × 365 يوم × {istighfarDailyTarget} مرة)
                    </div>
                  </div>

                  <p className="text-[10px] text-[#8E8E80] dark:text-[#A6A699] text-center leading-relaxed">
                    هذا تقدير شخصي وليس حكم شرعي. يُرجى الرجوع إلى عالم موثوق لمعرفة الحكم الشرعي المناسب.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="mt-6 space-y-2">
        {step < totalSteps ? (
          <button
            type="button"
            onClick={handleNext}
            className="w-full bg-[#5A5A40] hover:bg-[#484833] dark:bg-[#C8C7B9] dark:hover:bg-[#B8B7A8] text-white dark:text-[#1C1D1A] font-bold text-base py-4 rounded-full shadow-[0_4px_16px_rgba(90,90,64,0.2)] transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
            <span>التالي</span>
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-[#5A5A40] hover:bg-[#484833] dark:bg-[#C8C7B9] dark:hover:bg-[#B8B7A8] text-white dark:text-[#1C1D1A] font-bold text-base py-4 rounded-full shadow-[0_4px_16px_rgba(90,90,64,0.2)] transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-60"
          >
            <span>{isSubmitting ? 'جارٍ الحساب...' : 'احسب الصلوات الفائتة وابدأ'}</span>
            {!isSubmitting && <ArrowLeft className="w-5 h-5" />}
          </button>
        )}

        {step > 1 && (
          <button
            type="button"
            onClick={handleBack}
            className="w-full py-3 text-sm font-semibold text-[#5A5A40] dark:text-[#C8C7B9] hover:opacity-70 transition-opacity flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            <span>السابق</span>
          </button>
        )}

        <p className="mt-2 text-center text-xs text-[#8E8E80] dark:text-[#A6A699] leading-relaxed flex items-start justify-center gap-1.5 px-2">
          <Info className="w-4 h-4 shrink-0 text-[#5A5A40] dark:text-[#C8C7B9] mt-0.5" />
          <span>
            الأعداد المحسوبة تقديرية لأغراض المتابعة الشخصية، ويُرجى الرجوع إلى عالم موثوق لمعرفة الحكم الشرعي المناسب لحالتك.
          </span>
        </p>
      </div>
    </div>
  );
};
