import { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import { QadaBoy } from './QadaBoy';
import { useApp } from '../context/AppContext';
import './appWelcome.css';

/** A brief greeting on app launch; navigating between tabs never replays it. */
export function AppWelcome({ onComplete }: { onComplete: () => void }) {
  const { settings } = useApp();
  const reducedMotion = useReducedMotion();
  const dialog = useRef<HTMLDialogElement>(null);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'صباح الخير والسكينة' : hour < 18 ? 'أهلًا بك، نوّرت قضاء' : 'مساء الخير والطمأنينة';
  const name = settings?.userName?.trim();

  useLayoutEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    const timer = window.setTimeout(onComplete, 5800);
    return () => {
      window.clearTimeout(timer);
      dialog.current?.close();
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [onComplete]);

  return createPortal(
    <dialog ref={dialog} className="qada-launch-welcome" dir="rtl" aria-labelledby="qada-launch-title" onCancel={event => { event.preventDefault(); onComplete(); }}>
      <motion.section className="qada-launch-card"
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 28, scale: .94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .5 }}>
        <button type="button" className="qada-launch-close" onClick={onComplete} aria-label="إغلاق الترحيب"><X size={20} /></button>
        <div className="qada-launch-illustration" aria-hidden="true">
          <span className="qada-launch-halo" />
          <motion.div className="qada-launch-boy"
            initial={reducedMotion ? false : { x: -100, y: 22, rotate: -12, opacity: 0 }}
            animate={reducedMotion ? {} : { x: 0, y: [0, -8, 0], rotate: 0, opacity: 1 }}
            transition={{ x: { duration: .7 }, opacity: { duration: .5 }, rotate: { duration: .7 }, y: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }}>
            <QadaBoy emotion="happy" reaction={1} reducedMotion={!!reducedMotion} />
          </motion.div>
          <span className="qada-launch-star qada-launch-star-one">✦</span>
          <span className="qada-launch-star qada-launch-star-two">✧</span>
        </div>
        <p className="qada-launch-eyebrow">السلام عليكم ورحمة الله</p>
        <h1 id="qada-launch-title">{greeting}{name && <><br /><bdi>يا {name}</bdi></>}</h1>
        <p className="qada-launch-message">سعيد بوجودك معي 🌿<br />خطوة صغيرة اليوم، وخيرٌ يكبر معك.</p>
        <button type="button" className="qada-launch-continue" onClick={onComplete}>لنبدأ على بركة الله</button>
      </motion.section>
    </dialog>, document.body,
  );
}
