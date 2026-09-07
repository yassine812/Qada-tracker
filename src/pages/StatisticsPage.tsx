import React from 'react';
import {
  Clock, CheckCircle, Percent, Flame, TrendingUp,
  CalendarDays, Award, Hourglass, Heart,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatArabicNumber } from '../utils/calculator';
import { PRAYERS_LIST } from '../types';
import { InteractiveProgressCharts } from '../components/InteractiveProgressCharts';

export const StatisticsPage: React.FC = () => {
  const { stats, records, counters, istighfarStats, istighfarData } = useApp();

  const getLast7DaysData = () => {
    const days: { label: string; dateStr: string; total: number; isToday: boolean }[] = [];
    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const totalOnDate = records.filter((r) => r.date === dateStr).reduce((sum, r) => sum + r.total, 0);
      days.push({ label: i === 0 ? 'اليوم' : dayNames[d.getDay()], dateStr, total: totalOnDate, isToday: i === 0 });
    }
    return { days, maxDayTotal: Math.max(1, ...days.map((d) => d.total)) };
  };
  const { days: last7Days, maxDayTotal } = getLast7DaysData();

  const statCard = (icon: React.ReactNode, label: string, value: string, color: string) => (
    <div className="rounded-2xl p-4 flex flex-col justify-between h-28"
      style={{ background: 'var(--qada-surface-1)', border: '1px solid var(--qada-border)' }}>
      <div className="flex items-center gap-1.5" style={{ color: 'var(--qada-text-secondary)' }}>
        {icon}
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <div className="font-extrabold text-2xl font-brand-serif" style={{ color }}>{value}</div>
    </div>
  );

  return (
    <div className="space-y-6 pb-10 stagger-children">
      <div className="px-1 anim-fade-slide-up">
        <h2 className="font-bold text-xl" style={{ color: 'var(--qada-text)' }}>الإحصائيات والتقدم</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--qada-text-secondary)' }}>نظرة تحليلية شاملة على تقدمك</p>
      </div>

      {/* Bento Grid */}
      <section className="grid grid-cols-2 gap-3">
        {statCard(<Clock className="w-3.5 h-3.5" style={{ color: 'var(--qada-accent)' }} />, 'إجمالي المتبقي', formatArabicNumber(stats.totalRemaining), 'var(--qada-accent)')}
        {statCard(<CheckCircle className="w-3.5 h-3.5" style={{ color: 'var(--qada-success)' }} />, 'تم قضاؤه', formatArabicNumber(stats.totalCompleted), 'var(--qada-success)')}
        {statCard(<Percent className="w-3.5 h-3.5" style={{ color: 'var(--qada-primary)' }} />, 'نسبة الإنجاز', `${stats.completionPercentage}%`, 'var(--qada-primary)')}
        {statCard(<Flame className="w-3.5 h-3.5" style={{ color: 'var(--qada-accent)' }} />, 'سلسلة القضاء', stats.currentStreak > 0 ? `${stats.currentStreak} أيام` : '0 يوم', 'var(--qada-accent)')}
      </section>

      {/* 7-Day Activity */}
      <section className="rounded-2xl p-5 anim-fade-slide-up" style={{ background: 'var(--qada-surface-1)', border: '1px solid var(--qada-border)' }}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-base" style={{ color: 'var(--qada-text)' }}>نشاط آخر 7 أيام</h3>
          <span className="text-xs" style={{ color: 'var(--qada-text-muted)' }}>(المقضية يومياً)</span>
        </div>
        <div className="flex items-end justify-between h-36 pt-2 gap-2">
          {last7Days.map((day, idx) => {
            const h = day.total > 0 ? Math.max(12, Math.round((day.total / maxDayTotal) * 100)) : 6;
            return (
              <div key={idx} className="flex flex-col items-center gap-2 flex-1 h-full justify-end">
                <span className="text-[10px] font-bold" style={{ color: 'var(--qada-primary)' }}>
                  {day.total > 0 ? day.total : ''}
                </span>
                <div className="w-full rounded-full h-24 overflow-hidden flex flex-col justify-end p-0.5" style={{ background: 'var(--qada-surface-2)' }}>
                  <div
                    className="w-full rounded-full transition-all duration-500"
                    style={{
                      height: `${h}%`,
                      background: day.isToday ? 'var(--qada-accent)' : day.total > 0 ? 'var(--qada-primary)' : 'transparent',
                    }}
                  />
                </div>
                <span className="text-[11px] font-medium"
                  style={{ color: day.isToday ? 'var(--qada-accent)' : 'var(--qada-text-muted)', fontWeight: day.isToday ? 700 : 400 }}>
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <InteractiveProgressCharts records={records} counters={counters} stats={stats} />

      {/* Detailed Metrics */}
      <section className="rounded-2xl p-5 space-y-3 anim-fade-slide-up" style={{ background: 'var(--qada-surface-1)', border: '1px solid var(--qada-border)' }}>
        <h3 className="font-bold text-base mb-1" style={{ color: 'var(--qada-text)' }}>تفاصيل الأداء</h3>
        {[
          { icon: <TrendingUp className="w-4 h-4" />, label: 'متوسط القضاء اليومي', sub: 'في الأيام النشطة', value: `${stats.dailyAverage} صلاة/يوم`, color: 'var(--qada-primary)' },
          { icon: <CalendarDays className="w-4 h-4" />, label: 'عدد أيام القضاء', sub: 'إجمالي الأيام النشطة', value: `${stats.activeDaysCount} يوم`, color: 'var(--qada-text)' },
          { icon: <Award className="w-4 h-4" />, label: 'أطول سلسلة', sub: 'أفضل التزام متتالي', value: `${stats.longestStreak} أيام`, color: 'var(--qada-accent)' },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--qada-surface-2)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--qada-primary-soft)', color: 'var(--qada-primary)' }}>
                {item.icon}
              </div>
              <div>
                <span className="text-xs font-semibold block" style={{ color: 'var(--qada-text)' }}>{item.label}</span>
                <span className="text-[10px]" style={{ color: 'var(--qada-text-muted)' }}>{item.sub}</span>
              </div>
            </div>
            <span className="font-bold text-sm" style={{ color: item.color }}>{item.value}</span>
          </div>
        ))}
        {stats.estimatedDaysToFinish !== null && (
          <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--qada-primary-soft)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--qada-surface-1)', color: 'var(--qada-primary)' }}>
                <Hourglass className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold block" style={{ color: 'var(--qada-primary)' }}>المدة التقديرية</span>
                <span className="text-[10px]" style={{ color: 'var(--qada-text-muted)' }}>بناءً على وتيرتك</span>
              </div>
            </div>
            <span className="font-bold text-sm" style={{ color: 'var(--qada-primary)' }}>~ {formatArabicNumber(stats.estimatedDaysToFinish)} يوم</span>
          </div>
        )}
      </section>

      {/* Istighfar Stats */}
      {istighfarData?.hasCompletedSetup && (
        <section className="rounded-2xl p-5 space-y-3 anim-fade-slide-up" style={{ background: 'var(--qada-surface-1)', border: '1px solid var(--qada-border)' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">🤲</span>
            <h3 className="font-bold text-base" style={{ color: 'var(--qada-text)' }}>إحصائيات الاستغفار</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[{ v: formatArabicNumber(istighfarData.totalEstimated), l: 'الإجمالي', c: 'var(--qada-accent)' },
              { v: formatArabicNumber(istighfarData.completed), l: 'المقضي', c: 'var(--qada-success)' },
              { v: `${istighfarData.totalEstimated > 0 ? Math.round((istighfarData.completed / istighfarData.totalEstimated) * 100) : 0}%`, l: 'نسبة الإنجاز', c: 'var(--qada-primary)' },
            ].map((s, i) => (
              <div key={i} className="p-3 rounded-xl text-center" style={{ background: 'var(--qada-surface-2)' }}>
                <div className="text-lg font-extrabold font-brand-serif" style={{ color: s.c }}>{s.v}</div>
                <div className="text-[10px] font-semibold mt-0.5" style={{ color: 'var(--qada-text-muted)' }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-xl" style={{ background: 'var(--qada-surface-2)' }}>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--qada-surface-3)' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{
                width: `${istighfarData.totalEstimated > 0 ? Math.min(100, (istighfarData.completed / istighfarData.totalEstimated) * 100) : 0}%`,
                background: 'var(--qada-success)',
              }} />
            </div>
          </div>
          <p className="text-[10px] text-center" style={{ color: 'var(--qada-text-muted)' }}>تقدير شخصي وليس حكم شرعي</p>
        </section>
      )}

      {/* Prayer Distribution */}
      {counters && (
        <section className="rounded-2xl p-5 space-y-3 anim-fade-slide-up" style={{ background: 'var(--qada-surface-1)', border: '1px solid var(--qada-border)' }}>
          <h3 className="font-bold text-base mb-1" style={{ color: 'var(--qada-text)' }}>نسبة إنجاز كل صلاة</h3>
          <div className="space-y-3">
            {PRAYERS_LIST.map((prayer) => {
              const item = counters[prayer.key];
              const total = item.initial || (item.remaining + item.completed);
              const pct = total > 0 ? Math.min(100, Math.round((item.completed / total) * 100)) : 0;
              return (
                <div key={prayer.key} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold" style={{ color: 'var(--qada-text)' }}>
                    <span>{prayer.arabicName}</span>
                    <span style={{ color: 'var(--qada-primary)' }}>{pct}% ({formatArabicNumber(item.completed)}/{formatArabicNumber(total)})</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--qada-surface-2)' }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: 'var(--qada-primary)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
