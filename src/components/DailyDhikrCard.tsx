import React, { useState, useEffect } from 'react';
import { RefreshCw, Copy, Check, Heart, Quote, BookOpen, Star } from 'lucide-react';
import {
  PropheticDua,
  getDailyPropheticDua,
  PROPHETIC_DUAS,
  shuffleDuas,
} from '../data/propheticDuas';
import { useApp } from '../context/AppContext';
import { playSoftClickSound, triggerHaptic } from '../utils/streak';
import { formatArabicNumber } from '../utils/calculator';
import { StarEightPoint } from './landing/IslamicOrnaments';

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
      <path d="M0 0 L8 0 L8 2 L2 2 L2 8 L0 8 Z" fill="currentColor" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" opacity="0.5" />
      <path d="M4 0 L4 4 L0 4" stroke="currentColor" strokeWidth="0.3" fill="none" opacity="0.4" />
    </svg>
  );
};

/**
 * Beautiful daily Prophetic Dua section — verified spiritual reflection area.
 * Sourced directly from Sheikh Abdul Muhsin al-Abbad's verified collection.
 */
export const DailyDhikrCard: React.FC = () => {
  const { showToast, settings } = useApp();
  const [dua, setDua] = useState<PropheticDua>(getDailyPropheticDua);
  const [count, setCount] = useState<number>(0);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  useEffect(() => {
    setDua(getDailyPropheticDua());
    setCount(0);
  }, []);

  const handleNextDua = () => {
    setIsAnimating(true);
    if (settings?.soundEnabled) playSoftClickSound();
    if (settings?.hapticsEnabled) triggerHaptic();

    setTimeout(() => {
      const candidates = PROPHETIC_DUAS.filter((d) => d.id !== dua.id);
      const shuffled = shuffleDuas(candidates);
      setDua(shuffled[0] || PROPHETIC_DUAS[0]);
      setCount(0);
      setIsAnimating(false);
    }, 150);
  };

  const targetCount = dua.repetition || 1;

  const handleIncrement = () => {
    if (settings?.soundEnabled) playSoftClickSound();
    if (settings?.hapticsEnabled) triggerHaptic();
    const next = count + 1;
    setCount(next);
    if (next === targetCount) {
      showToast('جزاك الله خيراً، أتممت ورد هذا الدعاء المبارك 🌿', 'success');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        `« ${dua.arabic} »\n\nالمصدر: ${dua.source} (${dua.hadithNumber})\nعن ${dua.narrator}`
      );
      setIsCopied(true);
      showToast('تم نسخ الدعاء ومصدره إلى الحافظة', 'success');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      showToast('تعذر النسخ', 'error');
    }
  };

  const isCompleted = count >= targetCount;

  return (
    <>
      {/* Section header */}
      <div className="section-label mb-3" dir="rtl">
        <div className="section-label-icon" style={{ background: 'var(--qada-accent-soft)' }}>
          <StarEightPoint size={14} color="var(--qada-gold)" />
        </div>
        <div className="flex-1">
          <div className="section-label-text flex items-center gap-2">
            <span>دعاء نبوي</span>
            <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-[#C6A15B]/15 text-[#C6A15B] border border-[#C6A15B]/25">
              مصدر موثوق
            </span>
          </div>
          <div className="section-label-sub">{dua.title}</div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleNextDua}
            title="دعاء آخر"
            className="p-1.5 rounded-lg transition-colors cursor-pointer"
            style={{ color: 'var(--qada-text-muted)' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnimating ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleCopy}
            title="نسخ"
            className="p-1.5 rounded-lg transition-colors cursor-pointer"
            style={{ color: 'var(--qada-text-muted)' }}
          >
            {isCopied ? (
              <Check className="w-3.5 h-3.5" style={{ color: 'var(--qada-success)' }} />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Parchment-style dua section */}
      <div className="section-parchment rounded-2xl p-5 relative" dir="rtl">
        {/* Ornamental corners */}
        <OrnamentCorner position="tl" />
        <OrnamentCorner position="tr" />
        <OrnamentCorner position="bl" />
        <OrnamentCorner position="br" />

        {/* Subtle background quote */}
        <div
          className="absolute left-3 top-3 pointer-events-none select-none"
          style={{ opacity: 0.03, color: 'var(--qada-primary)' }}
        >
          <Quote className="w-16 h-16" style={{ transform: 'scaleX(-1)' }} />
        </div>

        {/* Dua text */}
        <div
          className={`relative z-10 text-center px-4 py-6 mb-3 rounded-xl transition-opacity duration-150 ${
            isAnimating ? 'opacity-20' : 'opacity-100'
          }`}
          style={{ background: 'var(--qada-surface-2)', border: '1px solid var(--qada-border)' }}
        >
          <p
            className="font-spiritual-serif text-base sm:text-lg font-bold leading-loose select-text"
            style={{ color: 'var(--qada-text)' }}
          >
            « {dua.arabic} »
          </p>
        </div>

        {/* Source & attribution */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-1 text-[11px] mb-2 text-center">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" style={{ color: 'var(--qada-gold)' }} />
            <span style={{ color: 'var(--qada-text-secondary)' }}>
              المصدر: <strong>{dua.source}</strong> ({dua.hadithNumber})
            </span>
          </div>
          <span className="text-[10px]" style={{ color: 'var(--qada-text-muted)' }}>
            عن {dua.narrator} {dua.authenticity ? `• ${dua.authenticity}` : ''}
          </span>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-3 relative z-10 opacity-30">
          <div className="flex-1" style={{ height: 1, background: 'var(--qada-border-strong)' }} />
          <svg width="8" height="8" viewBox="0 0 24 24" fill="var(--qada-gold)">
            <path d="M12 0l2.5 8.5 8.5 2.5-8.5 2.5L12 22l-2.5-8.5L1 11l8.5-2.5z" />
          </svg>
          <div className="flex-1" style={{ height: 1, background: 'var(--qada-border-strong)' }} />
        </div>

        {/* Tasbeeh / Repetition counter */}
        <div className="flex items-center justify-between gap-2 relative z-10">
          <span className="text-[11px]" style={{ color: 'var(--qada-text-muted)' }}>
            الدعاء: <strong style={{ color: 'var(--qada-text)' }}>
              #{formatArabicNumber(dua.number)} من {formatArabicNumber(PROPHETIC_DUAS.length)}
            </strong>
          </span>

          <button
            type="button"
            onClick={handleIncrement}
            className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 btn-press cursor-pointer transition-all"
            style={{
              background: isCompleted ? 'var(--qada-success)' : 'var(--qada-primary)',
              color: '#fff',
              boxShadow: isCompleted
                ? '0 2px 8px rgba(74,122,74,0.2)'
                : '0 2px 8px rgba(60,90,60,0.15)',
            }}
          >
            {isCompleted ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>اكتمل الترديد ({formatArabicNumber(count)})</span>
              </>
            ) : (
              <>
                <Heart className="w-3.5 h-3.5 fill-current opacity-80" />
                <span>
                  ترديد ({formatArabicNumber(count)}/{formatArabicNumber(targetCount)})
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};
