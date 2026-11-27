import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'motion/react';
import { Check, ChevronLeft, X } from 'lucide-react';
import { useStreak } from '../../context/StreakContext';
import { consecutiveDays, remainingDays, shiftDate, STREAK_BADGES } from '../../services/streakModel';
import { IslamicBadge } from './IslamicBadge';
import './streak.css';

const earnedDate = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString('ar-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const weekNames = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
export function DashboardStreak() {
  const { cache, summary } = useStreak();
  const reduced = useReducedMotion();
  const latest = STREAK_BADGES.filter(b => cache.achievements.some(a => a.achievementId === b.id)).at(-1);
  const next = STREAK_BADGES.find(b => !cache.achievements.some(a => a.achievementId === b.id));
  const goal = next?.requirement ?? latest?.requirement ?? 1;
  // Show real daily steps in this milestone. Long stages scroll rather than
  // squeezing hundreds of indistinguishable dots onto a phone screen.
  const milestone = latest?.requirement ?? 0;
  const start = summary.currentStreak < milestone ? 0 : Math.min(milestone, Math.max(0, goal - 1));
  const progress = Math.min(goal, summary.currentStreak);
  const days = Array.from({ length: goal - start + 1 }, (_, index) => start + index);
  const timeline = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const viewport = timeline.current;
    if (!viewport) return;
    const index = Math.max(0, progress - start);
    const x = 12 + index * (viewport.scrollWidth - 24) / Math.max(1, days.length - 1);
    viewport.scrollLeft = -Math.max(0, x - viewport.clientWidth / 2);
  }, [progress, start, goal, days.length, latest?.id]);
  if (!latest) return null;
  return <section className={`streak-dashboard-range${next ? '' : ' is-complete'}`} dir="rtl" aria-label="تقدّم الاستمرارية">
    <a className="streak-current-badge" href="/profile#achievements" aria-label={`شارتي الحالية: ${latest.title}`} title={latest.title}>
      <IslamicBadge badgeId={latest.id} size={48} unlocked />
    </a>
    <div ref={timeline} className="streak-range-scroll" tabIndex={0} aria-label="أيام الاستمرارية، اسحب لرؤية المزيد">
      <div className="streak-range-timeline" style={{ minWidth: `${days.length * 30}px` }}>
        <div className="streak-range-track" role="progressbar" aria-label="الاستمرارية" aria-valuemin={start} aria-valuemax={goal} aria-valuenow={progress} aria-valuetext={consecutiveDays(summary.currentStreak)}>
          <motion.span initial={false} animate={{ width: `${Math.max(0, progress - start) / (goal - start) * 100}%` }} transition={{ duration: reduced ? 0 : .45 }} />
        </div>
        <div className="streak-range-days">{days.map(day => <span key={day} className={`streak-range-day${day <= progress ? ' is-done' : ''}${day === progress ? ' is-current' : ''}`} aria-label={`اليوم ${day}${day <= progress ? '، مكتمل' : ''}`} aria-current={day === progress ? 'step' : undefined}><i aria-hidden="true" /><bdi>{day}</bdi></span>)}</div>
      </div>
    </div>
    {next && <span className="streak-next-badge" title={`الشارة القادمة: ${next.title}`}><IslamicBadge badgeId={next.id} size={48} unlocked={false} /></span>}
    <p className="streak-range-caption">{next ? <><strong>{next.title}</strong><span>{remainingDays(Math.max(0, goal - summary.currentStreak))} للشارة القادمة</span></> : <span>أكملت جميع الشارات ✨</span>}</p>
  </section>;
}
export function StreakCard({ profile = false }: { profile?: boolean }) {
  const { cache, today, summary, status, retry, isDailyActivityCompleted } = useStreak();
  const reduced = useReducedMotion();
  const next = STREAK_BADGES.find(b => !cache.achievements.some(a => a.achievementId === b.id));
  const badge = next || STREAK_BADGES.at(-1)!;
  const start = shiftDate(today, -((new Date(`${today}T12:00Z`).getUTCDay() + 1) % 7));
  return <section className="streak-card lg:col-span-2" dir="rtl" aria-label="الاستمرارية اليومية">
    <div className="streak-heading">
      <IslamicBadge badgeId={badge.id} size={76} unlocked={!next} />
      <div className="streak-heading-copy"><span className="streak-eyebrow">خطوة صغيرة، كل يوم</span>
        <h2><motion.span key={summary.currentStreak} initial={reduced ? false : { opacity: .4, y: 4 }} animate={{ opacity: 1, y: 0 }}>{summary.broken ? 'انقطع التسلسل' : consecutiveDays(summary.currentStreak)}</motion.span></h2>
        <p>{summary.broken ? 'لا بأس، ابدأ من جديد اليوم 🌿' : summary.currentStreak ? 'أحسنت، استمر على مهل!' : 'أنجز نشاطًا اليوم لتبدأ رحلتك.'}</p>
      </div>
      {!profile && <a className="streak-profile-link" href="/profile#achievements">إنجازاتي <ChevronLeft size={15} /></a>}
    </div>
    <div className="streak-week" aria-label="نشاط هذا الأسبوع">
      {weekNames.map((name, i) => {
        const date = shiftDate(start, i), done = isDailyActivityCompleted(date);
        return <div key={date} className="streak-day" aria-label={`${name} ${done ? 'مكتمل' : 'غير مكتمل'}${date === today ? '، اليوم' : ''}`}>
          <span>{name}</span><motion.span className={`streak-day-dot ${done ? 'done' : ''} ${date === today ? 'today' : ''}`}
            animate={{ scale: 1 }} initial={reduced ? false : { scale: .9 }}>{done ? <Check size={16} aria-hidden /> : <span aria-hidden>·</span>}</motion.span>
        </div>;
      })}
    </div>
    {next ? <div className="streak-next"><div><span>{remainingDays(Math.max(0, next.requirement - summary.currentStreak))} لشارة «{next.title}»</span><bdi>{summary.currentStreak} / {next.requirement}</bdi></div>
      <div className="streak-track" role="progressbar" aria-label={`التقدم نحو ${next.title}`} aria-valuemin={0} aria-valuemax={next.requirement} aria-valuenow={Math.min(next.requirement, summary.currentStreak)}><motion.span initial={false} animate={{ width: `${Math.min(100, summary.currentStreak / next.requirement * 100)}%` }} transition={{ duration: reduced ? 0 : .5 }} /></div>
    </div> : <p className="streak-note">اكتملت مجموعتك، ورحلتك مستمرة.</p>}
    <div className="streak-footer"><span>أطول سلسلة: {summary.longestStreak} يومًا</span><span role="status">{status === 'saved' ? 'محفوظ في حسابك' : status === 'loading' ? 'جارٍ تحميل الاستمرارية…' : status === 'pending' ? 'بانتظار المزامنة' : <button onClick={retry}>تعذّرت المزامنة · إعادة المحاولة</button>}</span></div>
  </section>;
}

const BadgeDialog: React.FC<{ id: string; celebration?: boolean; onClose: () => void }> = ({ id, celebration = false, onClose }) => {
  const { cache, summary } = useStreak();
  const ref = useRef<HTMLDialogElement>(null);
  const reduced = useReducedMotion();
  const badge = STREAK_BADGES.find(b => b.id === id)!;
  const award = cache.achievements.find(a => a.achievementId === id);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.showModal();
    const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return createPortal(<dialog ref={ref} className="streak-dialog" dir="rtl" aria-labelledby="badge-dialog-title" onCancel={e => { e.preventDefault(); onClose(); }}>
    <motion.div className="streak-dialog-content" initial={reduced ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
      <button className="streak-dialog-close" aria-label="إغلاق" onClick={onClose}><X size={20} /></button>
      <span className="streak-eyebrow">{celebration ? 'ما شاء الله 🌿 · إنجاز جديد' : 'مجموعة قضاء · إنجاز شخصي'}</span>
      <div className={`streak-badge-stage ${celebration ? 'celebrate' : ''}`}><IslamicBadge badgeId={id} size={176} unlocked={Boolean(award)} animated={celebration} />
        {celebration && !reduced && <div className="streak-sparks" aria-hidden>{Array.from({ length: 6 }, (_, i) => <motion.i key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: [0, .8, 0], y: -24 }} transition={{ delay: i * .13, duration: 1.6 }} style={{ left: `${15 + i * 14}%`, top: `${25 + (i % 3) * 20}%` }} />)}</div>}
      </div>
      <h2 id="badge-dialog-title">{badge.title}</h2>
      <p>{award ? `أكملت ${consecutiveDays(badge.requirement)}` : consecutiveDays(badge.requirement)}</p>
      <p className="streak-note">{celebration ? 'تمت إضافة الشارة إلى إنجازاتك' : award ? `حصلت عليها في ${earnedDate(award.unlockedAt)}` : `${remainingDays(badge.requirement - summary.currentStreak)} لاكتساب هذه الشارة`}</p>
      <p className="streak-disclaimer">علامة على استمراريتك في التطبيق، وليست مقياسًا للإيمان أو للأجر.</p>
      <button autoFocus className="streak-primary" onClick={onClose}>{celebration ? 'متابعة' : 'تم'}</button>
    </motion.div>
  </dialog>, document.body);
};
export function AchievementCelebration() {
  const { cache, acknowledge } = useStreak();
  const first = cache.achievements.find(a => !cache.announced.includes(a.achievementId));
  return first ? <BadgeDialog key={first.achievementId} id={first.achievementId} celebration onClose={() => acknowledge(first.achievementId)} /> : null;
}
export function ProfileAchievements() {
  const { cache, summary, setTimezone, status } = useStreak();
  const [selected, setSelected] = useState<string | null>(null);
  const [timezone, setZone] = useState(cache.timezone);
  useEffect(() => setZone(cache.timezone), [cache.timezone]);
  const zones = (Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.('timeZone') || ['Africa/Tunis', 'Africa/Lagos', 'Europe/Paris', 'Asia/Riyadh', 'UTC'];
  return <>
    <StreakCard profile />
    <section id="achievements" className="streak-achievements" dir="rtl" aria-labelledby="achievements-title">
      <div className="streak-collection-title"><div><span className="streak-eyebrow">خطواتك تستحق أن تُحفظ</span><h2 id="achievements-title">إنجازاتي</h2></div><span>{cache.achievements.length} / {STREAK_BADGES.length} شارات مكتسبة</span></div>
      <p className="streak-note">شاراتك المكتسبة تبقى معك، حتى إذا بدأت سلسلة جديدة.</p>
      <div className="streak-badge-grid">{STREAK_BADGES.map(badge => {
        const award = cache.achievements.find(a => a.achievementId === badge.id);
        return <button key={badge.id} className={`streak-badge-tile ${award ? 'earned' : ''}`} onClick={() => setSelected(badge.id)}>
          <IslamicBadge badgeId={badge.id} size={104} unlocked={Boolean(award)} />
          <strong>{badge.title}</strong><span>{award ? earnedDate(award.unlockedAt) : consecutiveDays(badge.requirement)}</span>
          {!award && <small>{remainingDays(badge.requirement - summary.currentStreak)}</small>}
        </button>;
      })}</div>
      <details className="streak-timezone"><summary>كيف يُحسب يوم النشاط؟</summary><p>زيارتك للتطبيق تُحتسب مرة واحدة كل يوم حسب المنطقة الزمنية لحسابك. العودة غدًا تضيف يومًا جديدًا، وفتح التطبيق عدة مرات في اليوم لا يزيد السلسلة. تُحتسب أيضًا الصلاة والقرآن والأذكار والصيام، دون مضاعفة اليوم نفسه.</p>
        <p>يُحتسب اليوم مرة واحدة. تغيير المنطقة الزمنية يطبّق على الأنشطة القادمة، ولا يغيّر الأيام المحفوظة.</p>
        <label>المنطقة الزمنية للحساب<select value={timezone} onChange={e => setZone(e.target.value)} dir="ltr">{[...new Set([cache.timezone, ...zones])].sort().map(z => <option key={z}>{z}</option>)}</select></label>
        <button className="streak-primary" disabled={status !== 'saved' || timezone === cache.timezone} onClick={() => void setTimezone(timezone)}>حفظ المنطقة الزمنية</button>
      </details>
    </section>
    {selected && <BadgeDialog id={selected} onClose={() => setSelected(null)} />}
  </>;
}
