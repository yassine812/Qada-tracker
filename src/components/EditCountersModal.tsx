import React, { useState } from 'react';
import { X, Check, Edit2, AlertCircle } from 'lucide-react';
import { PRAYERS_LIST, PrayerKey } from '../types';
import { useApp } from '../context/AppContext';
import { formatArabicNumber } from '../utils/calculator';

interface EditCountersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditCountersModal: React.FC<EditCountersModalProps> = ({ isOpen, onClose }) => {
  const { counters, updatePrayerRemainingCount } = useApp();
  const [selectedPrayer, setSelectedPrayer] = useState<PrayerKey | null>(null);
  const [newValue, setNewValue] = useState<string>('');
  const [confirmStep, setConfirmStep] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !counters) return null;

  const handleStartEdit = (key: PrayerKey) => {
    setSelectedPrayer(key);
    setNewValue(String(counters[key].remaining));
    setConfirmStep(false);
    setErrorMsg(null);
  };

  const handleSave = async () => {
    if (!selectedPrayer) return;
    const num = Number(newValue.trim());
    if (isNaN(num) || !Number.isInteger(num) || num < 0) {
      setErrorMsg('الرجاء إدخال عدد صحيح غير سالب بدون كسور أو أرقام عشرية');
      return;
    }

    if (!confirmStep) {
      setConfirmStep(true);
      return;
    }

    const success = await updatePrayerRemainingCount(selectedPrayer, num);
    if (success) {
      setSelectedPrayer(null);
      setConfirmStep(false);
      setErrorMsg(null);
    }
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
            تعديل أعداد الصلوات المتبقية
          </h3>
          <p className="text-xs text-[#8E8E80] dark:text-[#A6A699] mt-1">
            يمكنك تصحيح العدد المتبقي لأي صلاة يدوياً
          </p>
        </div>

        {selectedPrayer ? (
          <div className="space-y-4">
            <div className="bg-[#F0EEE6] dark:bg-[#1C1D1A] p-4 rounded-2xl text-center border border-[#E8E4D9] dark:border-[#3D3E37]">
              <span className="text-xs text-[#8E8E80] dark:text-[#A6A699] block mb-1">
                الصلاة المختارة
              </span>
              <h4 className="font-bold text-xl font-brand-serif text-[#5A5A40] dark:text-[#C8C7B9]">
                {PRAYERS_LIST.find((p) => p.key === selectedPrayer)?.arabicName}
              </h4>
              <p className="text-xs text-[#8E8E80] dark:text-[#A6A699] mt-1">
                العدد الحالي: {formatArabicNumber(counters[selectedPrayer].remaining)}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D2D2A] dark:text-[#EAE7E0] mb-1.5">
                العدد المتبقي الجديد:
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={newValue}
                onChange={(e) => {
                  setNewValue(e.target.value);
                  setConfirmStep(false);
                  setErrorMsg(null);
                }}
                className="w-full px-4 py-3 bg-[#F0EEE6] dark:bg-[#1C1D1A] border border-[#E8E4D9] dark:border-[#3D3E37] rounded-2xl text-xl font-bold font-brand-serif text-[#2D2D2A] dark:text-white text-center focus:outline-none focus:border-[#5A5A40] dark:focus:border-[#C8C7B9]"
                placeholder="أدخل العدد الجديد"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-600 dark:text-rose-400 text-center font-medium">
                {errorMsg}
              </p>
            )}

            {confirmStep && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                  هل أنت متأكد من تغيير العدد المتبقي لصلاة{' '}
                  {PRAYERS_LIST.find((p) => p.key === selectedPrayer)?.arabicName} إلى{' '}
                  <strong>{formatArabicNumber(parseInt(newValue, 10) || 0)}</strong>؟
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedPrayer(null);
                  setConfirmStep(false);
                }}
                className="flex-1 py-3 bg-[#E8E4D9] dark:bg-[#3D3E37] text-[#2D2D2A] dark:text-[#EAE7E0] font-semibold text-sm rounded-2xl hover:opacity-90 transition-opacity"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSave}
                className={`flex-1 py-3 font-semibold text-sm rounded-2xl text-white transition-all shadow-md ${
                  confirmStep
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-[#5A5A40] hover:bg-[#484833] dark:bg-[#C8C7B9] dark:hover:bg-[#B8B7A8] dark:text-[#1C1D1A]'
                }`}
              >
                {confirmStep ? 'تأكيد التعديل' : 'حفظ التعديل'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {PRAYERS_LIST.map((prayer) => {
              const item = counters[prayer.key];
              return (
                <div
                  key={prayer.key}
                  className="flex items-center justify-between p-3.5 bg-[#F0EEE6] dark:bg-[#1C1D1A] border border-[#E8E4D9] dark:border-[#3D3E37] rounded-2xl"
                >
                  <div>
                    <h4 className="font-bold text-sm text-[#2D2D2A] dark:text-[#EAE7E0]">
                      {prayer.arabicName}
                    </h4>
                    <p className="text-xs text-[#8E8E80] dark:text-[#A6A699]">
                      المتبقي: <span className="font-semibold">{formatArabicNumber(item.remaining)}</span> | المقضي: {formatArabicNumber(item.completed)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleStartEdit(prayer.key)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FAF9F5] dark:bg-[#252622] border border-[#E8E4D9] dark:border-[#3D3E37] text-[#5A5A40] dark:text-[#C8C7B9] text-xs font-semibold hover:opacity-80 transition-opacity"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>تعديل</span>
                  </button>
                </div>
              );
            })}

            <div className="pt-3">
              <button
                onClick={onClose}
                className="w-full py-3 bg-[#5A5A40] hover:bg-[#484833] dark:bg-[#C8C7B9] dark:hover:bg-[#B8B7A8] text-white dark:text-[#1C1D1A] font-semibold text-sm rounded-2xl transition-colors shadow-md"
              >
                تم
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
