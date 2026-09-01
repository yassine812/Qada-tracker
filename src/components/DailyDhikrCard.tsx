import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Heart,
  Quote,
  BookOpen,
  Volume2,
} from 'lucide-react';
import { DhikrItem, getDailyDhikr, getRandomDhikr } from '../data/adhkar';
import { useApp } from '../context/AppContext';
import { playSoftClickSound, triggerHaptic } from '../utils/streak';
import { formatArabicNumber } from '../utils/calculator';

export const DailyDhikrCard: React.FC = () => {
  const { showToast, settings } = useApp();
  const [dhikr, setDhikr] = useState<DhikrItem>(getDailyDhikr);
  const [count, setCount] = useState<number>(0);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  useEffect(() => {
    setDhikr(getDailyDhikr());
    setCount(0);
  }, []);

  const handleNextDhikr = () => {
    setIsAnimating(true);
    if (settings?.soundEnabled) playSoftClickSound();
    if (settings?.hapticsEnabled) triggerHaptic();

    setTimeout(() => {
      const next = getRandomDhikr(dhikr.id);
      setDhikr(next);
      setCount(0);
      setIsAnimating(false);
    }, 150);
  };

  const handleIncrement = () => {
    if (settings?.soundEnabled) playSoftClickSound();
    if (settings?.hapticsEnabled) triggerHaptic();
    setCount((prev) => prev + 1);

    if (count + 1 === dhikr.recommendedCount) {
      showToast('جزاك الله خيراً، أتممت ورد هذا الذكر المبارك 🌿', 'success');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${dhikr.text}\n(${dhikr.source})`);
      setIsCopied(true);
      showToast('تم نسخ الذكر الشريف إلى الحافظة', 'success');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (e) {
      showToast('تعذر نسخ النص', 'error');
    }
  };

  const isCompleted = count >= dhikr.recommendedCount;

  return (
    <section className="bg-[#FAF9F5] dark:bg-[#252622] rounded-[28px] p-5 border border-[#E8E4D9] dark:border-[#3D3E37] shadow-[0_4px_16px_rgba(90,90,64,0.04)] relative overflow-hidden transition-all">
      {/* Decorative subtle background quote icon */}
      <div className="absolute left-3 top-3 text-[#E8E4D9]/60 dark:text-[#3D3E37]/50 pointer-events-none select-none">
        <Quote className="w-16 h-16 transform scale-x-[-1]" />
      </div>

      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#F0EEE6] dark:bg-[#1C1D1A] text-[#5A5A40] dark:text-[#C8C7B9] flex items-center justify-center border border-[#E8E4D9] dark:border-[#3D3E37]">
            <Sparkles className="w-4 h-4 text-[#C97C5D]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm font-brand-serif text-[#2D2D2A] dark:text-[#EAE7E0]">
                ذكر اليوم المبارك
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F0EEE6] dark:bg-[#1C1D1A] text-[#5A5A40] dark:text-[#C8C7B9] border border-[#E8E4D9] dark:border-[#3D3E37]">
                {dhikr.category}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls: Shuffle & Copy */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleNextDhikr}
            title="ذكر آخر"
            className="p-2 rounded-xl text-[#8E8E80] dark:text-[#A6A699] hover:text-[#2D2D2A] dark:hover:text-white hover:bg-[#F0EEE6] dark:hover:bg-[#1C1D1A] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isAnimating ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleCopy}
            title="نسخ الذكر"
            className="p-2 rounded-xl text-[#8E8E80] dark:text-[#A6A699] hover:text-[#2D2D2A] dark:hover:text-white hover:bg-[#F0EEE6] dark:hover:bg-[#1C1D1A] transition-colors"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Dhikr Content */}
      <div
        className={`relative z-10 space-y-3 transition-opacity duration-150 ${
          isAnimating ? 'opacity-30' : 'opacity-100'
        }`}
      >
        <p className="font-brand-serif text-base sm:text-lg font-bold text-[#2D2D2A] dark:text-[#EAE7E0] leading-relaxed text-center px-2 py-1 select-text">
          « {dhikr.text} »
        </p>

        {/* Source and Benefit Footnote */}
        <div className="bg-[#F0EEE6] dark:bg-[#1C1D1A] p-2.5 rounded-2xl border border-[#E8E4D9] dark:border-[#3D3E37] text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#5A5A40] dark:text-[#C8C7B9]">
            <BookOpen className="w-3.5 h-3.5" />
            <span>المصدر: {dhikr.source}</span>
          </div>
          {dhikr.benefit && (
            <p className="text-[11px] text-[#8E8E80] dark:text-[#A6A699] leading-normal">
              {dhikr.benefit}
            </p>
          )}
        </div>

        {/* Interactive Tasbeeh / Repetition Counter */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="text-[11px] text-[#8E8E80] dark:text-[#A6A699] flex items-center gap-1">
            <span>الورد المقترح:</span>
            <strong className="text-[#2D2D2A] dark:text-[#EAE7E0]">
              {formatArabicNumber(dhikr.recommendedCount)} {dhikr.recommendedCount === 1 ? 'مرة' : 'مرات'}
            </strong>
          </div>

          <button
            type="button"
            onClick={handleIncrement}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-2 shadow-xs ${
              isCompleted
                ? 'bg-emerald-600 dark:bg-emerald-700 text-white'
                : 'bg-[#5A5A40] hover:bg-[#484833] dark:bg-[#C8C7B9] dark:hover:bg-[#B8B7A8] text-white dark:text-[#1C1D1A]'
            }`}
          >
            {isCompleted ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>اكتمل الورد ({formatArabicNumber(count)})</span>
              </>
            ) : (
              <>
                <Heart className="w-3.5 h-3.5 fill-current opacity-80" />
                <span>تسبيح ({formatArabicNumber(count)} / {formatArabicNumber(dhikr.recommendedCount)})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
};
