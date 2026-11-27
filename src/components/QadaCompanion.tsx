import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Volume2, VolumeX, X } from 'lucide-react';
import { companionMessage } from './companionMessages';
import { QadaBoy } from './QadaBoy';
import { COMPANION_FEEDBACK, GUIDE_OPENED, type CompanionFeedback, type CompanionEmotion } from '../services/companionFeedback';
import { getCompanionVoice, subscribeCompanionVoice, speakCompanion, stopCompanionVoice, toggleCompanionVoice } from '../services/companionVoice';
import './companionPeek.css';

/** Small vector companion: decorative feedback never changes recorded progress. */
export function QadaCompanion() {
  const reducedMotion = useReducedMotion();
  const [reaction, setReaction] = useState(0);
  const [emotion, setEmotion] = useState<CompanionEmotion>('calm');
  const [message, setMessage] = useState('رحلتك تبدأ بخطوة 🌿');
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [hidden, setHidden] = useState(false);
  const voice = useSyncExternalStore(subscribeCompanionVoice, getCompanionVoice, getCompanionVoice);
  const voiceEnabled = voice.enabled;
  const speaking = voice.owner === 'companion' && voice.phase === 'speaking';
  const voiceError = voice.owner === 'companion' && voice.phase === 'error' ? voice.error : '';
  const loading = voice.owner === 'companion' && voice.phase === 'loading';
  const sequence = useRef(0);

  useEffect(() => {
    const react = (event: MouseEvent) => {
      if (hidden) return;
      if (!(event.target instanceof Element)) return;
      const control = event.target.closest('button, a, [role="button"], [data-companion-action]');
      if (!control || !control.closest('.qada-experience') || control.closest('[data-companion], [data-feature-help]') || control.matches(':disabled, [aria-disabled="true"]')) return;
      const label = control.getAttribute('data-companion-action') || control.getAttribute('aria-label') || control.textContent || '';
      const nextMessage = companionMessage(label, sequence.current++);
      setEmotion(/قرآن|مصحف|ذكر|استغف/.test(label) ? 'focused' : 'curious');
      setMessage(nextMessage);
      setReaction(value => value + 1);
      if (voiceEnabled) speakCompanion(nextMessage, 'companion');
    };
    document.addEventListener('click', react, true);
    return () => document.removeEventListener('click', react, true);
  }, [hidden, voiceEnabled]);

  useEffect(() => {
    const pauseForGuide = () => { stopCompanionVoice('companion'); setBubbleVisible(false); };
    window.addEventListener(GUIDE_OPENED, pauseForGuide);
    return () => window.removeEventListener(GUIDE_OPENED, pauseForGuide);
  }, []);

  useEffect(() => {
    const celebrate = (event: Event) => {
      if (hidden) return;
      const feedback = (event as CustomEvent<CompanionFeedback>).detail;
      setMessage(feedback.message);
      setEmotion(feedback.emotion);
      setReaction(value => value + 1);
      if (voiceEnabled) speakCompanion(feedback.message, 'companion');
    };
    window.addEventListener(COMPANION_FEEDBACK, celebrate);
    return () => window.removeEventListener(COMPANION_FEEDBACK, celebrate);
  }, [hidden, voiceEnabled]);

  // The companion can be dismissed with the small X inside his speech bubble.
  // Voice is independent: a muted interaction still shows the same text.
  useEffect(() => {
    if (reaction === 0) return;
    setBubbleVisible(true);
    const timeout = window.setTimeout(() => { setBubbleVisible(false); setEmotion('calm'); }, 6500);
    return () => window.clearTimeout(timeout);
  }, [reaction]);

  useEffect(() => () => stopCompanionVoice('companion'), []);

  // Stay off-screen between messages. Audio may outlast the text's minimum
  // reading time, but an audio error must never leave him permanently visible.
  const visible = !hidden && (bubbleVisible || speaking || loading);
  return <><span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{reaction > 0 && !hidden ? message : ''}</span><AnimatePresence>{visible && <motion.aside className="qada-companion qada-companion-peek" data-companion data-emotion={emotion} dir="rtl" aria-label="رفيق قضاء"
    initial={reducedMotion ? {opacity:0} : {x:-330,opacity:0}}
    animate={{x:0,opacity:1}}
    exit={reducedMotion ? {opacity:0} : {x:-330,opacity:0}}
    transition={{duration:reducedMotion?0:.42,ease:[.22,1,.36,1]}}>
    <AnimatePresence>
      {(bubbleVisible || speaking || loading) && <motion.div className="qada-companion-copy qada-companion-speech-bubble"
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.2 }}>
        <p aria-hidden="true">{message}</p>
        {voiceError && <small role="status">{voiceError}</small>}
        <div className="qada-companion-bubble-footer">
          <span className="qada-companion-signature">رفيق قضاء <span aria-hidden="true">✦</span></span>
    <button type="button" className="qada-companion-voice" aria-pressed={voiceEnabled}
      aria-label={voiceError ? 'إعادة تشغيل صوت الرفيق' : voiceEnabled ? 'كتم صوت الرفيق' : 'تشغيل صوت الرفيق'}
      title={voiceError ? 'إعادة تشغيل صوت الرفيق' : voiceEnabled ? 'كتم صوت الرفيق' : 'تشغيل صوت الرفيق'}
      onClick={() => { setReaction(value => value + 1); toggleCompanionVoice(message, 'companion'); }}>
      {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
    </button>
    <button type="button" className="qada-companion-dismiss" aria-label="إخفاء الرفيق" title="إخفاء الرفيق"
      onClick={() => { stopCompanionVoice('companion'); setHidden(true); }}>
      <X size={15} strokeWidth={2} />
    </button>
        </div>
      </motion.div>}
    </AnimatePresence>
    <motion.div key={reaction} className="qada-companion-character" aria-hidden="true"
      animate={reducedMotion ? undefined : emotion === 'celebrate' ? { rotate:[0,-4,2,0] } : {rotate:[-2,1,0]}}
      transition={{ duration: reaction ? 0.8 : 2, ease: 'easeInOut' }}>
      <span aria-hidden="true"><QadaBoy pose="peek" emotion={emotion} reaction={reaction} speaking={speaking} reducedMotion={!!reducedMotion} /></span>
    </motion.div>
  </motion.aside>}</AnimatePresence></>;
}
