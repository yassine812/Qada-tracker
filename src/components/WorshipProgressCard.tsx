import React from 'react';
import { FeatureHelp } from './guide/FeatureHelp';
import { CircularProgressRing, TactileButton } from './ui/MotionPrimitives';
import { formatArabicNumber } from '../utils/calculator';

interface Props {
  title: string;
  unit: string;
  completed: number;
  remaining: number;
  icon: React.ReactNode;
  onOpen: () => void;
  isSetupRequired?: boolean;
}

export function WorshipProgressCard({ title, unit, completed, remaining, icon, onOpen, isSetupRequired = false }: Props) {
  const total = completed + remaining;
  const percentage = total > 0 ? Math.min(100, Math.round(completed / total * 100)) : 0;
  return <section className="qada-surface-card qada-istighfar-card qada-worship-summary-card" dir="rtl" aria-label={`إحصائيات ${title}`}>
    <header className="flex items-center gap-3">
      <FeatureHelp topic="progress" />
      <span className="qada-card-icon">{icon}</span>
      <div><h3 className="font-bold text-base">{title}</h3><p className="qada-card-meta">إجمالي تقدّمك في القضاء</p></div>
    </header>
    <div className="qada-istighfar-body">
      <div className="qada-istighfar-orbit" role="progressbar" aria-label={`نسبة إنجاز ${title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}>
        <CircularProgressRing percentage={percentage} size={152} strokeWidth={8}>
          <div className="flex flex-col items-center text-center">
            <span className="qada-card-meta">المتبقي</span>
            <strong className="text-2xl leading-tight my-1" dir="ltr">{formatArabicNumber(remaining)}</strong>
            <span className="qada-card-meta">{unit}</span>
          </div>
        </CircularProgressRing>
        <span className="qada-ring-percent" dir="ltr">{percentage}%</span>
      </div>
    </div>
    <dl className="qada-istighfar-stats">
      <div><dt>المكتمل</dt><dd dir="ltr">{formatArabicNumber(completed)}</dd></div>
      <div><dt>الإجمالي</dt><dd dir="ltr">{formatArabicNumber(total)}</dd></div>
    </dl>
    <TactileButton onClick={onOpen} className="qada-istighfar-add" ariaLabel={isSetupRequired ? `إعداد حساب ${title}` : `متابعة ${title}`}>
      {isSetupRequired ? 'إعداد الحساب' : total === 0 ? `إعداد ${title}` : `متابعة ${title}`}
    </TactileButton>
  </section>;
}
