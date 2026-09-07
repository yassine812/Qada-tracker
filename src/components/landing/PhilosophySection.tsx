import React from 'react';
import { StarEightPoint, IslamicPatternBackground, SubtleArch } from './IslamicOrnaments';

interface PhilosophyPillar {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export const PhilosophySection: React.FC = () => {
  const pillars: PhilosophyPillar[] = [
    {
      title: 'لا تحتاج إلى حساب',
      description: 'ابدأ فوراً دون طلب بريد إلكتروني، رقم هاتف، أو كلمة مرور. لا حواجز بينك وبين هدفك.',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="18" y1="8" x2="23" y2="13" />
          <line x1="23" y1="8" x2="18" y2="13" />
        </svg>
      ),
    },
    {
      title: 'بياناتك محفوظة على جهازك',
      description: 'نؤمن بالخصوصية الكاملة. جميع حساباتك وسجلاتك تبقى في ذاكرة جهازك المحلية فقط ولا تُرفع لأي خادم.',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
    },
    {
      title: 'يعمل بدون اتصال بالإنترنت',
      description: 'تطبيق ويب تقدمي (PWA) مستقل ومتاح دائماً سواء في المسجد أو أثناء السفر أو في أوقات انقطاع الشبكة.',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      ),
    },
    {
      title: 'تصميم بسيط وهادئ',
      description: 'خالٍ من الإعلانات المشتتة والألوان الصاخبة. واجهة تأملية مستوحاة من العمارة الإسلامية والألوان الطبيعية.',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12h8" />
        </svg>
      ),
    },
    {
      title: 'متابعة واضحة لتقدمك',
      description: 'حساب دقيق لسنوات الفوات مع اقتراح معدل قضاء يومي مرن يناسب ظروفك الحياتية ولا يُثقل عليك.',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      ),
    },
  ];

  return (
    <section
      id="how-it-works"
      className="relative py-24 sm:py-32 bg-[#18231C] text-[#F6F1E7] overflow-hidden"
      dir="rtl"
    >
      {/* Subtle Geometric Background */}
      <IslamicPatternBackground opacity={0.03} />

      {/* Decorative ambient lighting */}
      <div className="absolute top-1/4 -right-40 w-96 h-96 bg-[#26352A] rounded-full blur-3xl opacity-40 pointer-events-none" />
      <div className="absolute bottom-1/4 -left-40 w-96 h-96 bg-[#C6A15B] rounded-full blur-3xl opacity-10 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        {/* Section Header */}
        <div className="max-w-3xl mb-16 sm:mb-20 text-right">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#26352A] border border-[#C6A15B]/30 text-[#C6A15B] mb-5">
            <StarEightPoint size={12} color="#C6A15B" />
            <span className="text-xs font-semibold tracking-wider font-landing-display">
              فلسفة قضاء
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-landing-display text-[#F6F1E7] tracking-tight leading-[1.2] mb-6">
            ببساطة، لأن العودة لا تحتاج إلى التعقيد.
          </h2>

          <p className="text-base sm:text-lg text-[#A9B7A3] font-normal leading-relaxed max-w-2xl">
            بنينا قضاء ليكون أداة مخلصة ترافقك في خلوتك، ترتكز على مبدأ الخصوصية أولاً واليسر التام، لتفرغ قلبك للعبادة.
          </p>
        </div>

        {/* Pillars Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {pillars.map((pillar, idx) => (
            <div
              key={pillar.title}
              className={`relative p-8 rounded-2xl bg-[#26352A]/40 border border-[#A9B7A3]/10 hover:border-[#C6A15B]/40 transition-all duration-300 hover:bg-[#26352A]/60 flex flex-col justify-between ${
                idx === 0 ? 'lg:col-span-2 bg-[#26352A]/70' : ''
              }`}
            >
              <div>
                <div className="w-11 h-11 rounded-xl bg-[#18231C] border border-[#C6A15B]/20 text-[#C6A15B] flex items-center justify-center mb-6 shadow-inner">
                  {pillar.icon}
                </div>

                <h3 className="text-xl font-bold text-[#F6F1E7] font-landing-display mb-3">
                  {pillar.title}
                </h3>

                <p className="text-sm sm:text-base text-[#A9B7A3] leading-relaxed">
                  {pillar.description}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between text-xs text-[#A9B7A3]/60">
                <span className="font-sans">مبدأ معتمد</span>
                <StarEightPoint size={10} color="#C6A15B" />
              </div>
            </div>
          ))}
        </div>

        {/* Local-First Guarantee Ribbon */}
        <div className="mt-14 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#26352A]/90 to-[#18231C]/90 border border-[#C6A15B]/25 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#C6A15B]/15 text-[#C6A15B] flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h4 className="text-base font-bold text-[#F6F1E7] font-landing-display">
                ضمان الخصوصية التامة
              </h4>
              <p className="text-xs sm:text-sm text-[#A9B7A3]">
                بياناتك ملكك وحدك. لا نتتبعك، لا نبيع بياناتك، ولا نطلب أية تصاريح غير لازمة.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#C6A15B] bg-[#18231C] px-4 py-2 rounded-full border border-[#C6A15B]/20">
            <StarEightPoint size={10} color="#C6A15B" />
            <span>محلي 100% على جهازك</span>
          </div>
        </div>
      </div>
    </section>
  );
};
