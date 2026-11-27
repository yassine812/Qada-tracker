import { FeatureHelpHost, FeatureHelp } from '../components/guide/FeatureHelp';
import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bell, Calculator, CheckCircle2, Edit3, LogOut, UserRound } from 'lucide-react';
import { authClient } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { PRAYERS_LIST, PrayerKey } from '../types';
import { formatArabicNumber } from '../utils/calculator';
import { PageTransition } from '../components/ui/MotionPrimitives';
import { EditCountersModal } from '../components/EditCountersModal';
import { RecalculateModal } from '../components/RecalculateModal';
import { useStreak } from '../context/StreakContext';

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const ProgressRing: React.FC<{ value: number; label: string; size?: number; accent?: string }> = ({ value, label, size = 112, accent = 'var(--qada-accent)' }) => {
  const percent = clamp(value);
  return (
    <div
      className="relative shrink-0 rounded-full p-2"
      style={{ width: size, height: size, background: `conic-gradient(${accent} ${percent * 3.6}deg, var(--qada-surface-3) 0deg)` }}
      aria-label={`${label}: ${percent}%`}
    >
      <div className="w-full h-full rounded-full flex flex-col items-center justify-center text-center" style={{ background: 'var(--qada-surface-1)' }}>
        <span className="text-xl font-extrabold font-brand-serif" style={{ color: 'var(--qada-text)' }}>{percent}%</span>
        <span className="text-[10px] font-semibold mt-0.5" style={{ color: 'var(--qada-text-muted)' }}>{label}</span>
      </div>
    </div>
  );
};

export const ProfilePage: React.FC = () => {
  const { session } = useAuth();
  const { settings, counters, stats: prayerStats, istighfarData, loading } = useApp();
  const { summary } = useStreak();
  const stats = { ...prayerStats, currentStreak: summary.currentStreak, activeDaysCount: summary.activeDates.length };
  const [isEditCountersOpen, setIsEditCountersOpen] = useState(false);
  const [isRecalculateOpen, setIsRecalculateOpen] = useState(false);

  // The dashboard links here when the prayer calculation has not been set up.
  // Keep the calculation dialog open immediately, so the person does not need
  // to find the action a second time.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('recalculate') === '1') {
      setIsRecalculateOpen(true);
    }
  }, []);

  const overallPercent = stats.totalEstimated > 0 ? (stats.totalCompleted / stats.totalEstimated) * 100 : 0;
  const istighfarPercent = istighfarData?.totalEstimated ? (istighfarData.completed / istighfarData.totalEstimated) * 100 : 0;
  const email = session?.user?.email || '—';
  const displayName = settings?.userName || session?.user?.user_metadata?.full_name || 'مستخدم قضاء';
  const genderLabel = settings?.gender === 'female' ? 'أنثى' : settings?.gender === 'male' ? 'ذكر' : '—';

  const prayerProgress = useMemo(() => {
    if (!counters) return [];
    return PRAYERS_LIST.map((prayer) => {
      const item = counters[prayer.key];
      const total = item.initial || item.remaining + item.completed;
      return { ...prayer, item, total, percent: total > 0 ? (item.completed / total) * 100 : 0 };
    });
  }, [counters]);

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--qada-bg)', color: 'var(--qada-text)' }}>جاري التحميل…</div>;

  const signOut = async () => { if (authClient) await authClient.auth.signOut(); window.location.href = '/'; };

  return (
    <div dir="rtl" className="qada-experience qada-profile-page min-h-screen px-3 sm:px-5 lg:px-8 py-8" style={{ background: 'var(--qada-bg)', color: 'var(--qada-text)' }}>
      <FeatureHelpHost />
      <PageTransition className="qada-help-content max-w-6xl mx-auto space-y-5 pb-8">
        <a href="/app" className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--qada-text-secondary)' }}>
          العودة إلى التطبيق <ArrowRight className="w-4 h-4" />
        </a>

        <section data-help="profile" className="qada-surface-card rounded-3xl p-5 sm:p-7" style={{ background: 'var(--qada-surface-1)', border: '1px solid var(--qada-border)' }}>
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--qada-primary-soft)', color: 'var(--qada-accent)' }}><UserRound className="w-6 h-6" /></div>
              <div>
                <div className="text-xs" style={{ color: 'var(--qada-text-muted)' }}>الملف الشخصي</div>
                <h1 className="text-2xl font-bold font-landing-display flex items-center gap-2">{displayName}<FeatureHelp topic="profile" /></h1>
              </div>
            </div>
            <button type="button" onClick={signOut} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold" style={{ color: 'var(--qada-danger)', borderColor: 'var(--qada-danger)' }}><LogOut className="w-4 h-4" /> تسجيل الخروج</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
            {[['العمر الحالي', settings?.currentAge ? `${settings.currentAge} سنة` : '—'], ['الجنس', genderLabel], ['البريد الإلكتروني', email]].map(([label, value]) => (
              <div key={label} className="rounded-2xl p-4" style={{ background: 'var(--qada-surface-2)' }}><div className="text-xs mb-1" style={{ color: 'var(--qada-text-muted)' }}>{label}</div><div className="font-bold truncate">{value}</div></div>
            ))}
          </div>
        </section>

        <section className="qada-surface-card rounded-3xl p-5 sm:p-7" style={{ background: 'var(--qada-surface-1)', border: '1px solid var(--qada-border)' }}>
            <h2 data-guide="progress" className="text-xl font-bold mb-5">إحصائيات تقدّمك</h2>
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-center">
            <div className="flex justify-center"><ProgressRing value={overallPercent} label="نسبة الصلوات" size={150} accent="var(--qada-primary)" /></div>
            <div className="grid grid-cols-2 gap-3">
              {[['الصلوات المكتملة', formatArabicNumber(stats.totalCompleted)], ['الصلوات المتبقية', formatArabicNumber(stats.totalRemaining)], ['أيام النشاط', formatArabicNumber(stats.activeDaysCount)], ['السلسلة الحالية', `${formatArabicNumber(stats.currentStreak)} يوم`]].map(([label, value]) => <div key={label} className="rounded-2xl p-4" style={{ background: 'var(--qada-surface-2)' }}><div className="text-xs" style={{ color: 'var(--qada-text-muted)' }}>{label}</div><div className="text-xl font-extrabold mt-1" style={{ color: 'var(--qada-accent)' }}>{value}</div></div>)}
            </div>
          </div>
        </section>

        {prayerProgress.length > 0 && <section className="qada-surface-card rounded-3xl p-5 sm:p-7" style={{ background: 'var(--qada-surface-1)', border: '1px solid var(--qada-border)' }}>
          <h2 className="text-xl font-bold mb-5">نسبة إنجاز كل صلاة</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {prayerProgress.map((prayer) => <div key={prayer.key} className="rounded-2xl p-3 flex flex-col items-center gap-2" style={{ background: 'var(--qada-surface-2)' }}><ProgressRing value={prayer.percent} label={prayer.arabicName} size={100} accent="var(--qada-accent)" /><div className="text-[11px]" style={{ color: 'var(--qada-text-muted)' }}>{formatArabicNumber(prayer.item.completed)} / {formatArabicNumber(prayer.total)}</div></div>)}
          </div>
        </section>}

        {istighfarData?.hasCompletedSetup && <section className="qada-surface-card rounded-3xl p-5 sm:p-7" style={{ background: 'var(--qada-surface-1)', border: '1px solid var(--qada-border)' }}>
          <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-bold">إحصائيات الاستغفار</h2><p className="text-xs mt-1" style={{ color: 'var(--qada-text-muted)' }}>هدف شخصي للمتابعة</p></div><ProgressRing value={istighfarPercent} label="نسبة الإنجاز" size={128} accent="var(--qada-accent)" /></div>
          <div className="grid grid-cols-2 gap-3 mt-4"><div className="rounded-2xl p-4" style={{ background: 'var(--qada-surface-2)' }}><div className="text-xs" style={{ color: 'var(--qada-text-muted)' }}>المكتمل</div><div className="text-xl font-bold mt-1">{formatArabicNumber(istighfarData.completed)}</div></div><div className="rounded-2xl p-4" style={{ background: 'var(--qada-surface-2)' }}><div className="text-xs" style={{ color: 'var(--qada-text-muted)' }}>المتبقي</div><div className="text-xl font-bold mt-1">{formatArabicNumber(istighfarData.remaining)}</div></div></div>
        </section>}

        <section className="qada-surface-card rounded-3xl p-5 sm:p-7" style={{ background: 'var(--qada-surface-1)', border: '1px solid var(--qada-border)' }}>
          <h2 data-help="calculations" className="text-xl font-bold mb-4">إدارة البيانات</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><button type="button" onClick={() => setIsEditCountersOpen(true)} className="rounded-2xl p-4 flex items-center justify-center gap-2 font-bold" style={{ background: 'var(--qada-surface-2)' }}><Edit3 className="w-4 h-4" /> تعديل الأرقام</button><button type="button" onClick={() => setIsRecalculateOpen(true)} className="rounded-2xl p-4 flex items-center justify-center gap-2 font-bold" style={{ background: 'var(--qada-surface-2)' }}><Calculator className="w-4 h-4" /> إعادة الحساب</button><a href="/app/notifications" className="rounded-2xl p-4 flex items-center justify-center gap-2 font-bold" style={{ background: 'var(--qada-surface-2)' }}><Bell className="w-4 h-4" /> الإشعارات</a></div>
        </section>

        <EditCountersModal isOpen={isEditCountersOpen} onClose={() => setIsEditCountersOpen(false)} />
        <RecalculateModal isOpen={isRecalculateOpen} onClose={() => setIsRecalculateOpen(false)} />
      </PageTransition>
    </div>
  );
};
