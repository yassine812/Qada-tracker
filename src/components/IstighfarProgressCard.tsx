import { FeatureHelp } from './guide/FeatureHelp';
import React from 'react';
import { Heart, Plus } from 'lucide-react';
import { AnimatedNumber, CircularProgressRing, TactileButton } from './ui/MotionPrimitives';
import { formatArabicNumber } from '../utils/calculator';

interface Props {
  count: number;
  dailyGoal: number;
  personalTarget?: number;
  remaining?: number;
  onIncrement: () => void;
}

export function IstighfarProgressCard({ count, dailyGoal, personalTarget, remaining, onIncrement }: Props) {
  const goal = Math.max(1, dailyGoal);
  const dailyPercentage = Math.min(100, Math.max(0, (count / goal) * 100));
  const hasPersonalGoal = personalTarget !== undefined && remaining !== undefined;
  const safePersonalTarget = Math.max(1, personalTarget || 1);
  const personalCompleted = hasPersonalGoal ? Math.max(0, safePersonalTarget - Math.max(0, remaining || 0)) : 0;
  const personalPercentage = Math.min(100, Math.max(0, (personalCompleted / safePersonalTarget) * 100));
  return <section data-help="istighfar" className="qada-surface-card qada-istighfar-card" dir="rtl" aria-label="الاستغفار اليومي">
    <header className="flex items-center gap-3">
      <FeatureHelp topic="istighfar" />
      <span className="qada-card-icon"><Heart size={21} /></span>
      <div><h4 className="font-bold text-base">الاستغفار اليومي</h4><p className="qada-card-meta">لحظات من الذكر والسكينة</p></div>
    </header>
    <div className="qada-istighfar-trackers">
      <div className="qada-istighfar-orbit" role="progressbar" aria-label="إنجاز هدف الاستغفار اليومي" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(dailyPercentage)} aria-valuetext={`${count} من ${goal}، ${Math.round(dailyPercentage)} بالمئة`}>
        <CircularProgressRing percentage={dailyPercentage} size={hasPersonalGoal ? 130 : 152} strokeWidth={8}>
          <div className="flex flex-col items-center text-center">
            <span className="qada-card-meta">هدف اليوم</span>
            <strong className="text-3xl leading-tight my-1" dir="ltr"><AnimatedNumber value={count} /></strong>
            <span className="qada-card-meta">من {formatArabicNumber(goal)}</span>
          </div>
        </CircularProgressRing>
        <span className="qada-ring-percent" dir="ltr">{Math.round(dailyPercentage)}%</span>
      </div>
      {hasPersonalGoal && <div className="qada-istighfar-orbit" role="progressbar" aria-label="إنجاز هدف الاستغفار الشخصي" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(personalPercentage)} aria-valuetext={`${personalCompleted} من ${safePersonalTarget}، ${Math.round(personalPercentage)} بالمئة`}>
        <CircularProgressRing percentage={personalPercentage} size={130} strokeWidth={8}>
          <div className="flex flex-col items-center text-center">
            <span className="qada-card-meta">هدفك الشخصي</span>
            <strong className="text-xl leading-tight my-1" dir="ltr">{formatArabicNumber(personalCompleted)}</strong>
            <span className="qada-card-meta">من {formatArabicNumber(safePersonalTarget)}</span>
          </div>
        </CircularProgressRing>
        <span className="qada-ring-percent" dir="ltr">{Math.round(personalPercentage)}%</span>
      </div>}
    </div>
    <p className="qada-istighfar-invocation">أستغفر الله وأتوب إليه</p>
    <p className="qada-card-meta text-center">{count >= goal ? 'ما شاء الله، اكتمل هدف اليوم' : `باقي ${formatArabicNumber(goal - count)} لهدف اليوم`}</p>
    {hasPersonalGoal && <div className="flex justify-center"><FeatureHelp topic="istighfarGoal" label="شرح الهدف الشخصي" /></div>}
    {hasPersonalGoal && <dl className="qada-istighfar-stats">
      <div><dt>المتبقي من هدفك</dt><dd dir="ltr">{formatArabicNumber(remaining || 0)}</dd></div>
      <div><dt>هدفك الكلي</dt><dd dir="ltr">{formatArabicNumber(safePersonalTarget)}</dd></div>
    </dl>}
    <TactileButton onClick={onIncrement} ariaLabel="استغفر الله، إضافة واحدة" className="qada-istighfar-add">
      <Plus size={17} aria-hidden="true" /> <span>استغفر الله</span> <bdi dir="ltr" className="opacity-70 text-xs">+1</bdi>
    </TactileButton>
  </section>;
}
