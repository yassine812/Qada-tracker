import React from 'react';
import {
  Clock,
  CheckCircle,
  Percent,
  Flame,
  TrendingUp,
  CalendarDays,
  Award,
  Hourglass,
  Heart,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatArabicNumber } from '../utils/calculator';
import { PRAYERS_LIST } from '../types';
import { InteractiveProgressCharts } from '../components/InteractiveProgressCharts';

export const StatisticsPage: React.FC = () => {
  const { stats, records, counters, istighfarStats, istighfarData } = useApp();

  // Compute 7-day activity data for the bar chart
  const getLast7DaysData = () => {
    const days: { label: string; dateStr: string; total: number; isToday: boolean }[] = [];
    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      // Sum totals recorded on this date
      const totalOnDate = records
        .filter((r) => r.date === dateStr)
        .reduce((sum, r) => sum + r.total, 0);

      days.push({
        label: i === 0 ? 'اليوم' : dayNames[d.getDay()],
        dateStr,
        total: totalOnDate,
        isToday: i === 0,
      });
    }

    const maxDayTotal = Math.max(1, ...days.map((d) => d.total));
    return { days, maxDayTotal };
  };

  const { days: last7Days, maxDayTotal } = getLast7DaysData();

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10">
      <div className="px-1">
        <h2 className="font-bold text-xl text-[#2D2D2A] dark:text-[#EAE7E0]">
          الإحصائيات والتقدم
        </h2>
        <p className="text-xs text-[#8E8E80] dark:text-[#A6A699] mt-0.5">
          نظرة تحليلية شاملة على تقدمك والتزامك بالقضاء
        </p>
      </div>

      {/* Bento Grid: 4 Top Core Cards */}
      <section className="grid grid-cols-2 gap-3">
        {/* Total Remaining */}
        <div className="bg-[#FAF9F5] dark:bg-[#252622] rounded-[24px] p-4 flex flex-col justify-between h-28 border border-[#E8E4D9] dark:border-[#3D3E37] shadow-[0_4px_16px_rgba(90,90,64,0.03)]">
          <div className="flex items-center gap-1.5 text-[#8E8E80] dark:text-[#A6A699]">
            <Clock className="w-3.5 h-3.5 text-[#C97C5D]" />
            <span className="text-xs font-semibold">إجمالي المتبقي</span>
          </div>
          <div className="font-extrabold text-2xl font-brand-serif text-[#C97C5D]">
            {formatArabicNumber(stats.totalRemaining)}
          </div>
        </div>

        {/* Total Completed */}
        <div className="bg-[#FAF9F5] dark:bg-[#252622] rounded-[24px] p-4 flex flex-col justify-between h-28 border border-[#E8E4D9] dark:border-[#3D3E37] shadow-[0_4px_16px_rgba(90,90,64,0.03)]">
          <div className="flex items-center gap-1.5 text-[#8E8E80] dark:text-[#A6A699]">
            <CheckCircle className="w-3.5 h-3.5 text-[#5A5A40] dark:text-[#C8C7B9]" />
            <span className="text-xs font-semibold">تم قضاؤه</span>
          </div>
          <div className="font-extrabold text-2xl font-brand-serif text-[#5A5A40] dark:text-[#C8C7B9]">
            {formatArabicNumber(stats.totalCompleted)}
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-[#FAF9F5] dark:bg-[#252622] rounded-[24px] p-4 flex flex-col justify-between h-28 border border-[#E8E4D9] dark:border-[#3D3E37] shadow-[0_4px_16px_rgba(90,90,64,0.03)]">
          <div className="flex items-center gap-1.5 text-[#8E8E80] dark:text-[#A6A699]">
            <Percent className="w-3.5 h-3.5 text-[#5A5A40] dark:text-[#C8C7B9]" />
            <span className="text-xs font-semibold">نسبة الإنجاز</span>
          </div>
          <div className="font-extrabold text-2xl font-brand-serif text-[#5A5A40] dark:text-[#C8C7B9]">
            {stats.completionPercentage}%
          </div>
        </div>

        {/* Current Streak */}
        <div className="bg-[#FAF9F5] dark:bg-[#252622] rounded-[24px] p-4 flex flex-col justify-between h-28 border border-[#E8E4D9] dark:border-[#3D3E37] shadow-[0_4px_16px_rgba(90,90,64,0.03)] relative overflow-hidden">
          <div className="flex items-center gap-1.5 text-[#8E8E80] dark:text-[#A6A699] relative z-10">
            <Flame className="w-3.5 h-3.5 text-[#C97C5D] fill-[#C97C5D]" />
            <span className="text-xs font-semibold">سلسلة القضاء</span>
          </div>
          <div className="font-extrabold text-2xl font-brand-serif text-[#C97C5D] relative z-10">
            {stats.currentStreak > 0 ? `${stats.currentStreak} أيام` : '0 يوم'}
          </div>
        </div>
      </section>

      {/* 7-Day Activity Chart */}
      <section className="bg-[#FAF9F5] dark:bg-[#252622] rounded-[28px] p-5 border border-[#E8E4D9] dark:border-[#3D3E37] shadow-[0_4px_16px_rgba(90,90,64,0.04)]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-base text-[#2D2D2A] dark:text-[#EAE7E0]">
            نشاط آخر 7 أيام
          </h3>
          <span className="text-xs text-[#8E8E80] dark:text-[#A6A699]">
            (الصلوات المقضية يومياً)
          </span>
        </div>

        <div className="flex items-end justify-between h-36 pt-2 gap-2">
          {last7Days.map((day, idx) => {
            const heightPercent =
              day.total > 0
                ? Math.max(12, Math.round((day.total / maxDayTotal) * 100))
                : 6;

            return (
              <div key={idx} className="flex flex-col items-center gap-2 flex-1 h-full justify-end">
                <span className="text-[10px] font-bold text-[#5A5A40] dark:text-[#C8C7B9]">
                  {day.total > 0 ? day.total : ''}
                </span>

                <div className="w-full bg-[#F0EEE6] dark:bg-[#1C1D1A] rounded-full h-24 overflow-hidden flex flex-col justify-end p-0.5">
                  <div
                    className={`w-full rounded-full transition-all duration-500 ${
                      day.isToday
                        ? 'bg-[#C97C5D]'
                        : day.total > 0
                        ? 'bg-[#5A5A40] dark:bg-[#C8C7B9]'
                        : 'bg-transparent'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>

                <span
                  className={`text-[11px] font-medium ${
                    day.isToday
                      ? 'text-[#C97C5D] font-bold'
                      : 'text-[#8E8E80] dark:text-[#A6A699]'
                  }`}
                >
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Interactive Monthly & Multi-Year Progression Charts */}
      <InteractiveProgressCharts records={records} counters={counters} stats={stats} />

      {/* Detailed Metrics Breakdown */}
      <section className="bg-[#FAF9F5] dark:bg-[#252622] rounded-[28px] p-5 border border-[#E8E4D9] dark:border-[#3D3E37] space-y-3.5 shadow-[0_4px_16px_rgba(90,90,64,0.04)]">
        <h3 className="font-bold text-base text-[#2D2D2A] dark:text-[#EAE7E0] mb-1">
          تفاصيل الأداء
        </h3>

        <div className="flex items-center justify-between p-3 bg-[#F0EEE6] dark:bg-[#1C1D1A] rounded-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#5A5A40]/10 dark:bg-[#C8C7B9]/15 text-[#5A5A40] dark:text-[#C8C7B9] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#2D2D2A] dark:text-[#EAE7E0] block">
                متوسط القضاء اليومي
              </span>
              <span className="text-[10px] text-[#8E8E80] dark:text-[#A6A699]">
                في الأيام التي قضيت فيها
              </span>
            </div>
          </div>
          <span className="font-bold text-base text-[#5A5A40] dark:text-[#C8C7B9]">
            {stats.dailyAverage} صلاة/يوم
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-[#F0EEE6] dark:bg-[#1C1D1A] rounded-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#5A5A40]/10 dark:bg-[#C8C7B9]/15 text-[#5A5A40] dark:text-[#C8C7B9] flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#2D2D2A] dark:text-[#EAE7E0] block">
                عدد أيام القضاء
              </span>
              <span className="text-[10px] text-[#8E8E80] dark:text-[#A6A699]">
                إجمالي الأيام النشطة
              </span>
            </div>
          </div>
          <span className="font-bold text-base text-[#2D2D2A] dark:text-[#EAE7E0]">
            {stats.activeDaysCount} يوم
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-[#F0EEE6] dark:bg-[#1C1D1A] rounded-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C97C5D]/15 text-[#C97C5D] flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#2D2D2A] dark:text-[#EAE7E0] block">
                أطول سلسلة متواصلة
              </span>
              <span className="text-[10px] text-[#8E8E80] dark:text-[#A6A699]">
                أفضل التزام متتالي
              </span>
            </div>
          </div>
          <span className="font-bold text-base text-[#C97C5D]">
            {stats.longestStreak} أيام
          </span>
        </div>

        {stats.estimatedDaysToFinish !== null && (
          <div className="flex items-center justify-between p-3 bg-[#F0EEE6] dark:bg-[#2A2B26] border border-[#D1CDC2] dark:border-[#3D3E37] rounded-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#5A5A40]/10 dark:bg-[#C8C7B9]/15 text-[#5A5A40] dark:text-[#C8C7B9] flex items-center justify-center">
                <Hourglass className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-[#5A5A40] dark:text-[#C8C7B9] block">
                  المدة التقديرية للإتمام
                </span>
                <span className="text-[10px] text-[#8E8E80] dark:text-[#A6A699]">
                  بناءً على وتيرتك الحالية
                </span>
              </div>
            </div>
            <span className="font-bold text-sm text-[#5A5A40] dark:text-[#C8C7B9]">
              ~ {formatArabicNumber(stats.estimatedDaysToFinish)} يوم
            </span>
          </div>
        )}
      </section>

      {/* Istighfar Statistics Section */}
      {istighfarData?.hasCompletedSetup && (
        <section className="bg-[#FAF9F5] dark:bg-[#252622] rounded-[28px] p-5 border border-[#E8E4D9] dark:border-[#3D3E37] space-y-3 shadow-[0_4px_16px_rgba(90,90,64,0.04)]">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-[#C97C5D]/15 text-[#C97C5D] flex items-center justify-center">
              <Heart className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-[#2D2D2A] dark:text-[#EAE7E0]">
              إحصائيات الاستغفار السابق
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#F0EEE6] dark:bg-[#1C1D1A] p-3 rounded-2xl border border-[#E8E4D9] dark:border-[#3D3E37] text-center">
              <div className="text-lg font-extrabold font-brand-serif text-[#C97C5D]">
                {formatArabicNumber(istighfarData.totalEstimated)}
              </div>
              <div className="text-[10px] text-[#8E8E80] dark:text-[#A6A699] font-semibold mt-0.5">
                الإجمالي التقديرى
              </div>
            </div>

            <div className="bg-[#F0EEE6] dark:bg-[#1C1D1A] p-3 rounded-2xl border border-[#E8E4D9] dark:border-[#3D3E37] text-center">
              <div className="text-lg font-extrabold font-brand-serif text-[#5A5A40] dark:text-[#C8C7B9]">
                {formatArabicNumber(istighfarData.completed)}
              </div>
              <div className="text-[10px] text-[#8E8E80] dark:text-[#A6A699] font-semibold mt-0.5">
                المقضي
              </div>
            </div>

            <div className="bg-[#F0EEE6] dark:bg-[#1C1D1A] p-3 rounded-2xl border border-[#E8E4D9] dark:border-[#3D3E37] text-center">
              <div className="text-lg font-extrabold font-brand-serif text-[#C97C5D]">
                {istighfarData.totalEstimated > 0 ? Math.round((istighfarData.completed / istighfarData.totalEstimated) * 100) : 0}%
              </div>
              <div className="text-[10px] text-[#8E8E80] dark:text-[#A6A699] font-semibold mt-0.5">
                نسبة الإنجاز
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#F0EEE6] dark:bg-[#1C1D1A] rounded-2xl border border-[#E8E4D9] dark:border-[#3D3E37]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8E8E80] dark:text-[#A6A699]">المتبقي</span>
              <span className="font-bold text-[#C97C5D]">{formatArabicNumber(istighfarData.remaining)}</span>
            </div>
            <div className="w-full h-2 bg-[#E8E4D9] dark:bg-[#3D3E37] rounded-full overflow-hidden mt-2">
              <div
                className="h-full rounded-full transition-all duration-500 bg-[#5A5A40] dark:bg-[#C8C7B9]"
                style={{ width: `${istighfarData.totalEstimated > 0 ? Math.min(100, (istighfarData.completed / istighfarData.totalEstimated) * 100) : 0}%` }}
              />
            </div>
          </div>

          <p className="text-[10px] text-[#8E8E80] dark:text-[#A6A699] text-center">
            هذا تقدير شخصي وليس حكم شرعي
          </p>
        </section>
      )}

      {/* Prayer Distribution Breakdown */}
      {counters && (
        <section className="bg-[#FAF9F5] dark:bg-[#252622] rounded-[28px] p-5 border border-[#E8E4D9] dark:border-[#3D3E37] space-y-3 shadow-[0_4px_16px_rgba(90,90,64,0.04)]">
          <h3 className="font-bold text-base text-[#2D2D2A] dark:text-[#EAE7E0] mb-1">
            نسبة إنجاز كل صلاة
          </h3>

          <div className="space-y-3">
            {PRAYERS_LIST.map((prayer) => {
              const item = counters[prayer.key];
              const total = item.initial || (item.remaining + item.completed);
              const pct = total > 0 ? Math.min(100, Math.round((item.completed / total) * 100)) : 0;

              return (
                <div key={prayer.key} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-[#2D2D2A] dark:text-[#EAE7E0]">
                    <span>{prayer.arabicName}</span>
                    <span className="text-[#5A5A40] dark:text-[#C8C7B9]">{pct}% ({formatArabicNumber(item.completed)} / {formatArabicNumber(total)})</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#F0EEE6] dark:bg-[#1C1D1A] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#5A5A40] dark:bg-[#C8C7B9] rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
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
