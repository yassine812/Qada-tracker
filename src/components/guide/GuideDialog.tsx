import { useEffect, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { QadaBoy } from '../QadaBoy';
import type { TabType, IbadatSubTab } from '../../types';
import type { CompanionEmotion } from '../../services/companionFeedback';
import { GUIDE_OPENED } from '../../services/companionFeedback';
import './guide.css';
import { useGuideSpotlight } from './useGuideSpotlight';
import { getCompanionVoice, subscribeCompanionVoice, speakCompanion, stopCompanionVoice, toggleCompanionVoice } from '../../services/companionVoice';

export const GUIDE_STEPS: { title: string; text: string; tip: string; tab: TabType; subTab?: IbadatSubTab; emotion: CompanionEmotion; focus?: string }[] = [
  { title: 'أهلًا بك! أنا رفيقك في قضاء', text: 'سأرافقك في جولة قصيرة لأعرّفك على التطبيق. نشجّع كل خطوة، ونتقدّم على مهل.', tip: 'يمكنك تخطي الجولة في أي وقت، ثم إعادتها من «المزيد».', tab: 'dashboard', emotion: 'happy' },
  { title: 'مواقيت الصلاة في أعلى الرئيسية', text: 'هنا تجد مواقيت الصلاة والصلاة القادمة. اختر مدينتك أو اسمح بالموقع للحصول على المواقيت المناسبة لمكانك.', tip: 'الجولة لا تطلب إذن الموقع ولا تغيّر بياناتك.', tab: 'dashboard', emotion: 'curious', focus: '[data-guide="prayer-times"]' },
  { title: 'تقدّمك، كلّه في مكان واحد', text: 'دوائر الرئيسية تعرض ما أنجزته وما تبقّى من الصلاة والصيام والاستغفار. للاستغفار عدّاد اليوم وهدفك الشخصي، كلٌّ على حدة.', tip: 'اضغط «أستغفر الله» لتسجيل الذكر؛ سأفرح معك عند كل تقدّم!', tab: 'dashboard', emotion: 'celebrate', focus: '[data-guide="progress"]' },
  { title: 'سجّل الصلوات التي قضيتها', text: 'في «العبادات» اختر الصلاة وسجّل ما قضيته فعلًا. ينخفض المتبقّي وتزداد نسبة إنجازك، ويمكنك مراجعة سجلّك.', tip: 'يمكنك أيضًا التسجيل السريع من الصفحة الرئيسية.', tab: 'ibadat', subTab: 'prayers', emotion: 'focused', focus: '[data-guide="ibadat"]' },
  { title: 'خطوة بخطوة في قضاء الصيام', text: 'أدخل عدد أيام الصيام المتبقّية، ثم سجّل يومًا بعد إتمام صيامه. ستجد الإنجاز والسجل في هذا القسم.', tip: 'الجولة للتعرّف فقط؛ لن نسجّل صلاة أو يوم صيام بدلًا منك.', tab: 'ibadat', subTab: 'fasting', emotion: 'happy', focus: '[data-guide="ibadat"]' },
  { title: 'قسم الزكاة', text: 'في قسم الزكاة يمكنك إدخال أموالك ومراجعة الحساب والنتيجة. اقرأ التنبيهات المرفقة قبل الاعتماد على التقدير.', tip: 'هذه أداة مساعدة، ولا تغني عن سؤال أهل العلم عند الحاجة.', tab: 'ibadat', subTab: 'zakat', emotion: 'focused', focus: '[data-guide="ibadat"]' },
  { title: 'وردك من القرآن', text: 'افتح المصحف، انتقل إلى السورة أو الصفحة التي تريدها، واستخدم أدوات القراءة والاستماع. تابع من موضعك المحفوظ عند العودة.', tip: 'ابدأ بورد يسير تستطيع الاستمرار عليه.', tab: 'quran', emotion: 'calm', focus: '[data-guide="quran"]' },
  { title: 'أذكار ترافق يومك', text: 'اختر أذكار الصباح أو المساء أو النوم، ثم اضغط عند كل تكرار. وفي الرئيسية يظهر تذكير الذكر المناسب للوقت.', tip: 'عندما تُكمل ذكرًا أو مجموعة، سأحتفل معك!', tab: 'dhikr', emotion: 'happy', focus: '[data-guide="dhikr"]' },
  { title: 'خصّص تجربتك', text: 'من «المزيد» غيّر المظهر واضبط الإشعارات والنسخ الاحتياطي. ومن أيقونة الحساب افتح ملفك الشخصي لمراجعة معلوماتك وحساباتك.', tip: 'أيقونة الصوت تكتم صوتي فقط؛ تبقى رسائلي ظاهرة.', tab: 'settings', emotion: 'curious', focus: '[data-guide="settings"]' },
  { title: 'جاهز؟ لنبدأ معًا!', text: 'أنا هنا لأشجّعك برسالة تناسب ما تفعله، وابتسامة لكل تقدّم. لا استعجال؛ الاستمرار بخطوات صغيرة هو الأهم.', tip: 'يمكنك إعادة هذه الجولة من «المزيد» ← «إعادة الجولة».', tab: 'dashboard', emotion: 'celebrate', focus: '[data-guide="welcome"]' },
];

type ExplanationStep = { title: string; text: string; tip: string; emotion: CompanionEmotion; focus?: string; subTab?: IbadatSubTab };
export function GuideDialog({ step, onStep, onFinish, steps = GUIDE_STEPS, mode = 'tour', targetElement }: { step: number; onStep: (step: number) => void; onFinish: () => void; steps?: ExplanationStep[]; mode?: 'tour' | 'help'; targetElement?: HTMLElement | null }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const touchY = useRef<number | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const reducedMotion = useReducedMotion();
  const voiceState = useSyncExternalStore(subscribeCompanionVoice, getCompanionVoice, getCompanionVoice);
  const voice = voiceState.enabled;
  const speaking = voiceState.owner === 'guide' && voiceState.phase === 'speaking';
  const voiceError = voiceState.owner === 'guide' && voiceState.phase === 'error' ? voiceState.error : '';
  const current = steps[step];
  const target = current.subTab ? `[data-guide="${{ prayers: 'prayer-card', fasting: 'fasting-card', zakat: 'zakat-card' }[current.subTab]}"]` : current.focus;
  const spotlight = useGuideSpotlight(target, step, panel, targetElement);
  const narration = `${current.title}. ${current.text} ${current.tip}`;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('qada-guide-open');
    window.dispatchEvent(new Event(GUIDE_OPENED));
    dialog.current?.showModal();
    return () => {
      document.body.style.overflow = overflow;
      document.body.classList.remove('qada-guide-open');
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [step]);

  useEffect(() => {
    if (voice) speakCompanion(narration, 'guide');
  }, [voice, narration]);
  useEffect(() => () => stopCompanionVoice('guide'), []);

  const hole = spotlight.rect;
  const radius = hole ? Math.min(18, hole.width / 2, hole.height / 2) : 0;
  const cutout = hole ? `M${hole.left + radius} ${hole.top}h${hole.width - 2 * radius}q${radius} 0 ${radius} ${radius}v${hole.height - 2 * radius}q0 ${radius} -${radius} ${radius}h-${hole.width - 2 * radius}q-${radius} 0 -${radius} -${radius}v-${hole.height - 2 * radius}q0 -${radius} ${radius} -${radius}Z` : '';
  const mask = `M0 0H${spotlight.width}V${spotlight.height}H0Z ${cutout}`;
  return createPortal(<dialog ref={dialog} className="qada-guide-stage" dir="rtl" aria-labelledby="guide-title" aria-describedby="guide-text" onCancel={event => { event.preventDefault(); onFinish(); }}
    onTouchStart={event => { touchY.current = panel.current?.contains(event.target as Node) ? null : event.touches[0]?.clientY ?? null; }}
    onTouchMove={event => { const y = event.touches[0]?.clientY; if (touchY.current !== null && y !== undefined) { window.scrollBy({ top: touchY.current - y, behavior: 'instant' }); touchY.current = y; } }}
    onTouchEnd={() => { touchY.current = null; }}
    onWheel={event => { if (!panel.current?.contains(event.target as Node)) window.scrollBy({ top: event.deltaY, behavior: 'instant' }); }}>
    <svg className="qada-guide-shade" width="100%" height="100%" aria-hidden="true"><path d={mask} fill="#08150ec9" fillRule="evenodd" /></svg>
    {hole && <div className="qada-guide-focus" aria-hidden="true" style={{ left: hole.left, top: hole.top, width: hole.width, height: hole.height }} />}
    <div ref={panel} className="qada-guide-panel">
    <header className="qada-guide-toolbar">
      <span>{mode === 'help' ? 'شرح الميزة مع رفيق قضاء' : 'جولتك مع رفيق قضاء'}{steps.length > 1 && <> · <bdi dir="ltr">{step + 1} / {steps.length}</bdi></>}</span>
      <button type="button" onClick={onFinish}>{mode === 'help' ? 'إغلاق' : 'تخطي الجولة'}</button>
    </header>
    <div className="qada-guide-meter" role="progressbar" aria-label="تقدم الشرح" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={step + 1}><span style={{ width: `${(step + 1) / steps.length * 100}%` }} /></div>
    <motion.div key={step} className="qada-guide-story" initial={reducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="qada-guide-bubble">
        <h2 id="guide-title" ref={heading} tabIndex={-1}>{current.title}</h2>
        <p id="guide-text">{current.text}</p>
      </div>
      <div className="qada-guide-friend">
        <div className="qada-guide-boy" aria-hidden="true"><QadaBoy emotion={current.emotion} reaction={step + 1} speaking={speaking} reducedMotion={!!reducedMotion} /></div>
        <button className="qada-guide-voice" type="button" aria-label={voiceError ? 'إعادة تشغيل صوت الرفيق' : voice ? 'كتم صوت الرفيق' : 'تشغيل صوت الرفيق'} aria-pressed={voice} onClick={() => toggleCompanionVoice(narration, 'guide')}>{voice ? <Volume2 size={20} /> : <VolumeX size={20} />}</button>
        <p>{current.tip}</p>
      </div>
    </motion.div>
    {mode === 'help' && <p className="qada-help-mobile-tip">{current.tip}</p>}
    {voiceError && <p role="status" className="text-xs mt-3 leading-relaxed">{voiceError}</p>}
    <footer className="qada-guide-controls">
      {steps.length > 1 && <button type="button" disabled={step === 0} onClick={() => onStep(step - 1)}><ArrowRight size={17} /> السابق</button>}
      <button type="button" className="qada-guide-next" onClick={() => step === steps.length - 1 ? onFinish() : onStep(step + 1)}>{step === steps.length - 1 ? mode === 'help' ? 'فهمت، شكرًا!' : 'لنبدأ' : 'متابعة'} <ArrowLeft size={17} /></button>
    </footer>
    </div>
  </dialog>, document.body);
}
