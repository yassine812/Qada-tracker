import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { getWelcomeMessage } from '../../utils/welcomeMessageBuilder';
import { WelcomeIllustration } from './WelcomeIllustration';
import { TactileButton } from '../ui/MotionPrimitives';
import { StarEightPoint, IslamicPatternBackground } from '../landing/IslamicOrnaments';

interface PersonalizedWelcomeScreenProps {
  userName: string;
  gender?: 'male' | 'female' | null;
  onContinue: () => void;
}

export const PersonalizedWelcomeScreen: React.FC<PersonalizedWelcomeScreenProps> = ({
  userName,
  gender,
  onContinue,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const welcome = getWelcomeMessage(userName, gender);

  // Sequential Motion Choreography
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.14,
        delayChildren: shouldReduceMotion ? 0 : 0.08,
      },
    },
  };

  const itemFadeUp = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.2 : 0.65,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  const illustrationScale = {
    hidden: { opacity: 0, scale: shouldReduceMotion ? 1 : 0.88 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: shouldReduceMotion ? 0.2 : 0.75,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <div className="relative min-h-[92vh] sm:min-h-screen flex flex-col justify-between py-6 px-4 sm:px-6 overflow-hidden select-none">
      {/* 1. Ambient Spiritual Background & Pattern */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Warm golden light glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-radial from-[#C6A15B]/15 via-[#C6A15B]/5 to-transparent blur-3xl" />
        <IslamicPatternBackground opacity={0.035} />
      </div>

      {/* Top Header Badge */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#26352A]/10 dark:bg-[#C6A15B]/15 border border-[#C6A15B]/30 flex items-center justify-center text-[#C6A15B]">
            <StarEightPoint size={12} color="#C6A15B" />
          </div>
          <span className="font-bold text-base font-landing-display tracking-tight text-[#1D211E] dark:text-[#F6F1E7]">
            قضاء
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C6A15B]/10 border border-[#C6A15B]/20 text-[11px] font-semibold text-[#C6A15B]">
          <StarEightPoint size={10} color="#C6A15B" />
          <span>{welcome.categoryTitle}</span>
        </div>
      </motion.div>

      {/* Center Welcome Sequence Card */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-md mx-auto w-full my-auto py-3 sm:py-5 flex flex-col items-center text-center"
      >
        {/* 2. Symbolic Islamic Arch & Glowing Lantern */}
        <motion.div variants={illustrationScale} className="mb-3 sm:mb-5">
          <WelcomeIllustration type={welcome.category} />
        </motion.div>

        {/* 3 & 4. "أهلًا بك" + User Name Heading */}
        <motion.div variants={itemFadeUp} className="space-y-1 mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold font-landing-display tracking-tight text-[#1D211E] dark:text-[#F6F1E7]">
            {welcome.welcomeHeading}
          </h1>
          <p className="text-xs sm:text-sm text-[#7E8C7F] dark:text-[#A9B7A3] font-medium">
            مرحبًا بك في رفيقك لقضاء ما فاتك وإتمام عبادتك
          </p>
        </motion.div>

        {/* 5, 6, 7. Content Box: Connection, Verified Reference, Closing Dua */}
        <motion.div
          variants={itemFadeUp}
          className="w-full rounded-3xl p-5 sm:p-6 bg-white/80 dark:bg-[#1F2E24]/85 backdrop-blur-md border border-[#C6A15B]/25 shadow-[0_8px_32px_rgba(24,35,28,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] space-y-4 text-right"
        >
          {/* 5. Natural Islamic Connection Statement */}
          <p className="text-sm sm:text-base font-medium text-[#26352A] dark:text-[#E2E8DF] leading-relaxed">
            {welcome.connectionLead}
          </p>

          {/* 6. Verified Qur'an Reference Card (with exact Western Ayah numbers) */}
          {welcome.quranReference && (
            <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-[#FAF6EE] dark:bg-[#18231C] border border-[#C6A15B]/30 text-center shadow-inner">
              <div className="absolute top-2 right-3 text-[#C6A15B]/25 pointer-events-none">
                <StarEightPoint size={12} color="#C6A15B" />
              </div>
              <div className="absolute bottom-2 left-3 text-[#C6A15B]/25 pointer-events-none">
                <StarEightPoint size={12} color="#C6A15B" />
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[#C6A15B] text-[11px] font-semibold mb-2">
                <BookOpen className="w-3.5 h-3.5" />
                <span>قال الله تعالى</span>
              </div>

              {/* Verified Ayah Text in Amiri Font */}
              <p
                className="font-quran text-lg sm:text-xl text-[#1D211E] dark:text-[#F6F1E7] leading-loose px-1"
                style={{ fontFamily: "'Amiri', serif" }}
              >
                ﴿ {welcome.quranReference.ayahText} ﴾
              </p>

              {/* Reference Badge with Western numbers */}
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C6A15B]/15 text-[11px] font-bold text-[#C6A15B] border border-[#C6A15B]/20">
                <span>{welcome.quranReference.surahArabicRef}</span>
              </div>
            </div>
          )}

          {/* Hadith Reference Card (if present and no Quran reference) */}
          {!welcome.quranReference && welcome.hadithReference && (
            <div className="relative overflow-hidden rounded-2xl p-4 bg-[#FAF6EE] dark:bg-[#18231C] border border-[#C6A15B]/25 text-center">
              <p className="text-xs sm:text-sm font-medium text-[#1D211E] dark:text-[#F6F1E7] leading-relaxed mb-2">
                {welcome.hadithReference.matn}
              </p>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#C6A15B]/15 text-[10px] font-bold text-[#C6A15B]">
                {welcome.hadithReference.source}
                {welcome.hadithReference.hadithNumber ? ` (${welcome.hadithReference.hadithNumber})` : ''}
              </span>
            </div>
          )}

          {/* 7. Final Spiritual Sentence / Dua */}
          <div className="pt-2 border-t border-[#C6A15B]/15">
            <p className="text-xs sm:text-sm text-[#4E5D4F] dark:text-[#A9B7A3] font-medium leading-relaxed">
              {welcome.closingDua}
            </p>
          </div>

          {/* Authentic Citation Metadata Tag */}
          {welcome.sourceReference && (
            <div className="pt-1 flex items-center justify-between text-[10px] text-[#7E8C7F] dark:text-[#A9B7A3]/70 font-mono">
              <span>المصدر الموثّق:</span>
              <span>{welcome.sourceReference}</span>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* 8. Bottom CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: shouldReduceMotion ? 0 : 0.75, duration: 0.45 }}
        className="relative z-10 max-w-md mx-auto w-full pt-3 pb-1"
      >
        <TactileButton
          onClick={onContinue}
          className="w-full py-4 px-6 rounded-2xl bg-[#26352A] dark:bg-[#C6A15B] text-[#F6F1E7] dark:text-[#18231C] font-bold text-sm sm:text-base flex items-center justify-center gap-2 hover:bg-[#18231C] dark:hover:bg-[#d8b56f] transition-all shadow-lg shadow-[#26352A]/20 dark:shadow-[#C6A15B]/20 cursor-pointer"
        >
          <span>{welcome.ctaText}</span>
          <ArrowLeft className="w-4 h-4 rtl:rotate-0" />
        </TactileButton>

        <p className="text-[11px] text-[#7E8C7F] dark:text-[#A9B7A3] text-center mt-2">
          خطوتك الأولى نحو تمام الطمأنينة وإبراء الذمة
        </p>
      </motion.div>
    </div>
  );
};
