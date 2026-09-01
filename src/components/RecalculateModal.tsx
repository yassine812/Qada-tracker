import React, { useState } from 'react';
import { X, Plus, Minus, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateMissedPrayers, formatArabicNumber } from '../utils/calculator';

interface RecalculateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecalculateModal: React.FC<RecalculateModalProps> = ({ isOpen, onClose }) => {
  const { settings, recalculatePrayers } = useApp();
  const [pubertyAge, setPubertyAge] = useState<number>(settings?.pubertyAge || 14);
  const [currentAge, setCurrentAge] = useState<number>(settings?.currentAge || 25);
  const [frequency, setFrequency] = useState<number>(settings?.prayerFrequency || 0);
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen) return null;

  const previewCalc = calculateMissedPrayers(pubertyAge, currentAge, frequency);

  const handleApply = async () => {
    if (pubertyAge >= currentAge) {
      return;
    }
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }
    await recalculatePrayers(pubertyAge, currentAge, frequency);
    setIsConfirming(false);
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
            إعادة حساب الصلوات
          </h3>
          <p className="text-xs text-[#8E8E80] dark:text-[#A6A699] mt-1">
            تعديل معايير الحساب وتحديث العدادات بناءً على التقدير الجديد
          </p>
        </div>

        <div className="space-y-4">
          {/* Puberty Age */}
          <div className="bg-[#F0EEE6] dark:bg-[#1C1D1A] p-4 rounded-2xl border border-[#E8E4D9] dark:border-[#3D3E37]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-[#2D2D2A] dark:text-[#EAE7E0]">
                سن البلوغ
              </span>
              <span className="text-xs text-[#8E8E80] dark:text-[#A6A699]">
                بدء التكليف
              </span>
            </div>
            <div className="flex items-center justify-between bg-[#FAF9F5] dark:bg-[#252622] rounded-xl p-1.5 border border-[#E8E4D9] dark:border-[#3D3E37]">
              <button
                type="button"
                onClick={() => setPubertyAge((v) => Math.max(7, v - 1))}
                className="w-10 h-10 rounded-lg bg-[#F0EEE6] dark:bg-[#1C1D1A] flex items-center justify-center text-[#2D2D2A] dark:text-white"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold text-lg font-brand-serif text-[#5A5A40] dark:text-[#C8C7B9]">
                {pubertyAge} سنة
              </span>
              <button
                type="button"
                onClick={() => setPubertyAge((v) => Math.min(currentAge - 1, v + 1))}
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
                العمر الحالي
              </span>
              <span className="text-xs text-[#8E8E80] dark:text-[#A6A699]">
                عمرك الآن
              </span>
            </div>
            <div className="flex items-center justify-between bg-[#FAF9F5] dark:bg-[#252622] rounded-xl p-1.5 border border-[#E8E4D9] dark:border-[#3D3E37]">
              <button
                type="button"
                onClick={() => setCurrentAge((v) => Math.max(pubertyAge + 1, v - 1))}
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

          {/* Percentage */}
          <div className="bg-[#F0EEE6] dark:bg-[#1C1D1A] p-4 rounded-2xl border border-[#E8E4D9] dark:border-[#3D3E37]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-[#2D2D2A] dark:text-[#EAE7E0]">
                نسبة الالتزام السابقة
              </span>
              <span className="text-sm font-bold font-brand-serif text-[#5A5A40] dark:text-[#C8C7B9]">
                {frequency}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={frequency}
              onChange={(e) => setFrequency(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[11px] text-[#8E8E80] dark:text-[#A6A699]">
              <span>0% (لم أصلي)</span>
              <span>100% (ملتزم تماماً)</span>
            </div>
          </div>

          {/* Live Preview of Calculation */}
          <div className="bg-[#FAF9F5] dark:bg-[#252622] p-4 rounded-2xl border border-[#E8E4D9] dark:border-[#3D3E37] text-center">
            <span className="text-xs text-[#8E8E80] dark:text-[#A6A699] font-medium block">
              النتيجة التقديرية الجديدة:
            </span>
            <div className="font-bold text-2xl font-brand-serif text-[#5A5A40] dark:text-[#C8C7B9] mt-1">
              {formatArabicNumber(previewCalc.estimatedMissed)} صلاة
            </div>
            <p className="text-[11px] text-[#8E8E80] dark:text-[#A6A699] mt-1">
              ({previewCalc.years} سنوات = {formatArabicNumber(previewCalc.days)} يوم × 5 صلوات)
            </p>
          </div>

          {isConfirming && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                تنبيه: سيتم إعادة تعيين عداد الصلوات المتبقية إلى التقدير الجديد ({formatArabicNumber(previewCalc.estimatedMissed)}). هل تريد المتابعة؟
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsConfirming(false);
                onClose();
              }}
              className="flex-1 py-3 bg-[#E8E4D9] dark:bg-[#3D3E37] text-[#2D2D2A] dark:text-[#EAE7E0] font-semibold text-sm rounded-2xl hover:opacity-90 transition-opacity"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleApply}
              className={`flex-1 py-3 font-semibold text-sm rounded-2xl text-white transition-all shadow-md ${
                isConfirming ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#5A5A40] hover:bg-[#484833] dark:bg-[#C8C7B9] dark:hover:bg-[#B8B7A8] dark:text-[#1C1D1A]'
              }`}
            >
              {isConfirming ? 'تأكيد الحساب' : 'تطبيق الحساب'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
