import React, { useState, useEffect } from 'react';
import { RefreshCw, Copy, Check, Heart, Quote, BookOpen } from 'lucide-react';
import { DhikrItem, getDailyDhikr, getRandomDhikr } from '../data/adhkar';
import { useApp } from '../context/AppContext';
import { playSoftClickSound, triggerHaptic } from '../utils/streak';
import { formatArabicNumber } from '../utils/calculator';

/** Elegant Islamic ornament corner SVG */
const OrnamentCorner: React.FC<{ position: string }> = ({ position }) => {
  const transforms: Record<string, string> = {
    tl: '',
    tr: 'scaleX(-1)',
    bl: 'scaleY(-1)',
    br: 'scale(-1,-1)',
  };
  const positions: Record<string, React.CSSProperties> = {
    tl: { top: 6, right: 6 },
    tr: { top: 6, left: 6 },
    bl: { bottom: 6, right: 6 },
    br: { bottom: 6, left: 6 },
  };

  return (
    <svg
      viewBox="0 0 28 28"
      className="absolute w-6 h-6 pointer-events-none"
      style={{
        opacity: 0.08,
        color: 'var(--qada-gold)',
        transform: transforms[position],
        ...positions[position],
      }}
    >
      {/* Geometric L-shape ornament */}
      <path d="M0 0 L8 0 L8 2 L2 2 L2 8 L0 8 Z" fill="currentColor" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" opacity="0.5" />
      <path d="M4 0 L4 4 L0 4" stroke="currentColor" strokeWidth="0.3" fill="none" opacity="0.4" />
    </svg>
  );
};

/**
 * Beautiful daily dhikr section — spiritual reflection area.
 * Uses parchment-like gradient, ornamental corners, elegant Arabic typography.
 */
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
      setDhikr(getRandomDhikr(dhikr.id));
      setCount(0);
      setIsAnimating(false);
    }, 150);
  };

  const handleIncrement = () => {
    if (settings?.soundEnabled) playSoftClickSound();
    if (settings?.hapticsEnabled) triggerHaptic();
    const next = count + 1;
    setCount(next);
    if (next === dhikr.recommendedCount) {
      showToast('جزاك الله خيراً، أتممت ورد هذا الذكر 🌿', 'success');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${dhikr.text}\n(${dhikr.source})`);
      setIsCopied(true);
      showToast('تم نسخ الذكر إلى الحافظة', 'success');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      showToast('تعذر النسخ', 'error');
    }
  };

  const isCompleted = count >= dhikr.recommendedCount;

  return (
    <>
      {/* Section header */}
      <div className="section-label mb-3">
        <div className="section-label-icon" style={{ background: 'var(--qada-accent-soft)' }}>
          <span className="text-xs">✨</span>
        </div>
        <div className="flex-1">
          <div className="section-label-text">ذكر اليوم</div>
          <div className="section-label-sub">{dhikr.category}</div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleNextDhikr}
            title="ذكر آخر"
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--qada-text-muted)' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnimating ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleCopy}
            title="نسخ"
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--qada-text-muted)' }}
          >
            {isCopied
              ? <Check className="w-3.5 h-3.5" style={{ color: 'var(--qada-success)' }} />
              : <Copy className="w-3.5 h-3.5" />
            }
          </button>
        </div>
      </div>

      {/* Parchment-style dua section */}
      <div className="section-parchment rounded-xl p-5 relative">
        {/* Ornamental corners */}
        <OrnamentCorner position="tl" />
        <OrnamentCorner position="tr" />
        <OrnamentCorner position="bl" />
        <OrnamentCorner position="br" />

        {/* Subtle background quote */}
        <div className="absolute left-3 top-3 pointer-events-none select-none" style={{ opacity: 0.03, color: 'var(--qada-primary)' }}>
          <Quote className="w-16 h-16" style={{ transform: 'scaleX(-1)' }} />
        </div>

        {/* Dua text */}
        <div
          className={`relative z-10 text-center px-3 py-5 mb-3 rounded-lg transition-opacity duration-150 ${
            isAnimating ? 'opacity-20' : 'opacity-100'
          }`}
          style={{ background: 'var(--qada-surface-2)', border: '1px solid var(--qada-border)' }}
        >
          <p className="font-brand-serif text-base sm:text-lg font-bold leading-loose select-text" style={{ color: 'var(--qada-text)' }}>
            « {dhikr.text} »
          </p>
        </div>

        {/* Source */}
        <div className="relative z-10 flex items-center justify-center gap-1.5 text-[11px] mb-2">
          <BookOpen className="w-3 h-3" style={{ color: 'var(--qada-text-muted)' }} />
          <span style={{ color: 'var(--qada-text-secondary)' }}>
            المصدر: {dhikr.source}
          </span>
        </div>

        {dhikr.benefit && (
          <p className="text-[11px] text-center leading-relaxed mb-4 relative z-10" style={{ color: 'var(--qada-text-muted)' }}>
            {dhikr.benefit}
          </p>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 mb-3 relative z-10 opacity-30">
          <div className="flex-1" style={{ height: 1, background: 'var(--qada-border-strong)' }} />
          <svg width="8" height="8" viewBox="0 0 24 24" fill="var(--qada-gold)">
            <path d="M12 0l2.5 8.5 8.5 2.5-8.5 2.5L12 22l-2.5-8.5L1 11l8.5-2.5z" />
          </svg>
          <div className="flex-1" style={{ height: 1, background: 'var(--qada-border-strong)' }} />
        </div>

        {/* Tasbeeh counter */}
        <div className="flex items-center justify-between gap-2 relative z-10">
          <span className="text-[11px]" style={{ color: 'var(--qada-text-muted)' }}>
            الورد: <strong style={{ color: 'var(--qada-text)' }}>
              {formatArabicNumber(dhikr.recommendedCount)} {dhikr.recommendedCount === 1 ? 'مرة' : 'مرات'}
            </strong>
          </span>

          <button
            type="button"
            onClick={handleIncrement}
            className="px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 btn-press"
            style={{
              background: isCompleted ? 'var(--qada-success)' : 'var(--qada-primary)',
              color: '#fff',
              boxShadow: isCompleted ? '0 2px 8px rgba(74,122,74,0.2)' : '0 2px 8px rgba(60,90,60,0.15)',
            }}
          >
            {isCompleted ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>اكتمل ({formatArabicNumber(count)})</span>
              </>
            ) : (
              <>
                <Heart className="w-3.5 h-3.5 fill-current opacity-80" />
                <span>تسبيح ({formatArabicNumber(count)}/{formatArabicNumber(dhikr.recommendedCount)})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};
