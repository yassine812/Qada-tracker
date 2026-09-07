import React, { useState } from 'react';
import { Plus, Minus, Zap, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PRAYERS_LIST, PrayerKey } from '../types';
import { formatArabicNumber } from '../utils/calculator';

export const RecordPage: React.FC = () => {
  const { counters, recordTodayPrayers, recordQuickPrayer, setActiveTab, showToast, istighfarData, recordIstighfarCompensation } = useApp();

  const [dailyCounts, setDailyCounts] = useState<{ [key in PrayerKey]: number }>({
    fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0,
  });
  const [quickAmount, setQuickAmount] = useState<number | 'custom'>(10);
  const [customQuickAmount, setCustomQuickAmount] = useState<string>('');
  const [quickPrayer, setQuickPrayer] = useState<PrayerKey>('fajr');
  const [isSubmittingDaily, setIsSubmittingDaily] = useState(false);
  const [isSubmittingQuick, setIsSubmittingQuick] = useState(false);

  if (!counters) return null;

  const totalDaily = Object.values(dailyCounts).reduce<number>((a, v) => a + ((v as number) || 0), 0);

  const handleStep = (key: PrayerKey, delta: number) => {
    const current = dailyCounts[key] || 0;
    const next = Math.max(0, current + delta);
    if (next > (counters[key].remaining as number)) return;
    setDailyCounts((prev) => ({ ...prev, [key]: next }));
  };

  const handleDailySubmit = async () => {
    if (totalDaily === 0) return;
    setIsSubmittingDaily(true);
    const ok = await recordTodayPrayers(dailyCounts);
    setIsSubmittingDaily(false);
    if (ok) {
      setDailyCounts({ fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 });
      setActiveTab('dashboard');
    }
  };

  const handleQuickSubmit = async () => {
    let amount = 0;
    if (quickAmount === 'custom') {
      const parsed = Number(customQuickAmount.trim());
      if (isNaN(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
        showToast('أدخل عدد صحيح', 'error');
        return;
      }
      amount = parsed;
    } else {
      amount = quickAmount;
    }
    if (amount <= 0) return;
    setIsSubmittingQuick(true);
    const ok = await recordQuickPrayer(quickPrayer, amount);
    setIsSubmittingQuick(false);
    if (ok) {
      if (quickAmount === 'custom') setCustomQuickAmount('');
      setActiveTab('dashboard');
    }
  };

  const effectiveQuickAmount =
    quickAmount === 'custom'
      ? (Number.isInteger(Number(customQuickAmount.trim())) && Number(customQuickAmount.trim()) > 0 ? Number(customQuickAmount.trim()) : 0)
      : quickAmount;

  return (
    <div className="space-y-6 pb-10 stagger-children">
      {/* TODAY'S RECORDING */}
      <section className="anim-fade-slide-up space-y-4">
        <div className="flex justify-between items-baseline px-1">
          <div>
            <h2 className="font-bold text-xl" style={{ color: 'var(--qada-text)' }}>تسجيل قضاء اليوم</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--qada-text-secondary)' }}>سجل الصلوات التي قضيتها اليوم</p>
          </div>
          {totalDaily > 0 && (
            <span className="px-3 py-1 text-xs font-bold rounded-full" style={{ background: 'var(--qada-primary-soft)', color: 'var(--qada-primary)', border: '1px solid var(--qada-border)' }}>
              المجموع: {totalDaily}
            </span>
          )}
        </div>

        <div className="space-y-2.5">
          {PRAYERS_LIST.map((prayer) => {
            const count = dailyCounts[prayer.key] || 0;
            const remaining = counters[prayer.key].remaining;
            const isComplete = remaining === 0;
            return (
              <div
                key={prayer.key}
                className="flex items-center justify-between p-4 rounded-2xl"
                style={{
                  background: 'var(--qada-surface-1)',
                  border: count > 0 ? '1.5px solid var(--qada-primary)' : '1px solid var(--qada-border)',
                  boxShadow: count > 0 ? 'var(--qada-shadow-md)' : 'var(--qada-shadow-sm)',
                  opacity: isComplete ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                }}
              >
                <div>
                  <h3 className="font-bold text-sm" style={{ color: 'var(--qada-text)' }}>{prayer.arabicName}</h3>
                  <p className="text-[11px]" style={{ color: 'var(--qada-text-secondary)' }}>
                    {isComplete ? 'مكتمل ✓' : `المتبقي: ${formatArabicNumber(remaining)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2.5 rounded-full px-3 py-1.5" style={{ background: 'var(--qada-surface-2)' }}>
                  <button
                    type="button" onClick={() => handleStep(prayer.key, -1)} disabled={count === 0 || isComplete}
                    className="w-8 h-8 rounded-full flex items-center justify-center btn-press"
                    style={{ background: 'var(--qada-surface-1)', color: 'var(--qada-text)', opacity: count === 0 ? 0.3 : 1 }}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold text-xl min-w-[28px] text-center font-brand-serif" style={{ color: count > 0 ? 'var(--qada-primary)' : 'var(--qada-text-muted)' }}>
                    {count}
                  </span>
                  <button
                    type="button" onClick={() => handleStep(prayer.key, 1)} disabled={count >= remaining || isComplete}
                    className="w-8 h-8 rounded-full flex items-center justify-center btn-press"
                    style={{ background: 'var(--qada-primary)', color: '#fff' }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button" onClick={handleDailySubmit} disabled={totalDaily === 0 || isSubmittingDaily}
          className="w-full py-4 rounded-2xl font-bold text-sm text-white btn-press"
          style={{ background: 'var(--qada-primary)', opacity: totalDaily === 0 ? 0.4 : 1 }}
        >
          <span className="flex items-center justify-center gap-2">
            <Check className="w-5 h-5" strokeWidth={2.5} />
            تسجيل الصلوات {totalDaily > 0 && `(إجمالي: ${totalDaily})`}
          </span>
        </button>
      </section>

      {/* QUICK RECORDING */}
      <section className="anim-fade-slide-up rounded-2xl p-5 space-y-4" style={{ background: 'var(--qada-surface-1)', border: '1px solid var(--qada-border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--qada-accent-soft)', color: 'var(--qada-accent)' }}>
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm" style={{ color: 'var(--qada-text)' }}>قضاء سريع</h3>
            <p className="text-[10px]" style={{ color: 'var(--qada-text-secondary)' }}>تسجيل عدد محدد لصلاة بضغطة واحدة</p>
          </div>
        </div>

        <div>
          <span className="block text-xs font-semibold mb-2" style={{ color: 'var(--qada-text-secondary)' }}>العدد:</span>
          <div className="flex flex-wrap gap-2">
            {[5, 10, 15, 20].map((num) => (
              <button key={num} type="button" onClick={() => setQuickAmount(num)} className="px-4 py-2 rounded-xl text-xs font-semibold btn-press"
                style={{
                  background: quickAmount === num ? 'var(--qada-primary)' : 'var(--qada-surface-2)',
                  color: quickAmount === num ? '#fff' : 'var(--qada-text)',
                  border: quickAmount === num ? 'none' : '1px solid var(--qada-border)',
                }}
              >{num}</button>
            ))}
            <button type="button" onClick={() => setQuickAmount('custom')} className="px-4 py-2 rounded-xl text-xs font-semibold btn-press"
              style={{
                background: quickAmount === 'custom' ? 'var(--qada-primary)' : 'var(--qada-surface-2)',
                color: quickAmount === 'custom' ? '#fff' : 'var(--qada-text)',
                border: quickAmount === 'custom' ? 'none' : '1px solid var(--qada-border)',
              }}
            >مخصص</button>
          </div>
          {quickAmount === 'custom' && (
            <input type="number" min="1" placeholder="أدخل العدد" value={customQuickAmount}
              onChange={(e) => setCustomQuickAmount(e.target.value)}
              className="w-full mt-2.5 px-4 py-2.5 rounded-xl text-sm font-bold text-center"
              style={{ background: 'var(--qada-surface-1)', border: '1px solid var(--qada-border)', color: 'var(--qada-text)' }}
            />
          )}
        </div>

        <div>
          <span className="block text-xs font-semibold mb-2" style={{ color: 'var(--qada-text-secondary)' }}>اختر الصلاة:</span>
          <div className="flex flex-wrap gap-2">
            {PRAYERS_LIST.map((prayer) => {
              const remaining = counters[prayer.key].remaining;
              const isZero = remaining === 0;
              return (
                <button key={prayer.key} type="button" disabled={isZero} onClick={() => setQuickPrayer(prayer.key)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold btn-press"
                  style={{
                    background: quickPrayer === prayer.key ? 'var(--qada-primary)' : 'var(--qada-surface-2)',
                    color: quickPrayer === prayer.key ? '#fff' : 'var(--qada-text)',
                    border: quickPrayer === prayer.key ? 'none' : '1px solid var(--qada-border)',
                    opacity: isZero ? 0.35 : 1,
                    textDecoration: isZero ? 'line-through' : 'none',
                  }}
                >{prayer.arabicName}</button>
              );
            })}
          </div>
        </div>

        <button
          type="button" onClick={handleQuickSubmit} disabled={effectiveQuickAmount <= 0 || isSubmittingQuick}
          className="w-full py-3.5 rounded-2xl font-bold text-sm text-white btn-press"
          style={{ background: 'var(--qada-primary)', opacity: effectiveQuickAmount <= 0 ? 0.4 : 1 }}
        >
          {effectiveQuickAmount > 0
            ? `تأكيد قضاء ${effectiveQuickAmount} صلوات ${PRAYERS_LIST.find((p) => p.key === quickPrayer)?.arabicName}`
            : 'تأكيد القضاء السريع'}
        </button>
      </section>

      {/* ISTIGHFAR COMPENSATION */}
      {istighfarData?.hasCompletedSetup && istighfarData.remaining > 0 && (
        <section className="anim-fade-slide-up rounded-2xl p-5 space-y-4" style={{ background: 'var(--qada-surface-1)', border: '1px solid var(--qada-border)' }}>
          <div className="flex items-center gap-2">
            <span className="text-base">🤲</span>
            <div>
              <h3 className="font-bold text-sm" style={{ color: 'var(--qada-text)' }}>تسجيل استغفار سابق</h3>
              <p className="text-[10px]" style={{ color: 'var(--qada-text-secondary)' }}>
                المتبقي: {formatArabicNumber(istighfarData.remaining)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {[10, 50, 100, 500].map((amount) => (
              <button key={amount} type="button" onClick={() => recordIstighfarCompensation(amount)} disabled={amount > istighfarData.remaining}
                className="flex-1 py-3 rounded-xl text-xs font-bold btn-press"
                style={{ background: 'var(--qada-surface-2)', color: 'var(--qada-text)', border: '1px solid var(--qada-border)', opacity: amount > istighfarData.remaining ? 0.3 : 1 }}
              >+{amount}</button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
