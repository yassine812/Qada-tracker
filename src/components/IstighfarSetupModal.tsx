import React, { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { IstighfarData } from '../types';
import { formatArabicNumber } from '../utils/calculator';

interface IstighfarSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingData: IstighfarData | null;
  onSave: (startAge: number, currentAge: number, dailyTarget: number) => Promise<void>;
}

export const IstighfarSetupModal: React.FC<IstighfarSetupModalProps> = ({
  isOpen,
  onClose,
  existingData,
  onSave,
}) => {
  const [startAge, setStartAge] = useState<number>(existingData?.startAge || 14);
  const [currentAge, setCurrentAge] = useState<number>(existingData?.currentAge || 25);
  const [dailyTarget, setDailyTarget] = useState<number>(existingData?.dailyTarget || 70);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const years = currentAge - startAge;
  const totalEstimated = years * 365 * dailyTarget;

  const handleSave = async () => {
    if (startAge >= currentAge) return;
    if (dailyTarget <= 0) return;
    setIsSaving(true);
    await onSave(startAge, currentAge, dailyTarget);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FAF9F5] dark:bg-[#252622] border border-[#E8E4D9] dark:border-[#3D3E37] rounded-3xl p-6 max-w-sm w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-full text-[#8E8E80] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <h3 className="font-bold text-lg font-brand-serif text-[#2D2D2A] dark:text-[#EAE7E0]">
            إعداد الاستغفار السابق
          </h3>
          <p className="text-xs text-[#8E8E80] dark:text-[#A6A699] mt-1">
            تقدير شخصي لعدد مرات الاستغفار التي فاتتك
          </p>
        </div>

        <div className="space-y-4">
          {/* Start Age */}
          <div className="bg-[#F0EEE6] dark:bg-[#1C1D1A] p-4 rounded-2xl border border-[#E8E4D9] dark:border-[#3D3E37]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-[#2D2D2A] dark:text-[#EAE7E0]">
                عمرك عند البدء بالاستغفار
              </span>
            </div>
            <div className="flex items-center justify-between bg-[#FAF9F5] dark:bg-[#252622] rounded-xl p-1.5 border border-[#E8E4D9] dark:border-[#3D3E37]">
              <button
                type="button"
                onClick={() => setStartAge((v) => Math.max(7, v - 1))}
                className="w-10 h-10 rounded-lg bg-[#F0EEE6] dark:bg-[#1C1D1A] flex items-center justify-center text-[#2D2D2A] dark:text-white"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold text-lg font-brand-serif text-[#5A5A40] dark:text-[#C8C7B9]">
                {startAge} سنة
              </span>
              <button
                type="button"
                onClick={() => setStartAge((v) => Math.min(currentAge - 1, v + 1))}
                className="w-10 h-10 rounded-lg bg-[#5A5A40] dark:bg-[#C8C7B9] text-white dark:text-[#1C1D1A] flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Current Age */}
          <div className="bg-[#F0EEE6] dark:bg-[#1C1D1A] p-4 rounded-2xl border border-[#E8E4D9] dark:border-[#3D3E37]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-[#2D2D2A] dark:text-[#EAE7E0]">
                عمرك الحالي
              </span>
            </div>
            <div className="flex items-center justify-between bg-[#FAF9F5] dark:bg-[#252622] rounded-xl p-1.5 border border-[#E8E4D9] dark:border-[#3D3E37]">
              <button
                type="button"
                onClick={() => setCurrentAge((v) => Math.max(startAge + 1, v - 1))}
                className="w-10 h-10 rounded-lg bg-[#F0EEE6] dark:bg-[#1C1D1A] flex items-center justify-center text-[#2D2D2A] dark:text-white"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold text-lg font-brand-serif text-[#5A5A40] dark:text-[#C8C7B9]">
                {currentAge} سنة
              </span>
              <button
                type="button"
                onClick={() => setCurrentAge((v) => Math.min(120, v + 1))}
                className="w-10 h-10 rounded-lg bg-[#5A5A40] dark:bg-[#C8C7B9] text-white dark:text-[#1C1D1A] flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Daily Target */}
          <div className="bg-[#F0EEE6] dark:bg-[#1C1D1A] p-4 rounded-2xl border border-[#E8E4D9] dark:border-[#3D3E37]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-[#2D2D2A] dark:text-[#EAE7E0]">
                الهدف اليومي
              </span>
              <span className="text-xs text-[#8E8E80] dark:text-[#A6A699]">
                مرة يومياً
              </span>
            </div>
            <div className="flex items-center justify-between bg-[#FAF9F5] dark:bg-[#252622] rounded-xl p-1.5 border border-[#E8E4D9] dark:border-[#3D3E37]">
              <button
                type="button"
                onClick={() => setDailyTarget((v) => Math.max(1, v - 10))}
                className="w-10 h-10 rounded-lg bg-[#F0EEE6] dark:bg-[#1C1D1A] flex items-center justify-center text-[#2D2D2A] dark:text-white"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold text-lg font-brand-serif text-[#5A5A40] dark:text-[#C8C7B9]">
                {dailyTarget}
              </span>
              <button
                type="button"
                onClick={() => setDailyTarget((v) => v + 10)}
                className="w-10 h-10 rounded-lg bg-[#5A5A40] dark:bg-[#C8C7B9] text-white dark:text-[#1C1D1A] flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calculation Preview */}
          <div className="bg-[#FAF9F5] dark:bg-[#252622] p-4 rounded-2xl border border-[#E8E4D9] dark:border-[#3D3E37] text-center">
            <span className="text-xs text-[#8E8E80] dark:text-[#A6A699] font-medium block">
              النتيجة التقديرية:
            </span>
            <div className="font-bold text-2xl font-brand-serif text-[#5A5A40] dark:text-[#C8C7B9] mt-1">
              {formatArabicNumber(totalEstimated)} استغفار
            </div>
            <p className="text-[11px] text-[#8E8E80] dark:text-[#A6A699] mt-1">
              ({years} سنوات × 365 يوم × {dailyTarget} مرة)
            </p>
          </div>

          <p className="text-[10px] text-[#8E8E80] dark:text-[#A6A699] text-center leading-relaxed">
            هذا تقدير شخصي وليس حكم شرعي. يُرجى الرجوع إلى عالم موثوق لمعرفة الحكم الشرعي المناسب لحالتك.
          </p>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-[#E8E4D9] dark:bg-[#3D3E37] text-[#2D2D2A] dark:text-[#EAE7E0] font-semibold text-sm rounded-2xl hover:opacity-90 transition-opacity"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || startAge >= currentAge}
              className="flex-1 py-3 bg-[#5A5A40] hover:bg-[#484833] dark:bg-[#C8C7B9] dark:hover:bg-[#B8B7A8] dark:text-[#1C1D1A] text-white font-semibold text-sm rounded-2xl transition-all shadow-md disabled:opacity-40"
            >
              {isSaving ? 'جاري الحفظ...' : 'حفظ الإعداد'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
