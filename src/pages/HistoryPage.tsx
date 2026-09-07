import React, { useState } from 'react';
import { History as HistoryIcon, Trash2, Calendar, AlertCircle, Heart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatArabicDate } from '../utils/streak';
import { PRAYERS_LIST, PrayerKey } from '../types';
import { formatArabicNumber } from '../utils/calculator';

export const HistoryPage: React.FC = () => {
  const { records, deleteRecord, istighfarRecords } = useApp();
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  const prayerNames: Record<PrayerKey, string> = {
    fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء',
  };

  const handleDeleteConfirm = async () => {
    if (recordToDelete) {
      await deleteRecord(recordToDelete);
      setRecordToDelete(null);
    }
  };

  return (
    <div className="space-y-5 pb-10 stagger-children">
      <div className="px-1 anim-fade-slide-up">
        <h2 className="font-bold text-xl" style={{ color: 'var(--qada-text)' }}>سجل القضاء</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--qada-text-secondary)' }}>تتبع يوميات الصلوات المقضية عبر الأيام</p>
      </div>

      {records.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl anim-fade-in" style={{ background: 'var(--qada-surface-1)', border: '1px solid var(--qada-border)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--qada-surface-2)', color: 'var(--qada-text-muted)' }}>
            <HistoryIcon className="w-8 h-8 opacity-50" />
          </div>
          <h3 className="font-bold text-base" style={{ color: 'var(--qada-text)' }}>لا يوجد سجلات بعد</h3>
          <p className="text-xs mt-1 max-w-xs mx-auto" style={{ color: 'var(--qada-text-secondary)' }}>
            ستظهر سجلاتك هنا بعد تسجيل أول صلاة مقضية.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {records.map((record) => {
            const dateTitle = formatArabicDate(record.date);
            const isToday = dateTitle === 'اليوم';
            const activePrayers = (['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as PrayerKey[]).filter((k) => record[k] > 0);
            const istighfarForDate = istighfarRecords.find((r) => r.date === record.date);
            const istighfarCount = istighfarForDate ? istighfarForDate.count : 0;

            return (
              <div
                key={record.id}
                className="rounded-2xl p-4 anim-fade-slide-up"
                style={{
                  background: 'var(--qada-surface-1)',
                  border: isToday ? '1.5px solid var(--qada-primary)' : '1px solid var(--qada-border)',
                }}
              >
                {/* Header */}
                <div className="flex justify-between items-center pb-2.5 mb-2.5" style={{ borderBottom: '1px solid var(--qada-border)' }}>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" style={{ color: isToday ? 'var(--qada-primary)' : 'var(--qada-text-muted)' }} />
                    <span className="font-bold text-sm" style={{ color: isToday ? 'var(--qada-primary)' : 'var(--qada-text)' }}>
                      {dateTitle}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: 'var(--qada-surface-2)', color: 'var(--qada-primary)' }}>
                      المجموع: {record.total}
                    </span>
                    <button onClick={() => setRecordToDelete(record.id)} className="p-1 rounded-lg transition-colors" style={{ color: 'var(--qada-text-muted)' }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Prayers */}
                <div className="flex flex-wrap gap-1.5">
                  {activePrayers.map((key) => (
                    <span key={key} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs" style={{ background: 'var(--qada-surface-2)', color: 'var(--qada-text)' }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--qada-primary)' }} />
                      {prayerNames[key]}: <strong>{record[key]}</strong>
                    </span>
                  ))}
                  {istighfarCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs" style={{ background: 'var(--qada-accent-soft)', color: 'var(--qada-accent)' }}>
                      <Heart className="w-3 h-3 fill-current" />
                      الاستغفار: {formatArabicNumber(istighfarCount)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm anim-fade-in">
          <div className="rounded-3xl p-6 max-w-sm w-full shadow-2xl" style={{ background: 'var(--qada-surface-1)', border: '1px solid var(--qada-border)' }}>
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2" style={{ background: 'var(--qada-error-soft)', color: 'var(--qada-error)' }}>
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base" style={{ color: 'var(--qada-text)' }}>حذف هذا السجل؟</h3>
              <p className="text-xs mt-1" style={{ color: 'var(--qada-text-secondary)' }}>سيتم إعادة العدد إلى المتبقي.</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setRecordToDelete(null)}
                className="flex-1 py-3 rounded-2xl font-semibold text-xs"
                style={{ background: 'var(--qada-surface-2)', color: 'var(--qada-text)' }}
              >إلغاء</button>
              <button type="button" onClick={handleDeleteConfirm}
                className="flex-1 py-3 rounded-2xl font-semibold text-xs text-white"
                style={{ background: 'var(--qada-error)' }}
              >تأكيد الحذف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
