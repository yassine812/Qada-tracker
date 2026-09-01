import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { IstighfarData } from '../types';
import { formatArabicNumber } from '../utils/calculator';

interface IstighfarEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: IstighfarData;
  onUpdate: (newTotal: number) => Promise<void>;
}

export const IstighfarEditModal: React.FC<IstighfarEditModalProps> = ({
  isOpen,
  onClose,
  data,
  onUpdate,
}) => {
  const [newTotal, setNewTotal] = useState<string>(String(data.totalEstimated));
  const [confirmStep, setConfirmStep] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const parsedTotal = parseInt(newTotal, 10);
  const isValid = !isNaN(parsedTotal) && parsedTotal >= 0;
  const newRemaining = isValid ? parsedTotal - data.completed : 0;

  const handleSave = async () => {
    if (!isValid) {
      setErrorMsg('الرجاء إدخال عدد صحيح غير سالب');
      return;
    }
    if (!confirmStep) {
      setConfirmStep(true);
      return;
    }
    await onUpdate(parsedTotal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FAF9F5] dark:bg-[#252622] border border-[#E8E4D9] dark:border-[#3D3E37] rounded-3xl p-6 max-w-sm w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => { setConfirmStep(false); onClose(); }}
          className="absolute top-4 left-4 p-2 rounded-full text-[#8E8E80] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <h3 className="font-bold text-lg font-brand-serif text-[#2D2D2A] dark:text-[#EAE7E0]">
            تعديل تقدير الاستغفار
          </h3>
          <p className="text-xs text-[#8E8E80] dark:text-[#A6A699] mt-1">
            يمكنك تعديل الإجمالي يدوياً
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-[#F0EEE6] dark:bg-[#1C1D1A] p-4 rounded-2xl border border-[#E8E4D9] dark:border-[#3D3E37]">
            <div className="flex items-center justify-between mb-2 text-xs">
              <span className="text-[#8E8E80] dark:text-[#A6A699]">الإجمالي الحالي</span>
              <span className="font-semibold text-[#2D2D2A] dark:text-[#EAE7E0]">{formatArabicNumber(data.totalEstimated)}</span>
            </div>
            <div className="flex items-center justify-between mb-2 text-xs">
              <span className="text-[#8E8E80] dark:text-[#A6A699]">المقضي حالياً</span>
              <span className="font-semibold text-[#5A5A40] dark:text-[#C8C7B9]">{formatArabicNumber(data.completed)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2D2D2A] dark:text-[#EAE7E0] mb-1.5">
              الإجمالي الجديد:
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={newTotal}
              onChange={(e) => { setNewTotal(e.target.value); setConfirmStep(false); setErrorMsg(null); }}
              className="w-full px-4 py-3 bg-[#F0EEE6] dark:bg-[#1C1D1A] border border-[#E8E4D9] dark:border-[#3D3E37] rounded-2xl text-xl font-bold font-brand-serif text-[#2D2D2A] dark:text-white text-center focus:outline-none focus:border-[#5A5A40] dark:focus:border-[#C8C7B9]"
              placeholder="أدخل الإجمالي الجديد"
            />
          </div>

          {isValid && (
            <div className="bg-[#FAF9F5] dark:bg-[#252622] p-3 rounded-2xl border border-[#E8E4D9] dark:border-[#3D3E37] text-center text-xs">
              <span className="text-[#8E8E80] dark:text-[#A6A699]">المتبقي الجديد: </span>
              <span className="font-bold text-[#C97C5D]">{formatArabicNumber(newRemaining)}</span>
            </div>
          )}

          {errorMsg && (
            <p className="text-xs text-rose-600 dark:text-rose-400 text-center font-medium">{errorMsg}</p>
          )}

          {confirmStep && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                هل أنت متأكد من تغيير الإجمالي إلى <strong>{formatArabicNumber(parsedTotal)}</strong>؟
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => { setConfirmStep(false); onClose(); }}
              className="flex-1 py-3 bg-[#E8E4D9] dark:bg-[#3D3E37] text-[#2D2D2A] dark:text-[#EAE7E0] font-semibold text-sm rounded-2xl hover:opacity-90 transition-opacity"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isValid}
              className={`flex-1 py-3 font-semibold text-sm rounded-2xl text-white transition-all shadow-md ${confirmStep ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#5A5A40] hover:bg-[#484833] dark:bg-[#C8C7B9] dark:hover:bg-[#B8B7A8] dark:text-[#1C1D1A]'}`}
            >
              {confirmStep ? 'تأكيد التعديل' : 'حفظ التعديل'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
