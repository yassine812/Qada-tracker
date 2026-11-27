import { useEffect, useState } from 'react';
import { CalendarDays, Check, ChevronDown, Minus, Plus, Target } from 'lucide-react';
import { PRAYERS_LIST, type PrayerKey, type QadaPlan } from '../types';
import { calculateEstimatedDays, calculateEstimatedMonths, calculateMonthlyQada, calculateTotalDailyPlan, calculateTotalMonthlyPlan, isValidDailyTarget, MAX_DAILY_QADA } from '../utils/qadaPlan';
import { toWesternDigits } from '../utils/formatters';
import './prayerDailyPlan.css';

const number = (value: number) => value.toLocaleString('en-US');
const presets = [1, 2, 3, 5, 10];

export function PrayerDailyPlan({ prayer, name, remaining, completed, today, target, onChange }: {
  prayer: PrayerKey; name: string; remaining: number; completed: number; today: number;
  target?: number; onChange: (target: number) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [custom, setCustom] = useState(false);
  const [draft, setDraft] = useState(String(target ?? ''));
  const [error, setError] = useState('');
  useEffect(() => { setDraft(String(target ?? '')); }, [target]);
  const valid = isValidDailyTarget(target);
  const days = calculateEstimatedDays(remaining, target);
  const months = calculateEstimatedMonths(remaining, target);
  const choose = (value: number) => {
    if (!isValidDailyTarget(value)) {
      setError('أدخل عددًا صحيحًا موجبًا ضمن الحد المسموح.');
      return;
    }
    setError('');
    setDraft(String(value));
    void onChange(value).catch(() => setError('تعذّر حفظ الخطة. حاول مجددًا.'));
  };

  if (remaining <= 0) return <div className="qada-plan-empty">
    {completed > 0 ? <><Check size={15} /> تم إكمال قضاء هذه الصلاة ✓</> : <a href="/profile?recalculate=1">أعدّ حساب الصلوات لبدء خطتك ←</a>}
  </div>;

  return <div className="qada-daily-plan">
    <button className="qada-plan-toggle" type="button" aria-expanded={expanded} aria-controls={`plan-${prayer}`} onClick={() => setExpanded(!expanded)}>
      <span className="qada-plan-label"><Target size={16} /> خطة القضاء اليومية</span>
      <span className="qada-plan-rate">{valid ? `${number(target)} يوميًا` : 'اختر معدّلك'}<ChevronDown size={15} className={expanded ? 'rotate-180' : ''} /></span>
    </button>
    {valid && <div className="qada-plan-facts">
      <span><CalendarDays size={14} /> <b>{number(calculateMonthlyQada(target))}</b> شهريًا</span>
      <span className="qada-plan-today"><bdi dir="ltr">{number(today)} / {number(target)}</bdi> اليوم{today >= target && <Check size={13} />}</span>
    </div>}
    {valid && <div className="qada-plan-estimate" aria-live="polite">
      المدة المتوقعة لقضاء {name}: <strong>{days < 30 ? `${number(days)} يومًا` : `حوالي ${number(months)} ${months >= 3 && months <= 10 ? 'أشهر' : 'شهرًا'}`}</strong>
      {days >= 30 && <span> · {number(days)} يومًا</span>}
    </div>}
    {expanded && <div id={`plan-${prayer}`} className="qada-plan-editor">
      <p>اختر المعدل الذي يناسبك.</p>
      <div className="qada-plan-presets" role="group" aria-label={`المعدل اليومي لصلاة ${name}`}>
        {presets.map(value => <button type="button" key={value} aria-pressed={target === value && !custom} onClick={() => { setCustom(false); choose(value); }}>{value}</button>)}
        <button type="button" aria-pressed={custom} onClick={() => setCustom(true)}>مخصص</button>
      </div>
      {(custom || (valid && !presets.includes(target))) && <div className="qada-plan-custom">
        <button type="button" disabled={!valid || target <= 1} aria-label={`تقليل خطة ${name}`} onClick={() => choose(target - 1)}><Minus size={16} /></button>
        <label><span className="sr-only">الهدف اليومي لصلاة {name}</span><input inputMode="numeric" value={draft} dir="ltr" aria-invalid={!!error} onChange={event => { setDraft(toWesternDigits(event.target.value)); setError(''); }} onKeyDown={event => { if (event.key === 'Enter') choose(Number(draft)); }} /></label>
        <button type="button" disabled={target >= MAX_DAILY_QADA} aria-label={`زيادة خطة ${name}`} onClick={() => choose((target ?? 0) + 1)}><Plus size={16} /></button>
        <button type="button" className="qada-plan-save" onClick={() => choose(Number(draft))}>حفظ</button>
      </div>}
      {error && <p role="alert" className="qada-plan-error">{error}</p>}
      <p className="qada-plan-note">الشهر التخطيطي 30 يومًا. المدة تقريبية؛ يمكنك تجاوز هدف اليوم.</p>
    </div>}
  </div>;
}

export function DailyPlanSummary({ plans }: { plans: QadaPlan }) {
  const total = calculateTotalDailyPlan(plans);
  return <section className="qada-surface-card qada-plan-summary" aria-labelledby="daily-plan-summary">
    <div className="qada-plan-summary-heading"><div><h3 id="daily-plan-summary"><Target size={18} /> إجمالي خطة القضاء اليومية</h3><p>خطتك الشخصية، بالمعدل الذي اخترته لكل صلاة.</p></div>
      <div className="qada-plan-summary-total"><strong>{number(total)}</strong><span>صلاة قضاء يوميًا</span></div>
    </div>
    <div className="qada-plan-breakdown">{PRAYERS_LIST.map(({ key, arabicName }) => <div key={key}><span>{arabicName}</span><b>{isValidDailyTarget(plans[key]) ? number(plans[key]) : 'لم تُحدّد'}</b></div>)}</div>
    <p className="qada-plan-summary-month"><CalendarDays size={16} /> حوالي <b>{number(calculateTotalMonthlyPlan(plans))}</b> صلاة قضاء شهريًا <span>· 30 يومًا</span></p>
  </section>;
}
