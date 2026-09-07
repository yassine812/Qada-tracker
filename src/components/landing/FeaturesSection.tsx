import React from 'react';
import { StarEightPoint, SubtleArch, OrnamentalDivider } from './IslamicOrnaments';

interface FeatureItem {
  id: string;
  numberArabic: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tag?: string;
}

export const FeaturesSection: React.FC = () => {
  const features: FeatureItem[] = [
    {
      id: 'prayers',
      numberArabic: '01',
      title: 'الصلوات الفائتة',
      description: 'متابعة وحساب ما تبقى عليك من صلوات بطريقة واضحة ومنظمة مع تسجيل الإنجاز اليومي بسلاسة.',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 3c-4 4-8 8-8 14a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4c0-6-4-10-8-14z" />
          <path d="M12 3v4" />
          <path d="M8 17h8" strokeLinecap="round" />
        </svg>
      ),
      tag: 'المحور الأساسي',
    },
    {
      id: 'fasting',
      numberArabic: '02',
      title: 'الصيام',
      description: 'تتبع أيام الصيام التي تحتاج إلى قضائها من رمضان أو النذور مع روزنامة ميسرة لتوثيق الأيام.',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
        </svg>
      ),
    },
    {
      id: 'istighfar',
      numberArabic: '03',
      title: 'الاستغفار',
      description: 'هدف يومي بسيط لملازمة الاستغفار مع مسبحة هادئة تتيح لك متابعة استمرارك دون تشتيت.',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8" strokeLinecap="round" />
          <path d="M8 12h8" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'quran',
      numberArabic: '04',
      title: 'القرآن والورد',
      description: 'نظم وردك اليومي وثبت علاقتك بكتاب الله عبر حفظ موضع قراءتك ومتابعة ختمتك بيسر.',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      ),
    },
    {
      id: 'dhikr',
      numberArabic: '05',
      title: 'الأذكار والدعاء',
      description: 'أذكار الصباح والمساء وأدعية مختارة تساعدك على دوام ذكر الله والشعور بالسكينة في يومك.',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'zakat',
      numberArabic: '06',
      title: 'الزكاة',
      description: 'حساب دقيق وميسر لمستحقات الزكاة السنوية وفق النصاب الشرعي مع توثيق أدائها براحة بال.',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <circle cx="12" cy="12" r="3" />
          <path d="M6 12h.01M18 12h.01" />
        </svg>
      ),
    },
  ];

  return (
    <section
      id="features"
      className="relative py-24 sm:py-32 bg-[#F6F1E7] text-[#1D211E] overflow-hidden"
      dir="rtl"
    >
      {/* Background Subtle Islamic Geometric Dot Grid (3-4% Opacity) */}
      <div className="absolute inset-0 islamic-pattern-subtle pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#26352A]/5 border border-[#C6A15B]/30 text-[#26352A] mb-4">
            <StarEightPoint size={12} color="#C6A15B" />
            <span className="text-xs font-semibold tracking-wider font-landing-display">
              رفيق العبادة الشامل
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-landing-display text-[#26352A] tracking-tight leading-[1.25] mb-5">
            كل ما تحتاجه للعودة، في مكان واحد.
          </h2>

          <p className="text-base sm:text-lg text-[#26352A]/75 font-normal leading-relaxed max-w-2xl mx-auto">
            صُمم تطبيق قضاء ليمنحك وضوحاً تاماً في أداء ما فاتك من عبادات، بنظام هادئ يركز على الاستمرارية ويسر العمل الصالح.
          </p>

          <OrnamentalDivider accentColor="#C6A15B" />
        </div>

        {/* Editorial Feature Layout — Clean Architectural Lines & Generous Spacing */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="group relative p-8 rounded-2xl bg-white/60 hover:bg-white border border-[#26352A]/8 hover:border-[#C6A15B]/40 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-[#26352A]/5 flex flex-col justify-between"
            >
              {/* Subtle top corner arch line */}
              <div className="absolute top-3 left-4 opacity-15 group-hover:opacity-30 transition-opacity">
                <SubtleArch className="w-6 h-8 text-[#C6A15B]" color="#C6A15B" />
              </div>

              <div>
                {/* Header of each feature: Number & Icon */}
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#26352A]/5 text-[#26352A] group-hover:bg-[#26352A] group-hover:text-[#F6F1E7] flex items-center justify-center transition-colors duration-300">
                    {feature.icon}
                  </div>
                  <span className="text-2xl font-bold font-spiritual-serif text-[#C6A15B] tracking-wider">
                    {feature.numberArabic}
                  </span>
                </div>

                {/* Feature Title */}
                <h3 className="text-xl font-bold text-[#26352A] font-landing-display mb-3 group-hover:text-[#18231C] transition-colors">
                  {feature.title}
                </h3>

                {/* Feature Description */}
                <p className="text-sm sm:text-base text-[#1D211E]/75 leading-relaxed font-normal">
                  {feature.description}
                </p>
              </div>

              {/* Bottom Subtle Accent */}
              <div className="pt-6 mt-6 border-t border-[#26352A]/5 flex items-center justify-between text-xs text-[#26352A]/60">
                <span className="flex items-center gap-1.5 group-hover:text-[#C6A15B] transition-colors">
                  <StarEightPoint size={10} color="currentColor" />
                  <span>تتبع ميسر ودقيق</span>
                </span>
                {feature.tag && (
                  <span className="px-2 py-0.5 rounded-full bg-[#C6A15B]/15 text-[#26352A] text-[11px] font-medium">
                    {feature.tag}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Editorial Spiritual Quote */}
        <div className="mt-20 text-center max-w-2xl mx-auto py-10 px-8 rounded-3xl bg-[#26352A]/[0.03] border border-[#C6A15B]/20">
          <p className="text-xl sm:text-2xl text-[#26352A] font-spiritual-serif leading-relaxed mb-3">
            «وَإِنِّي لَغَفَّارٌ لِّمَن تَابَ وَآمَنَ وَعَمِلَ صَالِحًا ثُمَّ اهْتَدَىٰ»
          </p>
          <span className="text-xs text-[#26352A]/60 font-sans tracking-wide">
            سورة طه — آية 82
          </span>
        </div>
      </div>
    </section>
  );
};
