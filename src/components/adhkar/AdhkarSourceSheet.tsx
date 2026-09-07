import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BookOpen, X } from 'lucide-react';
import { AdhkarItem } from '../../types';
import { StarEightPoint } from '../landing/IslamicOrnaments';
import { TactileButton } from '../ui/MotionPrimitives';

/**
 * Bottom sheet showing the VERIFIED source of a given dhikr item.
 * The religious-integrity note is part of the product promise: no
 * fabricated text is ever surfaced, and every item carries a real,
 * checkable reference.
 */
export const AdhkarSourceSheet: React.FC<{
  item: AdhkarItem | null;
  onClose: () => void;
}> = ({ item, onClose }) => {
  return (
    <AnimatePresence>
      {item && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="relative w-full max-w-md mx-auto rounded-t-3xl bg-[#FAF7F2] dark:bg-[#1F2E24] border-t border-x border-[#C6A15B]/25 p-6 pb-8 shadow-2xl text-right"
            dir="rtl"
          >
            <div className="mx-auto w-10 h-1 rounded-full bg-black/10 dark:bg-white/10 mb-5" />

            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#C6A15B]/15 text-[#C6A15B] flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-landing-display text-[#1D211E] dark:text-[#F6F1E7]">
                    مصدر هذا الذكر
                  </h3>
                  <span className="text-[10px] text-[#7E8C7F] dark:text-[#A9B7A3]">
                    مرجع موثوق من القرآن والسنة
                  </span>
                </div>
              </div>
              <TactileButton
                onClick={onClose}
                ariaLabel="إغلاق"
                className="p-2 rounded-xl bg-black/5 dark:bg-white/5 text-[#7E8C7F] hover:text-[#1D211E] dark:hover:text-[#F6F1E7]"
              >
                <X className="w-4 h-4" />
              </TactileButton>
            </div>

            <div className="rounded-2xl bg-white dark:bg-[#18231C] border border-[#C6A15B]/20 p-5 space-y-3">
              <div className="flex items-center gap-1.5">
                <StarEightPoint size={12} color="#C6A15B" />
                <span className="text-xs font-bold text-[#C6A15B]">{item.title}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#F6F1E7] dark:bg-[#26352A] p-3">
                  <span className="block text-[10px] text-[#7E8C7F] dark:text-[#A9B7A3] mb-0.5">
                    المرجع
                  </span>
                  <span className="text-xs font-bold text-[#1D211E] dark:text-[#F6F1E7]">
                    {item.source}
                  </span>
                </div>
                <div className="rounded-xl bg-[#F6F1E7] dark:bg-[#26352A] p-3">
                  <span className="block text-[10px] text-[#7E8C7F] dark:text-[#A9B7A3] mb-0.5">
                    الموضع / الحديث
                  </span>
                  <span className="text-xs font-bold text-[#1D211E] dark:text-[#F6F1E7]">
                    {item.sourceReference}
                  </span>
                </div>
              </div>

              {item.sourceInfo && (
                <p className="text-[11px] leading-relaxed text-[#4A584C] dark:text-[#A9B7A3] font-spiritual-serif bg-[#C6A15B]/10 rounded-xl p-3">
                  {item.sourceInfo}
                </p>
              )}

              <div className="flex items-center gap-1.5 text-[10px] text-[#7E8C7F] dark:text-[#A9B7A3]">
                <BookOpen className="w-3 h-3 text-[#C6A15B]" />
                <span>نُصوص الأذكار منقولة حرفيًا من مصادر موثوقة (كتاب حصن المسلم) دون تحريف.</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};