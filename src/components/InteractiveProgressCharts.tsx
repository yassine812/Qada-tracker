import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Line,
} from 'recharts';
import {
  Calendar,
  TrendingUp,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  Info,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { DailyRecord, PrayerCounters, StatsSummary } from '../types';
import { formatArabicNumber } from '../utils/calculator';

interface InteractiveProgressChartsProps {
  records: DailyRecord[];
  counters: PrayerCounters | null;
  stats: StatsSummary;
}

type ChartViewType = 'monthly' | 'yearly' | 'breakdown';
type TimeRangeType = '6months' | '12months' | 'all';

const ARABIC_MONTH_NAMES = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

export const InteractiveProgressCharts: React.FC<InteractiveProgressChartsProps> = ({
  records,
  counters,
  stats,
}) => {
  const [chartView, setChartView] = useState<ChartViewType>('monthly');
  const [timeRange, setTimeRange] = useState<TimeRangeType>('6months');
  const [paceMultiplier, setPaceMultiplier] = useState<number>(1); // for future projection simulations

  // Process Monthly Progress Data
  const monthlyData = useMemo(() => {
    const now = new Date();
    const monthsCount = timeRange === '6months' ? 6 : timeRange === '12months' ? 12 : 24;
    const monthsMap: Record<
      string,
      {
        monthKey: string;
        label: string;
        completed: number;
        cumulative: number;
        fajr: number;
        dhuhr: number;
        asr: number;
        maghrib: number;
        isha: number;
      }
    > = {};

    // Generate chronological list of months up to current month
    const chronologicalMonths: string[] = [];
    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${y}-${m}`;
      chronologicalMonths.push(key);
      monthsMap[key] = {
        monthKey: key,
        label: `${ARABIC_MONTH_NAMES[d.getMonth()]} ${y !== now.getFullYear() ? y : ''}`.trim(),
        completed: 0,
        cumulative: 0,
        fajr: 0,
        dhuhr: 0,
        asr: 0,
        maghrib: 0,
        isha: 0,
      };
    }

    // Populate data from records
    records.forEach((record) => {
      const key = record.date.substring(0, 7); // YYYY-MM
      if (monthsMap[key]) {
        monthsMap[key].completed += record.total;
        monthsMap[key].fajr += record.fajr || 0;
        monthsMap[key].dhuhr += record.dhuhr || 0;
        monthsMap[key].asr += record.asr || 0;
        monthsMap[key].maghrib += record.maghrib || 0;
        monthsMap[key].isha += record.isha || 0;
      }
    });

    // Compute running cumulative total
    let runningTotal = 0;
    const result = chronologicalMonths.map((key) => {
      const item = monthsMap[key];
      runningTotal += item.completed;
      return {
        ...item,
        cumulative: runningTotal,
      };
    });

    return result;
  }, [records, timeRange]);

  // Process Multi-Year & Projection Trajectory Data
  const yearlyAndProjectionData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearlyMap: Record<number, number> = {};

    // Sum past years from records
    records.forEach((r) => {
      const yr = parseInt(r.date.substring(0, 4), 10);
      if (!isNaN(yr)) {
        yearlyMap[yr] = (yearlyMap[yr] || 0) + r.total;
      }
    });

    const dailyPace = Math.max(1, (stats.dailyAverage || 1) * paceMultiplier);
    const yearlyRate = Math.round(dailyPace * 365);
    const remainingToProject = stats.totalRemaining;

    const dataPoints: {
      year: string;
      actualCompleted?: number;
      projectedCompleted?: number;
      projectedRemaining: number;
      isProjection: boolean;
    }[] = [];

    // Current year actual + projection
    let simulatedRemaining = stats.totalRemaining;
    let simulatedCompleted = stats.totalCompleted;

    // Past 2 years if exists or current year
    const startYear = Math.min(currentYear - 1, ...Object.keys(yearlyMap).map(Number));
    for (let yr = startYear; yr < currentYear; yr++) {
      if (yearlyMap[yr]) {
        dataPoints.push({
          year: String(yr),
          actualCompleted: yearlyMap[yr],
          projectedRemaining: remainingToProject + (stats.totalCompleted - (yearlyMap[yr] || 0)),
          isProjection: false,
        });
      }
    }

    // Current Year (Year 0)
    dataPoints.push({
      year: `${currentYear} (الآن)`,
      actualCompleted: stats.totalCompleted,
      projectedCompleted: stats.totalCompleted,
      projectedRemaining: stats.totalRemaining,
      isProjection: false,
    });

    // Project up to 5 future years or until finished
    let yearsAhead = 1;
    while (simulatedRemaining > 0 && yearsAhead <= 6) {
      const yearLabel = String(currentYear + yearsAhead);
      const prayThisYear = Math.min(simulatedRemaining, yearlyRate);
      simulatedRemaining = Math.max(0, simulatedRemaining - prayThisYear);
      simulatedCompleted += prayThisYear;

      dataPoints.push({
        year: yearLabel,
        projectedCompleted: simulatedCompleted,
        projectedRemaining: simulatedRemaining,
        isProjection: true,
      });

      if (simulatedRemaining === 0) break;
      yearsAhead++;
    }

    return dataPoints;
  }, [records, stats, paceMultiplier]);

  // Prayer Comparison Distribution Data
  const prayerBreakdownData = useMemo(() => {
    if (!counters) return [];
    const list = [
      { key: 'fajr', name: 'الفجر', ...counters.fajr },
      { key: 'dhuhr', name: 'الظهر', ...counters.dhuhr },
      { key: 'asr', name: 'العصر', ...counters.asr },
      { key: 'maghrib', name: 'المغرب', ...counters.maghrib },
      { key: 'isha', name: 'العشاء', ...counters.isha },
    ];

    return list.map((p) => {
      const total = p.initial || p.remaining + p.completed;
      const pct = total > 0 ? Math.round((p.completed / total) * 100) : 0;
      return {
        name: p.name,
        completed: p.completed,
        remaining: p.remaining,
        percentage: pct,
        total,
      };
    });
  }, [counters]);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#FAF9F5] dark:bg-[#252622] border border-[#E8E4D9] dark:border-[#3D3E37] p-3 rounded-2xl shadow-xl text-xs space-y-1 z-50 text-right min-w-[140px]">
          <p className="font-bold text-[#2D2D2A] dark:text-[#EAE7E0] border-b border-[#E8E4D9] dark:border-[#3D3E37] pb-1 font-brand-serif">
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3 pt-0.5">
              <span className="font-medium text-[#8E8E80] dark:text-[#A6A699]">
                {entry.name}:
              </span>
              <span className="font-bold text-[#2D2D2A] dark:text-[#EAE7E0]" style={{ color: entry.color }}>
                {formatArabicNumber(entry.value)} صلاة
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <section className="bg-[#FAF9F5] dark:bg-[#252622] rounded-[28px] p-5 border border-[#E8E4D9] dark:border-[#3D3E37] shadow-[0_4px_16px_rgba(90,90,64,0.04)] space-y-4">
      {/* Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#F0EEE6] dark:bg-[#1C1D1A] text-[#5A5A40] dark:text-[#C8C7B9] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base font-brand-serif text-[#2D2D2A] dark:text-[#EAE7E0]">
                مسار التقدم البياني
              </h3>
              <p className="text-[11px] text-[#8E8E80] dark:text-[#A6A699]">
                تتبع وتيرة إنجاز الصلوات عبر الأشهر والسنوات
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex bg-[#F0EEE6] dark:bg-[#1C1D1A] p-1 rounded-2xl border border-[#E8E4D9] dark:border-[#3D3E37] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setChartView('monthly')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              chartView === 'monthly'
                ? 'bg-[#5A5A40] text-white shadow-sm'
                : 'text-[#8E8E80] dark:text-[#A6A699] hover:text-[#2D2D2A] dark:hover:text-white'
            }`}
          >
            شهري
          </button>
          <button
            type="button"
            onClick={() => setChartView('yearly')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              chartView === 'yearly'
                ? 'bg-[#5A5A40] text-white shadow-sm'
                : 'text-[#8E8E80] dark:text-[#A6A699] hover:text-[#2D2D2A] dark:hover:text-white'
            }`}
          >
            سنوي وتوقعات
          </button>
          <button
            type="button"
            onClick={() => setChartView('breakdown')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              chartView === 'breakdown'
                ? 'bg-[#5A5A40] text-white shadow-sm'
                : 'text-[#8E8E80] dark:text-[#A6A699] hover:text-[#2D2D2A] dark:hover:text-white'
            }`}
          >
            توزيع الصلوات
          </button>
        </div>
      </div>

      {/* VIEW 1: MONTHLY PROGRESS */}
      {chartView === 'monthly' && (
        <div className="space-y-3 animate-in fade-in duration-200">
          {/* Time range selector */}
          <div className="flex justify-between items-center text-xs">
            <span className="text-[11px] font-medium text-[#8E8E80] dark:text-[#A6A699]">
              إجمالي ما قضيته شهرياً مع الخط التراكمي
            </span>
            <div className="flex gap-1 bg-[#F0EEE6] dark:bg-[#1C1D1A] p-0.5 rounded-xl border border-[#E8E4D9] dark:border-[#3D3E37]">
              <button
                type="button"
                onClick={() => setTimeRange('6months')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                  timeRange === '6months'
                    ? 'bg-white dark:bg-[#252622] text-[#5A5A40] dark:text-[#C8C7B9] shadow-xs'
                    : 'text-[#8E8E80] dark:text-[#A6A699]'
                }`}
              >
                6 أشهر
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('12months')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                  timeRange === '12months'
                    ? 'bg-white dark:bg-[#252622] text-[#5A5A40] dark:text-[#C8C7B9] shadow-xs'
                    : 'text-[#8E8E80] dark:text-[#A6A699]'
                }`}
              >
                12 شهر
              </button>
            </div>
          </div>

          {/* Recharts Composed Chart (Bar + Area) */}
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={monthlyData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5A5A40" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#5A5A40" stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C97C5D" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#C97C5D" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E8E4D9"
                  opacity={0.6}
                />
                <XAxis
                  dataKey="label"
                  stroke="#8E8E80"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#E8E4D9' }}
                />
                <YAxis
                  stroke="#8E8E80"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="completed"
                  name="المقضي في الشهر"
                  fill="url(#colorCompleted)"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={36}
                />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  name="الإجمالي التراكمي"
                  stroke="#C97C5D"
                  strokeWidth={2.5}
                  dot={{ fill: '#C97C5D', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Quick summary footer */}
          <div className="flex items-center justify-between text-[11px] text-[#8E8E80] dark:text-[#A6A699] pt-2 border-t border-[#E8E4D9] dark:border-[#3D3E37]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#5A5A40]" />
              <span>المقضي شهرياً</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C97C5D]" />
              <span>التراكمي التصاعدي</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: MULTI-YEAR & TRAJECTORY PROJECTIONS */}
      {chartView === 'yearly' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#2D2D2A] dark:text-[#EAE7E0]">
              محاكاة المسار السنوي المتوقع حتى الإتمام 🎯
            </span>
          </div>

          {/* Simulation Pace Options */}
          <div className="bg-[#F0EEE6] dark:bg-[#1C1D1A] p-3 rounded-2xl border border-[#E8E4D9] dark:border-[#3D3E37] space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-[#5A5A40] dark:text-[#C8C7B9]">
                وتيرة القضاء اليومية للمحاكاة:
              </span>
              <span className="font-bold text-[#C97C5D]">
                ~ {Math.round(Math.max(1, (stats.dailyAverage || 1) * paceMultiplier))} صلاة/يوم
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setPaceMultiplier(1)}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all ${
                  paceMultiplier === 1
                    ? 'bg-[#5A5A40] text-white shadow-sm'
                    : 'bg-white dark:bg-[#252622] text-[#2D2D2A] dark:text-[#EAE7E0] border border-[#E8E4D9] dark:border-[#3D3E37]'
                }`}
              >
                الوتيرة الحالية ({stats.dailyAverage || 1})
              </button>
              <button
                type="button"
                onClick={() => setPaceMultiplier(2)}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all ${
                  paceMultiplier === 2
                    ? 'bg-[#5A5A40] text-white shadow-sm'
                    : 'bg-white dark:bg-[#252622] text-[#2D2D2A] dark:text-[#EAE7E0] border border-[#E8E4D9] dark:border-[#3D3E37]'
                }`}
              >
                مضاعفة الجهد (×2)
              </button>
              <button
                type="button"
                onClick={() => setPaceMultiplier(3)}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all ${
                  paceMultiplier === 3
                    ? 'bg-[#5A5A40] text-white shadow-sm'
                    : 'bg-white dark:bg-[#252622] text-[#2D2D2A] dark:text-[#EAE7E0] border border-[#E8E4D9] dark:border-[#3D3E37]'
                }`}
              >
                3 صلوات يومياً (×3)
              </button>
            </div>
          </div>

          {/* Area Trajectory Chart */}
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={yearlyAndProjectionData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRemainingProj" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C97C5D" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#C97C5D" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="colorCompletedProj" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5A5A40" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#5A5A40" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E8E4D9"
                  opacity={0.6}
                />
                <XAxis
                  dataKey="year"
                  stroke="#8E8E80"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#E8E4D9' }}
                />
                <YAxis
                  stroke="#8E8E80"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="projectedRemaining"
                  name="المتبقي التنازلي"
                  stroke="#C97C5D"
                  strokeWidth={2}
                  fill="url(#colorRemainingProj)"
                />
                <Area
                  type="monotone"
                  dataKey="projectedCompleted"
                  name="المقضي التراكمي"
                  stroke="#5A5A40"
                  strokeWidth={2}
                  fill="url(#colorCompletedProj)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[11px] text-[#8E8E80] dark:text-[#A6A699] bg-[#F0EEE6] dark:bg-[#1C1D1A] p-2.5 rounded-xl text-center leading-relaxed">
            💡 يوضح المنحنى تناقص الصلوات المتبقية واقترابك من نقطة الصفر مع مرور السنوات بحسب التزامك.
          </p>
        </div>
      )}

      {/* VIEW 3: PRAYER COMPARISON BREAKDOWN */}
      {chartView === 'breakdown' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={prayerBreakdownData}
                layout="vertical"
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#E8E4D9"
                  opacity={0.6}
                />
                <XAxis
                  type="number"
                  stroke="#8E8E80"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#E8E4D9' }}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#2D2D2A"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="completed"
                  name="المقضي"
                  fill="#5A5A40"
                  stackId="a"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="remaining"
                  name="المتبقي"
                  fill="#E8E4D9"
                  stackId="a"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-5 gap-1.5 text-center">
            {prayerBreakdownData.map((p) => (
              <div
                key={p.name}
                className="bg-[#F0EEE6] dark:bg-[#1C1D1A] p-2 rounded-xl border border-[#E8E4D9] dark:border-[#3D3E37]"
              >
                <span className="text-[10px] text-[#8E8E80] dark:text-[#A6A699] block">
                  {p.name}
                </span>
                <span className="font-bold text-xs font-brand-serif text-[#5A5A40] dark:text-[#C8C7B9]">
                  {p.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
