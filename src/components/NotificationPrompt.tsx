import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'motion/react';
import { BellRing, X } from 'lucide-react';
import { enablePush, getPermissionState, platform, supportsPush } from '../services/notificationService';
import { defaultPushPreferences } from '../services/pushPreferences';
import { getPrayerSettings } from '../utils/prayerTimes';
import { hasRequestedNotifications, markNotificationsRequested } from '../services/startupState';
import { useApp } from '../context/AppContext';

/** A device permission invitation shown once, independently of account backups. */
export function NotificationPrompt({ onComplete }: { onComplete: () => void }) {
  const { showToast } = useApp();
  const [eligible] = useState(() => supportsPush() && getPermissionState() === 'default' && !hasRequestedNotifications());
  const dialog = useRef<HTMLDialogElement>(null);
  const reduced = useReducedMotion();
  const [needsHelp, setNeedsHelp] = useState(false);
  const pending = useRef(false);
  const complete = useRef(onComplete);
  complete.current = onComplete;
  useEffect(() => {
    if (!eligible) { complete.current(); return; }
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    return () => { dialog.current?.close(); if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, [eligible]);
  const skip = () => { markNotificationsRequested(); onComplete(); };
  const activate = () => {
    if (pending.current) return;
    pending.current = true;
    // Call synchronously from the tap so iOS can show its native permission UI.
    // Release our own top-layer dialog before handing control to Android/Chrome.
    // Do not mount the next startup dialog while native permission UI is open.
    dialog.current?.close();
    markNotificationsRequested();
    const task = enablePush(defaultPushPreferences(getPrayerSettings()));
    void task.then(() => {
      onComplete();
      showToast('تم تفعيل تذكيراتك. سيُحفظ اختيارك لهذا الجهاز.', 'success');
    }).catch(() => {
      if (getPermissionState() === 'granted') {
        onComplete();
        showToast('حُفظ السماح بالإشعارات. سنعيد اتصال التذكيرات تلقائيًا.');
      } else {
        setNeedsHelp(true);
        dialog.current?.showModal();
      }
    }).finally(() => { pending.current = false; });
  };
  if (!eligible) return null;
  return createPortal(<dialog ref={dialog} className="streak-dialog" dir="rtl" aria-labelledby="notification-permission-title" onCancel={event => { event.preventDefault(); skip(); }}>
    <motion.div className="streak-dialog-content" initial={reduced ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <button type="button" className="streak-dialog-close" aria-label="إغلاق طلب الإشعارات" onClick={skip}><X size={20} /></button>
      <div className="streak-entry-orb" aria-hidden="true"><BellRing size={48} /></div>
      <h2 id="notification-permission-title">{needsHelp ? 'لم يكتمل السماح بالإشعارات' : 'نذكّرك بالخير؟'}</h2>
      <p className="streak-note">{needsHelp ? getPermissionState() === 'denied'
        ? 'الإذن محظور في المتصفح. افتح إعدادات الموقع ← الإشعارات، واسمح لقضاء، ثم أعد المحاولة.'
        : platform() === 'Android'
          ? 'إذا ظهرت رسالة عن النوافذ المتراكبة، أغلق الفقاعات العائمة أو الشريط الجانبي أو مرشّح الشاشة التابع لتطبيق آخر، ثم اضغط إعادة المحاولة. يمكنك المتابعة دون إشعارات.'
          : 'لم يمنح المتصفح الإذن. يمكنك إعادة المحاولة أو المتابعة دون إشعارات، وتفعيلها لاحقًا من الإعدادات.'
        : 'اسمح بإشعارات الصلاة والأذكار والاستغفار مرة واحدة. سيبقى اختيارك محفوظًا، ويمكنك تغييره من الإعدادات.'}</p>
      <button type="button" autoFocus className="streak-primary mt-5" onClick={activate}>{needsHelp ? 'إعادة المحاولة' : 'السماح بالإشعارات'}</button>
      <button type="button" className="streak-entry-later" onClick={skip}>ليس الآن</button>
    </motion.div>
  </dialog>, document.body);
}
