import React, { useState } from 'react';
import { History as HistoryIcon, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatArabicDate } from '../utils/streak';
import { PRAYERS_LIST, PrayerKey } from '../types';

export const HistoryPage: React.FC = () => {
  const { records, deleteRecord } = useApp();
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  const prayerNames: Record<PrayerKey, string> = {
    fajr: 'الفجر',
    dhuhr: 'الظهر',
    asr: 'العصر',
    maghrib: 'المغرب',
    isha: 'العشاء',
  };

  const handleDeleteConfirm = async () => {
    if (recordToDelete) {
      await deleteRecord(recordToDelete);
      setRecordToDelete(null);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-10">
      <div className="px-1">
        <h2 className="font-bold text-xl text-[#2D2D2A] dark:text-[#EAE7E0]">
          سجل القضاء
        </h2>
        <p className="text-xs text-[#8E8E80] dark:text-[#A6A699] mt-0.5">
          سجل يوميات الصلوات المقضية وتتبع التزامك عبر الأيام
        </p>
      </div>

      {records.length === 0 ? (
        <div className="text-center py-16 px-4 bg-[#FAF9F5] dark:bg-[#252622] rounded-[28px] border border-[#E8E4D9] dark:border-[#3D3E37]">
          <div className="w-16 h-16 rounded-full bg-[#F0EEE6] dark:bg-[#1C1D1A] text-[#8E8E80] dark:text-[#A6A699] flex items-center justify-center mx-auto mb-3">
            <HistoryIcon className="w-8 h-8 opacity-60" />
          </div>
          <h3 className="font-bold text-base text-[#2D2D2A] dark:text-[#EAE7E0]">
            لا يوجد سجلات بعد
          </h3>
          <p className="text-xs text-[#8E8E80] dark:text-[#A6A699] mt-1 max-w-xs mx-auto">
            عندما تقوم بتسجيل أي صلوات مقضية، ستظهر هنا بالتفصيل مع التاريخ والعدد.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => {
            const dateTitle = formatArabicDate(record.date);
            const isToday = dateTitle === 'اليوم';
            const isYesterday = dateTitle === 'أمس';

            const activePrayers = (
              ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as PrayerKey[]
            ).filter((key) => record[key] > 0);

            return (
              <div
                key={record.id}
                className={`bg-[#FAF9F5] dark:bg-[#252622] rounded-[24px] p-4 border transition-all ${
                  isToday
                    ? 'border-[#5A5A40] dark:border-[#C8C7B9] shadow-[0_4px_16px_rgba(90,90,64,0.06)]'
                    : 'border-[#E8E4D9] dark:border-[#3D3E37] shadow-[0_2px_8px_rgba(0,0,0,0.02)]'
                }`}
              >
                {/* Header: Date + Total Badge + Delete button */}
                <div className="flex justify-between items-center border-b border-[#E8E4D9] dark:border-[#3D3E37] pb-2.5 mb-2.5">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#5A5A40] dark:text-[#C8C7B9]" />
                    <span
                      className={`font-bold text-sm ${
                        isToday
                          ? 'text-[#5A5A40] dark:text-[#C8C7B9]'
                          : 'text-[#2D2D2A] dark:text-[#EAE7E0]'
                      }`}
                    >
                      {dateTitle}
                    </span>
                    {!isToday && !isYesterday && (
                      <span className="text-[11px] text-[#8E8E80] dark:text-[#A6A699]">
                        ({record.date})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="bg-[#F0EEE6] dark:bg-[#1C1D1A] border border-[#E8E4D9] dark:border-[#3D3E37] text-[#5A5A40] dark:text-[#C8C7B9] px-2.5 py-0.5 rounded-full text-xs font-bold">
                      المجموع: {record.total}
                    </div>

                    <button
                      onClick={() => setRecordToDelete(record.id)}
                      className="p-1 rounded-lg text-[#8E8E80] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="حذف هذا السجل"
                      aria-label="حذف السجل"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Prayers Breakdown Pills */}
                <div className="flex flex-wrap gap-2">
                  {activePrayers.map((key) => (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1.5 bg-[#F0EEE6] dark:bg-[#1C1D1A] px-3 py-1 rounded-full text-xs font-medium text-[#2D2D2A] dark:text-[#EAE7E0] border border-[#E8E4D9] dark:border-[#3D3E37]"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#5A5A40] dark:bg-[#C8C7B9]" />
                      <span>
                        {prayerNames[key]}: <strong>{record[key]}</strong>
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#FAF9F5] dark:bg-[#252622] border border-[#E8E4D9] dark:border-[#3D3E37] rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-2">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-[#2D2D2A] dark:text-[#EAE7E0]">
                حذف هذا السجل؟
              </h3>
              <p className="text-xs text-[#8E8E80] dark:text-[#A6A699] mt-1">
                سيتم إعادة عدد الصلوات في هذا السجل إلى العداد المتبقي.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="flex-1 py-3 bg-[#E8E4D9] dark:bg-[#3D3E37] text-[#2D2D2A] dark:text-[#EAE7E0] font-semibold text-xs rounded-2xl transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-2xl transition-colors shadow-md"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
