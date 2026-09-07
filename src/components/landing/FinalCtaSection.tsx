import React from 'react';
import { StarEightPoint, SubtleArch } from './IslamicOrnaments';

interface FinalCtaSectionProps {
  onStartApp: () => void;
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({ onStartApp }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-[#18231C] text-[#F6F1E7] overflow-hidden select-none" dir="rtl">
      {/* Upper CTA area */}
      <div className="relative py-24 sm:py-32 border-b border-white/10">
        {/* Subtle decorative arches on both sides */}
        <div className="absolute top-8 right-8 opacity-10 hidden md:block">
          <SubtleArch className="w-24 h-32 text-[#C6A15B]" color="#C6A15B" />
        </div>
        <div className="absolute top-8 left-8 opacity-10 hidden md:block scale-x-[-1]">
          <SubtleArch className="w-24 h-32 text-[#C6A15B]" color="#C6A15B" />
        </div>

        <div className="relative max-w-3xl mx-auto px-6 text-center">
          {/* Subtle star badge */}
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#26352A] border border-[#C6A15B]/30 text-[#C6A15B] mb-8 shadow-inner">
            <StarEightPoint size={22} color="#C6A15B" />
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-landing-display text-[#F6F1E7] tracking-tight mb-6">
            ابدأ اليوم.
          </h2>

          <p className="text-lg sm:text-xl text-[#A9B7A3] font-normal leading-relaxed mb-10 max-w-xl mx-auto">
            ليس عليك أن تكمل كل شيء دفعة واحدة. فقط ابدأ.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={onStartApp}
              className="group relative inline-flex items-center justify-center gap-3 px-10 py-4 rounded-full bg-[#F6F1E7] text-[#26352A] font-bold text-lg transition-all duration-300 hover:bg-white hover:shadow-[0_10px_30px_rgba(246,241,231,0.25)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer w-full sm:w-auto"
            >
              <span>ابدأ مع قضاء</span>
              <svg
                className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1.5 rotate-180"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 12l4-4-4-4" />
              </svg>
            </button>
          </div>

          <p className="text-xs text-[#A9B7A3]/70 mt-6 tracking-wide">
            مجاني بالكامل • بدون إعلانات • خصوصية تامة
          </p>
        </div>
      </div>

      {/* Lower Footer Branding & Legal / Spiritual Notes */}
      <div className="py-12 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-[#A9B7A3]/70">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-[#26352A] border border-[#C6A15B]/20 flex items-center justify-center text-[#C6A15B]">
            <StarEightPoint size={12} color="#C6A15B" />
          </div>
          <span className="font-landing-display font-semibold text-[#F6F1E7]">
            قضاء
          </span>
          <span className="text-white/20">•</span>
          <span>رفيقك للعودة إلى الله</span>
        </div>

        <div className="text-center sm:text-right font-spiritual-serif text-sm text-[#C6A15B]/80">
          «وَتُوبُوا إِلَى اللَّهِ جَمِيعًا أَيُّهَ الْمُؤْمِنُونَ لَعَلَّكُمْ تُفْلِحُونَ»
        </div>

        <button
          type="button"
          onClick={scrollToTop}
          className="hover:text-[#F6F1E7] transition-colors flex items-center gap-1.5 cursor-pointer py-1"
        >
          <span>العودة للأعلى</span>
          <svg className="w-3.5 h-3.5 rotate-180" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 10l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </footer>
  );
};
