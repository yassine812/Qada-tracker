import React, { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'motion/react';
import { Flame, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useStreak } from '../../context/StreakContext';
import { consecutiveDays, remainingDays, STREAK_BADGES } from '../../services/streakModel';
import { AchievementCelebration } from './StreakFeatures';
import { IslamicBadge } from './IslamicBadge';
import { DailyReminderModal } from '../DailyReminderModal';
import { NotificationPrompt } from '../NotificationPrompt';
import { hasSeenDailyPrompt, markDailyPromptSeen } from '../../services/startupState';
import { useAuth } from '../../context/AuthContext';

function StreakReminder({ onClose }: { onClose: () => void }) {
  const { summary, cache, today, isDailyActivityCompleted } = useStreak();
  const { setActiveTab } = useApp();
  const dialog = useRef<HTMLDialogElement>(null);
  const reduced = useReducedMotion();
  const done = isDailyActivityCompleted(today);
  const next = STREAK_BADGES.find(b => !cache.achievements.some(a => a.achievementId === b.id));
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    return () => { dialog.current?.close(); if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, []);
  const begin = () => { onClose(); setActiveTab('dashboard'); window.scrollTo({ top: 0, behavior: 'instant' }); };
  return createPortal(<dialog ref={dialog} className="streak-dialog streak-entry-dialog" dir="rtl" aria-labelledby="streak-entry-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <motion.div className="streak-dialog-content" initial={reduced ? false : { opacity: 0, y: 22, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .4 }}>
      <button type="button" className="streak-dialog-close" aria-label="إغلاق تذكير الاستمرارية" onClick={onClose}><X size={20} /></button>
      <span className="streak-eyebrow">كل يوم فرصة لخطوة جميلة</span>
      <motion.div className="streak-entry-orb" animate={reduced ? {} : { y: [0, -6, 0] }} transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }} aria-hidden="true"><Flame size={48} /><bdi>{summary.currentStreak}</bdi></motion.div>
      <h2 id="streak-entry-title">{summary.currentStreak > 1 ? 'أحسنت، استمرّ!' : done ? 'أهلًا بك، أضأت يومك!' : 'نبدأ اليوم بخطوة؟'}</h2>
      <p className="streak-entry-count">{summary.currentStreak ? consecutiveDays(summary.currentStreak) : 'بدايتك تستحق التشجيع 🌿'}</p>
      <p className="streak-note">{done ? 'زيارتك اليوم أضافت يومًا لسلسلتك. ارجع غدًا لنكمل معًا، واختر اليوم وردًا يناسبك.' : 'صلاة قضاء، ورد قرآن، أذكار، أو استغفار اليوم… اختر ما يناسبك.'}</p>
      {next && <div className="streak-entry-goal"><IslamicBadge badgeId={next.id} size={56} unlocked={false} /><div><strong>{next.title}</strong><span>{remainingDays(Math.max(0, next.requirement - summary.currentStreak))} للشارة القادمة</span></div></div>}
      <button type="button" autoFocus className="streak-primary" onClick={begin}>{done ? 'متابعة يومي' : 'لنأخذ خطوة اليوم'}</button>
      <button type="button" className="streak-entry-later" onClick={onClose}>لاحقًا</button>
    </motion.div>
  </dialog>, document.body);
}

/** Once per account day, including after closing/reopening the app. */
export function AppStreakExperience() {
  const { today, status } = useStreak();
  const { session } = useAuth();
  const promptKey = `streak:${session?.user.id || 'local'}`;
  if (status === 'loading') return null;
  return <DailyEntryPrompts key={`${promptKey}:${today}`} promptKey={promptKey} today={today} />;
}

const DailyEntryPrompts: React.FC<{ promptKey: string; today: string }> = ({ promptKey, today }) => {
  const { cache } = useStreak();
  // A newly earned badge already celebrates this visit: don't queue a second
  // streak dialog immediately behind it. Other prompts retain their own rules.
  const [dismissed, setDismissed] = useState(() => hasSeenDailyPrompt(promptKey, today)
    || cache.achievements.some(a => !cache.announced.includes(a.achievementId)));
  const [notificationsDone, setNotificationsDone] = useState(() => Capacitor.getPlatform() === 'android');
  useEffect(() => { markDailyPromptSeen(promptKey, today); }, [promptKey, today]);
  if (cache.achievements.some(a => !cache.announced.includes(a.achievementId))) return <AchievementCelebration />;
  if (!dismissed) return <StreakReminder onClose={() => setDismissed(true)} />;
  if (!notificationsDone) return <NotificationPrompt onComplete={() => setNotificationsDone(true)} />;
  return <DailyReminderModal />;
};
