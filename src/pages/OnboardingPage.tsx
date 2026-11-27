import React, { useState } from 'react';
import { Plus, Minus, ArrowLeft, ArrowRight, Info, Sparkles, Check, Calculator, BarChart3, CalendarDays, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { calculateMissedPrayers, calculateMissedPrayersForDays, createInitialCounters, formatArabicNumber } from '../utils/calculator';
import { CalculationMethod, ExactPeriodSettings, Gender } from '../types';
import { PageTransition, TactileButton } from '../components/ui/MotionPrimitives';
import { StarEightPoint } from '../components/landing/IslamicOrnaments';
import { PersonalizedWelcomeScreen } from '../components/onboarding/PersonalizedWelcomeScreen';

export const OnboardingPage: React.FC = () => {
  const { completeOnboarding, setupIstighfar } = useApp();

  // Intro & Name flow
  const [introPhase, setIntroPhase] = useState<'name_input' | 'welcome' | 'questions'>('name_input');

  // Step navigation
  const [step, setStep] = useState<number>(1);
  const totalSteps = 4;

  // Step 1: Personal info
  const [userName, setUserName] = useState<string>('');
  const [gender, setGender] = useState<Gender | null>(null);

  // Prayer calculation method is selected immediately after the name.
  const [calculationMethod, setCalculationMethod] = useState<CalculationMethod | null>(null);
  const [exactInputMode, setExactInputMode] = useState<'duration' | 'dates'>('duration');
  const [exactAmount, setExactAmount] = useState<number>(2);
  const [exactUnit, setExactUnit] = useState<NonNullable<ExactPeriodSettings['unit']>>('months');
  const [exactStartDate, setExactStartDate] = useState('');
  const [exactEndDate, setExactEndDate] = useState('');

  // Step 2: Ages
  const [pubertyAge, setPubertyAge] = useState<number>(14);
  const [currentAge, setCurrentAge] = useState<number>(25);

  // Step 3: Prayer frequency + menstruation
  const [frequency, setFrequency] = useState<number>(60);
  const [averageMenstruationDays, setAverageMenstruationDays] = useState<number>(7);

  // Istighfar setup state (shown on summary)
  const [istighfarStartAge, setIstighfarStartAge] = useState<number>(14);
  const [istighfarDailyTarget, setIstighfarDailyTarget] = useState<number>(70);
  const [istighfarEstimatedPreviousDaily, setIstighfarEstimatedPreviousDaily] = useState<number>(0);
  const [istighfarTrackedYears, setIstighfarTrackedYears] = useState<number>(0);
  const [setupIstighfarNow, setSetupIstighfarNow] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation for step navigation
  const canProceedStep1 = gender !== null && calculationMethod !== null;
  const canProceedStep2 = calculationMethod === 'exact_period'
    ? (exactInputMode === 'duration' ? exactAmount > 0 : !!exactStartDate && !!exactEndDate && exactEndDate >= exactStartDate)
    : currentAge > pubertyAge && pubertyAge >= 7 && currentAge <= 120;

  // Live calculation for summary
  const exactDays = exactInputMode === 'duration'
    ? Math.round(exactAmount * (exactUnit === 'weeks' ? 7 : exactUnit === 'months' ? 30 : exactUnit === 'years' ? 365 : 1))
    : (exactStartDate && exactEndDate ? Math.max(0, Math.floor((new Date(`${exactEndDate}T00:00:00Z`).getTime() - new Date(`${exactStartDate}T00:00:00Z`).getTime()) / 86400000) + 1) : 0);
  const calc = calculationMethod === 'exact_period'
    ? calculateMissedPrayersForDays(exactDays, 0)
    : calculateMissedPrayers(
        pubertyAge,
        currentAge,
        frequency,
        gender === 'female'
          ? { gender: 'female', menstruationCalculationMode: 'average', averageMenstruationDays }
          : undefined
      );

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
      setErrorMsg(calculationMethod ? 'يرجى اختيار الجنس للمتابعة' : 'يرجى اختيار طريقة حساب الصلوات أولاً');
      return;
    }
    if (step === 2 && !canProceedStep2) {
      setErrorMsg(calculationMethod === 'exact_period' ? 'يرجى إدخال مدة أو تاريخ فترة صحيح' : 'يجب أن يكون العمر الحالي أكبر من سن البلوغ');
      return;
    }
    if (step < totalSteps) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (step === 1) {
      setIntroPhase('name_input');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (calculationMethod !== 'exact_period' && currentAge <= pubertyAge) {
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
        calculationMethod: calculationMethod || 'age_estimate',
        exactPeriod: calculationMethod === 'exact_period' ? {
          mode: exactInputMode,
          amount: exactInputMode === 'duration' ? exactAmount : undefined,
          unit: exactInputMode === 'duration' ? exactUnit : undefined,
          startDate: exactInputMode === 'dates' ? exactStartDate : undefined,
          endDate: exactInputMode === 'dates' ? exactEndDate : undefined,
        } : undefined,
      });

      // Setup istighfar if user chose to
      if (setupIstighfarNow && istighfarStartAge < currentAge) {
        await setupIstighfar(
          istighfarStartAge,
          currentAge,
          istighfarDailyTarget,
          {
            estimatedPreviousDaily: istighfarEstimatedPreviousDaily,
            trackedYears: istighfarTrackedYears || currentAge - istighfarStartAge,
          }
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (introPhase === 'name_input') {
    return (
      <div className="qada-onboarding-page min-h-screen bg-[#FAF7F2] dark:bg-[#18231C] text-[#1D211E] dark:text-[#F6F1E7] pb-12 pt-6 px-4 flex flex-col justify-between max-w-md mx-auto relative select-none" dir="rtl">
        {/* Top Brand Header */}
        <header className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#26352A]/10 dark:bg-[#C6A15B]/15 border border-[#C6A15B]/30 flex items-center justify-center text-[#C6A15B]">
              <StarEightPoint size={14} color="#C6A15B" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-lg font-landing-display tracking-tight text-[#1D211E] dark:text-[#F6F1E7]">
                قضاء
              </span>
              <span className="text-[9px] uppercase tracking-widest text-[#7E8C7F] dark:text-[#A9B7A3] font-mono">
                QADA
              </span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#C6A15B]/10 border border-[#C6A15B]/20 text-[11px] font-semibold text-[#C6A15B]">
            الترحيب المبارك
          </span>
        </header>

        {/* Center Card */}
        <div className="my-auto py-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-3xl bg-[#C6A15B]/10 border border-[#C6A15B]/30 mx-auto mb-4 flex items-center justify-center text-[#C6A15B] shadow-inner">
              <StarEightPoint size={28} color="#C6A15B" />
            </div>
            <h1 className="font-bold text-2xl sm:text-3xl font-landing-display text-[#1D211E] dark:text-[#F6F1E7] mb-2">
              ما اسمك الكريم؟
            </h1>
            <p className="text-xs sm:text-sm text-[#7E8C7F] dark:text-[#A9B7A3] max-w-xs mx-auto">
              يسعدنا أن نرحب بك شخصيًا ونرافقك في مسيرتك المباركة لإبراء الذمة
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1F2E24] border border-[#C6A15B]/25 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#1D211E] dark:text-[#F6F1E7] mb-2">
                اسمك
              </label>
              <input
                type="text"
                autoFocus
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIntroPhase('questions');
                    setStep(1);
                  }
                }}
                placeholder="اكتب اسمك الكريم (مثال: ياسين، إبراهيم...)"
                className="w-full px-4 py-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-[#C6A15B]/25 text-base font-bold text-[#1D211E] dark:text-[#F6F1E7] focus:outline-none focus:border-[#C6A15B] transition-colors text-center"
              />
            </div>

            {/* Quick Suggestions Pills */}
            <div className="pt-1">
              <span className="text-[11px] text-[#7E8C7F] dark:text-[#A9B7A3] block mb-2 text-center">
                أو اختر اسمًا للتجربة:
              </span>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {['ياسين', 'إبراهيم', 'عمر', 'مريم', 'محمد'].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setUserName(n)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      userName === n
                        ? 'bg-[#C6A15B] text-[#18231C] font-bold shadow-sm'
                        : 'bg-black/5 dark:bg-white/5 text-[#5A685B] dark:text-[#A9B7A3] hover:bg-[#C6A15B]/15 hover:text-[#C6A15B]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="space-y-2 pt-4">
          <TactileButton
            onClick={() => { setIntroPhase('questions'); setStep(1); }}
            className="w-full py-4 rounded-full bg-[#26352A] dark:bg-[#C6A15B] text-[#F6F1E7] dark:text-[#18231C] font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:opacity-95 cursor-pointer"
          >
            <span>متابعة</span>
            <ArrowLeft className="w-4 h-4 rtl:rotate-0" />
          </TactileButton>

          <button
            type="button"
            onClick={() => {
              setUserName('');
              setIntroPhase('questions');
              setStep(1);
            }}
            className="w-full py-2.5 text-xs font-semibold text-[#7E8C7F] dark:text-[#A9B7A3] hover:text-[#1D211E] dark:hover:text-[#F6F1E7] text-center cursor-pointer"
          >
            المتابعة بدون اسم
          </button>
        </div>
      </div>
    );
  }

  if (introPhase === 'welcome') {
    return (
      <PersonalizedWelcomeScreen
        userName={userName}
        gender={gender}
        onContinue={() => {
          setIntroPhase('questions');
          setStep(1);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    );
  }

  return (
    <div className="qada-onboarding-page min-h-screen bg-[#FAF7F2] dark:bg-[#18231C] text-[#1D211E] dark:text-[#F6F1E7] pb-12 pt-6 px-4 flex flex-col max-w-md mx-auto relative select-none" dir="rtl">
      {/* Top Brand Header */}
      <header className="flex items-center justify-between py-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#26352A]/10 dark:bg-[#C6A15B]/15 border border-[#C6A15B]/30 flex items-center justify-center text-[#C6A15B]">
            <StarEightPoint size={14} color="#C6A15B" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-lg font-landing-display tracking-tight text-[#1D211E] dark:text-[#F6F1E7]">
              قضاء
            </span>
            <span className="text-[9px] uppercase tracking-widest text-[#7E8C7F] dark:text-[#A9B7A3] font-mono">
              QADA
            </span>
          </div>
        </div>

        <span className="text-xs text-[#7E8C7F] dark:text-[#A9B7A3] font-semibold">
          الخطوة {step} من {totalSteps}
        </span>
      </header>

      {/* Step Progress Line */}
      <div className="flex items-center gap-2 mb-6">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 flex-1 ${
              i + 1 <= step ? 'bg-[#C6A15B]' : 'bg-black/10 dark:bg-white/10'
            }`}
          />
        ))}
      </div>

      {/* Page Title */}
      <div className="text-center mb-6">
        <h1 className="font-bold text-2xl font-landing-display text-[#1D211E] dark:text-[#F6F1E7] mb-1">
          {step === 1 && 'كيف تريد حساب الصلوات الفائتة؟'}
          {step === 2 && 'تفاصيل طريقة الحساب'}
          {step === 3 && 'الاستثناءات الشرعية'}
          {step === 4 && 'ملخص الحساب التقديري'}
        </h1>
        <p className="text-xs text-[#7E8C7F] dark:text-[#A9B7A3]">
          {step === 1 && 'اختر طريقة واحدة قبل المتابعة'}
          {step === 2 && 'ستظهر هنا الحقول المناسبة لاختيارك'}
          {step === 3 && 'تُستثنى أيام العذر الشرعي من الحساب'}
          {step === 4 && 'النتيجة التقديرية لبدء رحلة القضاء المنظمة'}
        </p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-2xl bg-[#9E3A3A]/10 border border-[#9E3A3A]/30 text-[#9E3A3A] text-xs text-center font-medium">
          {errorMsg}
        </div>
      )}

      {/* Step Content */}
      <div className="flex-grow">
        <AnimatePresence mode="wait">
          {/* ===== STEP 1: Personal Info & Gender ===== */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {/* Calculation method — first question after the name */}
              <div className="p-5 rounded-3xl bg-white dark:bg-[#1F2E24] border border-[#C6A15B]/20 shadow-sm space-y-3">
                <div>
                  <label className="block text-sm font-bold text-[#1D211E] dark:text-[#F6F1E7]">طريقة تقدير الصلوات</label>
                  <p className="text-[11px] text-[#7E8C7F] dark:text-[#A9B7A3] mt-1">اختر الطريقة الأقرب إلى حالتك</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'age_estimate' as CalculationMethod, label: 'تقدير بالعمر', desc: 'لا أعرف الفترة بدقة', Icon: Calculator },
                    { id: 'percentage_estimate' as CalculationMethod, label: 'تقدير بالنسبة', desc: 'أعرف نسبة أدائي', Icon: BarChart3 },
                    { id: 'exact_period' as CalculationMethod, label: 'فترة محددة', desc: 'أعرف الفترة بالضبط', Icon: CalendarDays },
                  ].map((method) => {
                    const selected = calculationMethod === method.id;
                    return <button key={method.id} type="button" onClick={() => { setCalculationMethod(method.id); setErrorMsg(null); }} className={`relative min-h-[112px] rounded-2xl border p-2 flex flex-col items-center justify-center gap-1 text-center transition-all ${selected ? 'bg-[#26352A] dark:bg-[#C6A15B] text-[#F6F1E7] dark:text-[#18231C] border-[#C6A15B] shadow-md' : 'bg-black/5 dark:bg-white/5 border-transparent text-[#1D211E] dark:text-[#F6F1E7] hover:border-[#C6A15B]/40'}`}>
                      {selected && <CheckCircle2 className="absolute top-2 left-2 w-4 h-4 text-[#C6A15B] dark:text-[#18231C]" />}
                      <method.Icon className="w-6 h-6 text-[#C6A15B] dark:text-current" />
                      <span className="text-xs font-bold leading-tight">{method.label}</span>
                      <span className={`text-[9px] leading-tight ${selected ? 'opacity-80' : 'text-[#7E8C7F] dark:text-[#A9B7A3]'}`}>{method.desc}</span>
                    </button>;
                  })}
                </div>
              </div>

              {/* Registered Name Badge with Quick Edit */}
              <div className="p-4 rounded-3xl bg-white dark:bg-[#1F2E24] border border-[#C6A15B]/20 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#C6A15B] block">
                    اسمك المسجل
                  </span>
                  <p className="text-sm font-bold text-[#1D211E] dark:text-[#F6F1E7]">
                    {userName ? `يا ${userName} 🌿` : 'ضيف كريم 🌿'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIntroPhase('name_input')}
                  className="px-3 py-1.5 rounded-full bg-[#C6A15B]/10 hover:bg-[#C6A15B]/20 text-xs font-bold text-[#C6A15B] border border-[#C6A15B]/20 transition-all cursor-pointer"
                >
                  تعديل الاسم
                </button>
              </div>

              {/* Gender Selection */}
              <div className="p-5 rounded-3xl bg-white dark:bg-[#1F2E24] border border-[#C6A15B]/20 shadow-sm space-y-3">
                <label className="block text-xs font-bold text-[#1D211E] dark:text-[#F6F1E7]">
                  الجنس <span className="text-[#9E3A3A]">*</span>
                </label>
                <p className="text-[11px] text-[#7E8C7F] dark:text-[#A9B7A3]">
                  ضروري لمراعاة فترات العذر الشرعي للنساء في الحساب
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'male' as Gender, label: 'رجل' },
                    { id: 'female' as Gender, label: 'امرأة' },
                  ].map((g) => {
                    const isSelected = gender === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          setGender(g.id);
                          setErrorMsg(null);
                        }}
                        className={`py-4 rounded-2xl text-sm font-bold transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-[#26352A] text-[#F6F1E7] dark:bg-[#C6A15B] dark:text-[#18231C] border-[#C6A15B] shadow-sm'
                            : 'bg-black/5 dark:bg-white/5 text-[#1D211E] dark:text-[#F6F1E7] border-transparent hover:border-[#C6A15B]/30'
                        }`}
                      >
                        {g.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== STEP 2: Ages ===== */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {calculationMethod === 'exact_period' ? (
                <div className="overflow-hidden rounded-[2rem] border border-[#C6A15B]/25 bg-gradient-to-br from-white to-[#F8F3EA] shadow-[0_12px_35px_rgba(39,55,43,0.08)] dark:from-[#26352A] dark:to-[#1F2E24] dark:shadow-black/20">
                  <div className="flex items-start justify-between gap-3 border-b border-[#C6A15B]/15 px-5 pb-4 pt-5">
                    <div className="flex items-center gap-3 text-right">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#26352A] text-[#C6A15B] shadow-sm dark:bg-[#C6A15B] dark:text-[#18231C]">
                        <CalendarDays className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-extrabold text-[#1D211E] dark:text-[#F6F1E7]">الفترة التي تريد حسابها</h2>
                        <p className="mt-1 text-[11px] text-[#7E8C7F] dark:text-[#A9B7A3]">اختر طريقة إدخال الفترة التي تتذكرها</p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#C6A15B]/12 px-2.5 py-1 text-[10px] font-bold text-[#947435] dark:bg-[#C6A15B]/15 dark:text-[#D8B66C]">٥ صلوات / يوم</span>
                  </div>

                  <div className="space-y-5 p-5">
                    <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-[#1D211E]/[0.06] p-1 dark:bg-white/[0.06]">
                      {[{ id: 'duration' as const, label: 'بالمدة', icon: '⌛' }, { id: 'dates' as const, label: 'بالتاريخ', icon: '◷' }].map((option) => {
                        const selected = exactInputMode === option.id;
                        return (
                          <button key={option.id} type="button" onClick={() => setExactInputMode(option.id)} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-extrabold transition-all ${selected ? 'bg-[#26352A] text-[#F6F1E7] shadow-md dark:bg-[#C6A15B] dark:text-[#18231C]' : 'text-[#7E8C7F] hover:bg-white/70 dark:text-[#A9B7A3] dark:hover:bg-white/10'}`}>
                            <span aria-hidden="true" className="text-sm opacity-80">{option.icon}</span>
                            {option.label}
                          </button>
                        );
                      })}
                    </div>

                    {exactInputMode === 'duration' ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-bold text-[#1D211E] dark:text-[#F6F1E7]">مدة الفترة التي لم تصلِّ فيها</label>
                          <p className="mt-1 text-[11px] text-[#7E8C7F] dark:text-[#A9B7A3]">أدخل قيمة تقريبية ثم اختر الوحدة</p>
                        </div>
                        <div className="grid grid-cols-[0.85fr_1.15fr] gap-3">
                          <label className="relative block">
                            <span className="sr-only">عدد الوحدات</span>
                            <input type="number" min="1" inputMode="numeric" value={exactAmount} onChange={(e) => setExactAmount(Math.max(0, Number(e.target.value) || 0))} className="h-14 w-full rounded-2xl border border-[#C6A15B]/25 bg-white px-4 text-center text-xl font-extrabold text-[#1D211E] outline-none transition focus:border-[#C6A15B] focus:ring-2 focus:ring-[#C6A15B]/15 dark:bg-[#18231C] dark:text-[#F6F1E7]" />
                          </label>
                          <label className="relative block">
                            <span className="sr-only">وحدة المدة</span>
                            <select value={exactUnit} onChange={(e) => setExactUnit(e.target.value as typeof exactUnit)} className="h-14 w-full appearance-none rounded-2xl border border-[#C6A15B]/25 bg-white px-4 text-right text-base font-bold text-[#1D211E] outline-none transition focus:border-[#C6A15B] focus:ring-2 focus:ring-[#C6A15B]/15 dark:bg-[#18231C] dark:text-[#F6F1E7]">
                              <option value="days">أيام</option>
                              <option value="weeks">أسابيع</option>
                              <option value="months">أشهر</option>
                              <option value="years">سنوات</option>
                            </select>
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-bold text-[#1D211E] dark:text-[#F6F1E7]">حدد بداية ونهاية الفترة</label>
                          <p className="mt-1 text-[11px] text-[#7E8C7F] dark:text-[#A9B7A3]">سيُحسب اليومان ضمن المدة</p>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <label className="space-y-2 text-xs font-bold text-[#1D211E] dark:text-[#F6F1E7]"><span>تاريخ البداية</span><input type="date" value={exactStartDate} onChange={(e) => setExactStartDate(e.target.value)} className="h-14 w-full rounded-2xl border border-[#C6A15B]/25 bg-white px-3 text-sm font-semibold outline-none transition focus:border-[#C6A15B] focus:ring-2 focus:ring-[#C6A15B]/15 dark:bg-[#18231C] dark:text-[#F6F1E7]" /></label>
                          <label className="space-y-2 text-xs font-bold text-[#1D211E] dark:text-[#F6F1E7]"><span>تاريخ النهاية</span><input type="date" value={exactEndDate} onChange={(e) => setExactEndDate(e.target.value)} className="h-14 w-full rounded-2xl border border-[#C6A15B]/25 bg-white px-3 text-sm font-semibold outline-none transition focus:border-[#C6A15B] focus:ring-2 focus:ring-[#C6A15B]/15 dark:bg-[#18231C] dark:text-[#F6F1E7]" /></label>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#C6A15B]/15 bg-[#C6A15B]/[0.08] px-4 py-3">
                      <div className="text-right"><p className="text-[10px] font-semibold text-[#7E8C7F] dark:text-[#A9B7A3]">النتيجة المتوقعة</p><p className="mt-1 text-sm font-extrabold text-[#26352A] dark:text-[#F6F1E7]">{formatArabicNumber(exactDays)} يومًا</p></div>
                      <div className="h-8 w-px bg-[#C6A15B]/20" />
                      <div className="text-left"><p className="text-[10px] font-semibold text-[#7E8C7F] dark:text-[#A9B7A3]">الصلوات التقديرية</p><p className="mt-1 text-sm font-extrabold text-[#947435] dark:text-[#D8B66C]">{formatArabicNumber(calc.estimatedMissed)} صلاة</p></div>
                    </div>
                    <p className="text-center text-[11px] leading-6 text-[#7E8C7F] dark:text-[#A9B7A3]">يُحسب العدد بمعدل خمس صلوات عن كل يوم في الفترة المحددة.</p>
                  </div>
                </div>
              ) : (
              <>
              {/* Puberty Age */}
              <div className="p-5 rounded-3xl bg-white dark:bg-[#1F2E24] border border-[#C6A15B]/20 shadow-sm space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#1D211E] dark:text-[#F6F1E7]">
                    سن البلوغ التقريبي
                  </label>
                  <p className="text-[11px] text-[#7E8C7F] dark:text-[#A9B7A3]">
                    بداية التكليف الشرعي (عادة بين 12 و 15 سنة)
                  </p>
                </div>

                <div className="flex items-center justify-between p-2 rounded-2xl bg-black/5 dark:bg-white/5 border border-[#C6A15B]/20">
                  <TactileButton
                    onClick={() => handlePubertyChange(-1)}
                    className="w-10 h-10 rounded-xl bg-white dark:bg-[#26352A] flex items-center justify-center text-[#1D211E] dark:text-[#F6F1E7] shadow-sm"
                  >
                    <Minus className="w-4 h-4" />
                  </TactileButton>

                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-landing-display text-[#C6A15B]">
                      {pubertyAge}
                    </span>
                    <span className="text-xs text-[#7E8C7F] dark:text-[#A9B7A3]">سنة</span>
                  </div>

                  <TactileButton
                    onClick={() => handlePubertyChange(1)}
                    className="w-10 h-10 rounded-xl bg-[#26352A] dark:bg-[#C6A15B] text-[#F6F1E7] dark:text-[#18231C] flex items-center justify-center shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </TactileButton>
                </div>
              </div>

              {/* Current Age */}
              <div className="p-5 rounded-3xl bg-white dark:bg-[#1F2E24] border border-[#C6A15B]/20 shadow-sm space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#1D211E] dark:text-[#F6F1E7]">
                    العمر الحالي
                  </label>
                  <p className="text-[11px] text-[#7E8C7F] dark:text-[#A9B7A3]">
                    عمرك في الوقت الحاضر
                  </p>
                </div>

                <div className="flex items-center justify-between p-2 rounded-2xl bg-black/5 dark:bg-white/5 border border-[#C6A15B]/20">
                  <TactileButton
                    onClick={() => handleCurrentAgeChange(-1)}
                    className="w-10 h-10 rounded-xl bg-white dark:bg-[#26352A] flex items-center justify-center text-[#1D211E] dark:text-[#F6F1E7] shadow-sm"
                  >
                    <Minus className="w-4 h-4" />
                  </TactileButton>

                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-landing-display text-[#C6A15B]">
                      {currentAge}
                    </span>
                    <span className="text-xs text-[#7E8C7F] dark:text-[#A9B7A3]">سنة</span>
                  </div>

                  <TactileButton
                    onClick={() => handleCurrentAgeChange(1)}
                    className="w-10 h-10 rounded-xl bg-[#26352A] dark:bg-[#C6A15B] text-[#F6F1E7] dark:text-[#18231C] flex items-center justify-center shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </TactileButton>
                </div>
              </div>
              </>
              )}
            </motion.div>
          )}

          {/* ===== STEP 3: Frequency + Menstruation ===== */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {calculationMethod !== 'exact_period' && (
              <div className="p-5 rounded-3xl bg-white dark:bg-[#1F2E24] border border-[#C6A15B]/20 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-[#1D211E] dark:text-[#F6F1E7]">
                      نسبة أداء الصلاة في الماضي
                    </label>
                    <p className="text-[11px] text-[#7E8C7F] dark:text-[#A9B7A3]">
                      كم كنت تصلي تقريباً خلال تلك السنوات؟
                    </p>
                  </div>
                  <span className="text-lg font-bold font-landing-display text-[#C6A15B]">
                    {frequency}%
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={frequency}
                  onChange={(e) => setFrequency(Number(e.target.value))}
                  className="w-full accent-[#C6A15B]"
                />

                <div className="flex justify-between text-[11px] text-[#7E8C7F] dark:text-[#A9B7A3]">
                  <span>0% (انقطاع تام)</span>
                  <span>50%</span>
                  <span>100% (التزام كامل)</span>
                </div>
              </div>
              )}

              {/* Menstruation Section (female only) */}
              {gender === 'female' && (
                <div className="p-5 rounded-3xl bg-white dark:bg-[#1F2E24] border border-[#C6A15B]/20 shadow-sm space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#1D211E] dark:text-[#F6F1E7]">
                      متوسط أيام العذر الشرعي (شهرياً)
                    </label>
                    <p className="text-[11px] text-[#7E8C7F] dark:text-[#A9B7A3]">
                      تُستثنى تلقائياً لأن الصلاة لا تقضى عنها
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-2xl bg-black/5 dark:bg-white/5 border border-[#C6A15B]/20">
                    <TactileButton
                      onClick={() => setAverageMenstruationDays((v) => Math.max(1, v - 1))}
                      className="w-10 h-10 rounded-xl bg-white dark:bg-[#26352A] flex items-center justify-center text-[#1D211E] dark:text-[#F6F1E7] shadow-sm"
                    >
                      <Minus className="w-4 h-4" />
                    </TactileButton>

                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold font-landing-display text-[#C6A15B]">
                        {averageMenstruationDays}
                      </span>
                      <span className="text-xs text-[#7E8C7F] dark:text-[#A9B7A3]">أيام / شهر</span>
                    </div>

                    <TactileButton
                      onClick={() => setAverageMenstruationDays((v) => Math.min(15, v + 1))}
                      className="w-10 h-10 rounded-xl bg-[#26352A] dark:bg-[#C6A15B] text-[#F6F1E7] dark:text-[#18231C] flex items-center justify-center shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                    </TactileButton>
                  </div>
                </div>
              )}

              {calculationMethod === 'exact_period' && gender !== 'female' && (
                <div className="p-5 rounded-3xl bg-white dark:bg-[#1F2E24] border border-[#C6A15B]/20 shadow-sm text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-[#C6A15B]" />
                  <h3 className="text-sm font-bold">لا توجد استثناءات إضافية</h3>
                  <p className="text-xs leading-6 text-[#7E8C7F] dark:text-[#A9B7A3]">سيُحسب القضاء من الفترة المحددة مباشرة، بمعدل خمس صلوات لكل يوم.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ===== STEP 4: Summary ===== */}
          {step === 4 && (
            <div className="space-y-4">
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
              <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-white/90 to-[#F6F1E7]/70 dark:from-[#26352A]/90 dark:to-[#18231C]/90 border border-[#C6A15B]/30 shadow-sm text-center">
                <span className="text-xs uppercase tracking-wider text-[#7E8C7F] dark:text-[#A9B7A3] font-semibold block mb-1">
                  المجموع التقديري للصلوات الفائتة
                </span>
                <div className="text-4xl sm:text-5xl font-extrabold font-landing-display text-[#1D211E] dark:text-[#F6F1E7] mb-2">
                  {formatArabicNumber(totalEffectiveMissed)}
                  <span className="text-base font-normal text-[#C6A15B] mr-2">صلاة</span>
                </div>
                <p className="text-xs text-[#7E8C7F] dark:text-[#A9B7A3]">
                  {calculationMethod === 'exact_period' ? `فترة محددة • ${calc.days} يومًا` : `تقدير من ${calc.years} سنوات • نسبة فوات ${100 - frequency}%`}
                </p>

                <div className="grid grid-cols-5 gap-1.5 mt-5 pt-4 border-t border-black/5 dark:border-white/5">
                  {[
                    { label: 'الفجر', val: calc.perPrayer.fajr },
                    { label: 'الظهر', val: calc.perPrayer.dhuhr },
                    { label: 'العصر', val: calc.perPrayer.asr },
                    { label: 'المغرب', val: calc.perPrayer.maghrib },
                    { label: 'العشاء', val: calc.perPrayer.isha },
                  ].map((p) => (
                    <div key={p.label} className="p-2 rounded-xl bg-black/5 dark:bg-white/5 text-center">
                      <span className="text-[10px] text-[#7E8C7F] dark:text-[#A9B7A3] block">
                        {p.label}
                      </span>
                      <span className="text-xs font-bold text-[#1D211E] dark:text-[#F6F1E7]">
                        {formatArabicNumber(p.val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 text-xs text-[#7E8C7F] dark:text-[#A9B7A3] leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-[#C6A15B] shrink-0 mt-0.5" />
                <span>
                  هذه الأرقام تقديرية قابلة للتعديل اليدوي في أي وقت من شاشة الإعدادات. تذكر: «قليلٌ دائم خيرٌ من كثيرٍ منقطع».
                </span>
              </div>

              {/* Istighfar Setup Section */}
              <div className="p-4 rounded-2xl bg-[#C6A15B]/5 border border-[#C6A15B]/20">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-[#7E8C7F] dark:text-[#A9B7A3] font-semibold block">
                      ورد الاستغفار (اختياري)
                    </span>
                    <p className="text-[10px] text-[#7E8C7F] dark:text-[#A9B7A3] mt-0.5">
                      هدف يومي مستوحى من الحديث النبوي — ليس قضاءً شرعيًا
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSetupIstighfarNow(!setupIstighfarNow)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      setupIstighfarNow
                        ? 'bg-[#C6A15B] text-[#18231C] border-[#C6A15B] shadow-sm'
                        : 'bg-black/5 dark:bg-white/5 text-[#7E8C7F] dark:text-[#A9B7A3] border-transparent hover:border-[#C6A15B]/30'
                    }`}
                  >
                    {setupIstighfarNow ? 'مفعّل' : 'تفعيل'}
                  </button>
                </div>

                {setupIstighfarNow && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-[#C6A15B]/20">
                      <div>
                        <span className="text-xs font-semibold text-[#1D211E] dark:text-[#F6F1E7] block">
                          سن البدء بالهدف
                        </span>
                        <p className="text-[10px] text-[#7E8C7F] dark:text-[#A9B7A3]">
                          من milestone عمرك الذي تفكر فيه
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <TactileButton onClick={() => setIstighfarStartAge((a) => Math.max(7, a - 1))} className="w-8 h-8 rounded-lg bg-white dark:bg-[#26352A] flex items-center justify-center text-sm"><Minus className="w-3.5 h-3.5" /></TactileButton>
                        <span className="text-lg font-bold font-landing-display text-[#C6A15B] min-w-[2rem] text-center">{istighfarStartAge}</span>
                        <span className="text-[10px] text-[#7E8C7F]">سنة</span>
                        <TactileButton onClick={() => setIstighfarStartAge((a) => Math.min(currentAge - 1, a + 1))} className="w-8 h-8 rounded-lg bg-[#26352A] dark:bg-[#C6A15B] text-[#F6F1E7] dark:text-[#18231C] flex items-center justify-center text-sm"><Plus className="w-3.5 h-3.5" /></TactileButton>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-[#C6A15B]/20">
                      <div>
                        <span className="text-xs font-semibold text-[#1D211E] dark:text-[#F6F1E7] block">
                          عدد السنوات المراد تتبعها
                        </span>
                        <p className="text-[10px] text-[#7E8C7F] dark:text-[#A9B7A3]">
                          الفترة التاريخية لهدف الاستغفار
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <TactileButton onClick={() => setIstighfarTrackedYears((y) => Math.max(0, y - 1))} className="w-8 h-8 rounded-lg bg-white dark:bg-[#26352A] flex items-center justify-center text-sm"><Minus className="w-3.5 h-3.5" /></TactileButton>
                        <span className="text-lg font-bold font-landing-display text-[#C6A15B] min-w-[2rem] text-center">{istighfarTrackedYears || (currentAge - istighfarStartAge)}</span>
                        <span className="text-[10px] text-[#7E8C7F]">سنة</span>
                        <TactileButton onClick={() => setIstighfarTrackedYears((y) => Math.min(currentAge - istighfarStartAge, y + 1))} className="w-8 h-8 rounded-lg bg-[#26352A] dark:bg-[#C6A15B] text-[#F6F1E7] dark:text-[#18231C] flex items-center justify-center text-sm"><Plus className="w-3.5 h-3.5" /></TactileButton>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-[#C6A15B]/20">
                      <div>
                        <span className="text-xs font-semibold text-[#1D211E] dark:text-[#F6F1E7] block">
                          هدف يومي
                        </span>
                        <p className="text-[10px] text-[#7E8C7F] dark:text-[#A9B7A3]">
                          عدد مرات الاستغفار اليومي
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <TactileButton onClick={() => setIstighfarDailyTarget((t) => Math.max(10, t - 5))} className="w-8 h-8 rounded-lg bg-white dark:bg-[#26352A] flex items-center justify-center text-sm"><Minus className="w-3.5 h-3.5" /></TactileButton>
                        <span className="text-lg font-bold font-landing-display text-[#C6A15B] min-w-[2.5rem] text-center">{istighfarDailyTarget}</span>
                        <span className="text-[10px] text-[#7E8C7F]">مرة/يوم</span>
                        <TactileButton onClick={() => setIstighfarDailyTarget((t) => Math.min(150, t + 5))} className="w-8 h-8 rounded-lg bg-[#26352A] dark:bg-[#C6A15B] text-[#F6F1E7] dark:text-[#18231C] flex items-center justify-center text-sm"><Plus className="w-3.5 h-3.5" /></TactileButton>
                      </div>
                    </div>

                    {istighfarEstimatedPreviousDaily > 0 && (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-[#C6A15B]/20">
                        <div>
                          <span className="text-xs font-semibold text-[#1D211E] dark:text-[#F6F1E7] block">
                            الاستغفار المتوقع سابقًا
                          </span>
                          <p className="text-[10px] text-[#7E8C7F] dark:text-[#A9B7A3]">
                            تقدير يومي سابق (مثلاً كنت تستغفر 50 مرة يوميًا)
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <TactileButton onClick={() => setIstighfarEstimatedPreviousDaily((e) => Math.max(0, e - 5))} className="w-8 h-8 rounded-lg bg-white dark:bg-[#26352A] flex items-center justify-center text-sm"><Minus className="w-3.5 h-3.5" /></TactileButton>
                          <span className="text-lg font-bold font-landing-display text-[#C6A15B] min-w-[2.5rem] text-center">{istighfarEstimatedPreviousDaily}</span>
                          <span className="text-[10px] text-[#7E8C7F]">مرة/يوم</span>
                          <TactileButton onClick={() => setIstighfarEstimatedPreviousDaily((e) => Math.min(istighfarDailyTarget, e + 5))} className="w-8 h-8 rounded-lg bg-[#26352A] dark:bg-[#C6A15B] text-[#F6F1E7] dark:text-[#18231C] flex items-center justify-center text-sm"><Plus className="w-3.5 h-3.5" /></TactileButton>
                        </div>
                      </div>
                    )}

                    {istighfarStartAge < currentAge && (
                      <div className="p-3 rounded-xl bg-[#C6A15B]/10 border border-[#C6A15B]/25 text-xs text-[#7E8C7F] dark:text-[#A9B7A3] text-center leading-relaxed">
                        الهدف التاريخي التقديري:
                        <strong className="text-[#C6A15B] font-bold">
                          {formatArabicNumber((istighfarTrackedYears || currentAge - istighfarStartAge) * 365 * istighfarDailyTarget)}
                        </strong>{' '}
                        استغفار
                        {istighfarEstimatedPreviousDaily > 0 && (
                          <>
                            {' '}مخصومًا منه {formatArabicNumber((istighfarTrackedYears || currentAge - istighfarStartAge) * 365 * istighfarEstimatedPreviousDaily)} استغفارًا كان يُرجّح أنّك كنت تفعلها
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="pt-6 space-y-2">
        {step < totalSteps ? (
          <TactileButton
            onClick={handleNext}
            className="w-full py-4 rounded-full bg-[#26352A] dark:bg-[#C6A15B] text-[#F6F1E7] dark:text-[#18231C] font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:opacity-95"
          >
            <span>متابعة</span>
            <ArrowLeft className="w-4 h-4" />
          </TactileButton>
        ) : (
          <TactileButton
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-4 rounded-full bg-[#26352A] dark:bg-[#C6A15B] text-[#F6F1E7] dark:text-[#18231C] font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:opacity-95"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{isSubmitting ? 'جارٍ الحفظ...' : 'ابدأ رحلة القضاء الآن'}</span>
          </TactileButton>
        )}

        {step > 1 && (
          <TactileButton
            onClick={handleBack}
            className="w-full py-2.5 rounded-full text-xs font-semibold text-[#7E8C7F] dark:text-[#A9B7A3] hover:text-[#1D211E] dark:hover:text-[#F6F1E7] flex items-center justify-center gap-1.5"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>الرجوع للخطوة السابقة</span>
          </TactileButton>
        )}
      </div>
    </div>
  );
};
