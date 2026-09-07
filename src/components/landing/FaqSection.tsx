import React, { useState } from 'react';
import { StarEightPoint, OrnamentalDivider } from './IslamicOrnaments';

interface FaqItem {
  question: string;
  answer: string;
}

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    {
      question: 'كيف يتم حساب الصلوات الفائتة في التطبيق؟',
      answer: 'عند أول استخدام، يسألك التطبيق عن عمر البلوغ التقريبي وعمرك الحالي ومستوى التزامك خلال تلك السنوات، بالإضافة إلى مراعاة فترات العذر الشرعي للنساء، ليقوم بحساب إجمالي الصلوات الفائتة بدقة مع إمكانية تعديل الأرقام يدوياً بحسب تقديرك الشخصي في أي وقت.',
    },
    {
      question: 'أين تُخزن بياناتي وهل يمكنني تصديرها أو نقلها؟',
      answer: 'تُخزن جميع سجلاتك محلياً على جهازك باستخدام تقنية IndexedDB. لا توجد خوادم خارجية تحتفظ ببياناتك. كما يمكنك في أي وقت تصدير نسخة احتياطية كاملة بصيغة ملف JSON واستعادتها على أي جهاز آخر بضغطة زر واحدة من شاشة الإعدادات.',
    },
    {
      question: 'هل يعمل التطبيق بدون اتصال بالإنترنت (Offline)؟',
      answer: 'نعم تماماً. قضاء هو تطبيق ويب تقدمي (PWA) متكامل، ما يعني أنه يعمل بكفاءة تامة بدون اتصال بالإنترنت، ويمكنك تثبيته على شاشة هاتفك الرئيسية (iOS و Android) ليعمل كتطبيق أصيل وسريع.',
    },
    {
      question: 'هل تطبيق قضاء مجاني؟ وهل يحتوي على إعلانات؟',
      answer: 'تطبيق قضاء مجاني بالكامل وبدون أي إعلانات تجارية. هدفنا هو تقديم عمل خالص ونافع يعين المسلم على قضاء ما عليه بكل طمأنينة وراحة بال دون تشويش أو استغلال.',
    },
    {
      question: 'كيف يساعدني التطبيق على الاستمرار دون انقطاع؟',
      answer: 'يعتمد قضاء على فلسفة «قليلٌ دائم»؛ بدلاً من وضع أهداف مستحيلة، يمكنك تحديد معدل قضاء مريح مع كل صلاة حاضرة، وتتبع مسار التزامك اليومي (Streak) والاحتفال بالتقدم المحرز خطوة بخطوة.',
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      id="faq"
      className="relative py-24 sm:py-32 bg-[#F6F1E7] text-[#1D211E] overflow-hidden border-t border-[#26352A]/10"
      dir="rtl"
    >
      <div className="relative max-w-4xl mx-auto px-6 sm:px-10 lg:px-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#26352A]/5 border border-[#C6A15B]/30 text-[#26352A] mb-4">
            <StarEightPoint size={12} color="#C6A15B" />
            <span className="text-xs font-semibold tracking-wider font-landing-display">
              إجابات واضحة
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold font-landing-display text-[#26352A] tracking-tight mb-4">
            الأسئلة الشائعة
          </h2>

          <p className="text-sm sm:text-base text-[#26352A]/70 max-w-xl mx-auto">
            كل ما تود معرفته عن طريقة عمل قضاء، أمان بياناتك، وكيفية البدء في رحلة التعويض.
          </p>

          <OrnamentalDivider accentColor="#C6A15B" />
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.question}
                className="rounded-2xl bg-white/70 border border-[#26352A]/8 overflow-hidden transition-all duration-300 hover:border-[#C6A15B]/35 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full p-6 text-right flex items-center justify-between gap-4 cursor-pointer select-none"
                  aria-expanded={isOpen}
                >
                  <span className="text-base sm:text-lg font-bold text-[#26352A] font-landing-display">
                    {faq.question}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full border border-[#26352A]/10 flex items-center justify-center shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 bg-[#26352A] text-[#F6F1E7]' : 'text-[#26352A]'
                    }`}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-sm sm:text-base text-[#1D211E]/80 leading-relaxed border-t border-[#26352A]/5 animate-in fade-in duration-300">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
