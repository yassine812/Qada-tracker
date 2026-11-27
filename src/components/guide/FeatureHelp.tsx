import React, { useEffect, useState } from 'react';
import { CircleHelp } from 'lucide-react';
import { GuideDialog } from './GuideDialog';
import { FEATURE_HELP_EVENT, HELP_TOPICS, type FeatureHelpRequest, type HelpTopicId } from './helpTopics';

export function FeatureHelp({ topic, label }: { topic: HelpTopicId; label?: string }) {
  const item = HELP_TOPICS[topic];
  return <button type="button" data-feature-help onKeyDown={event => event.stopPropagation()} className={label ? 'qada-feature-help qada-feature-help-label' : 'qada-feature-help'} aria-label={`شرح ${item.title}`} title={`شرح ${item.title}`} onClick={event => {
    event.stopPropagation();
    const button = event.currentTarget as HTMLButtonElement;
    const target = button.closest<HTMLElement>('section, .qada-surface-card, [data-guide], [data-guide-page]') || button.parentElement;
    window.dispatchEvent(new CustomEvent<FeatureHelpRequest>(FEATURE_HELP_EVENT, { detail: { topic, target } }));
  }}><CircleHelp size={17} aria-hidden="true" />{label && <span>{label}</span>}</button>;
}

/** Local help never marks the first-visit tour complete or changes the active page. */
export function FeatureHelpHost() {
  const [request, setRequest] = useState<(FeatureHelpRequest & { scroll: number }) | null>(null);
  const [step, setStep] = useState(0);
  useEffect(() => {
    const show = (event: Event) => {
      const detail = (event as CustomEvent<FeatureHelpRequest>).detail;
      if (!detail || !Object.hasOwn(HELP_TOPICS, detail.topic)) return;
      setStep(0); setRequest({ ...detail, scroll: window.scrollY });
    };
    window.addEventListener(FEATURE_HELP_EVENT, show);
    return () => window.removeEventListener(FEATURE_HELP_EVENT, show);
  }, []);
  if (!request) return null;
  const topic = HELP_TOPICS[request.topic];
  const relatedTarget: Partial<Record<HelpTopicId, string>> = {
    istighfarGoal: '[data-help="istighfar"]', istighfarBatch: '[data-help="istighfar"]',
    manual: '[data-help="calculations"]', recalculate: '[data-help="calculations"]',
    backup: '[data-help="data"]', restore: '[data-help="data"]', reset: '[data-help="data"]',
  };
  const steps = topic.steps.map(item => ({ ...item, emotion: 'focused' as const, focus: topic.focus || relatedTarget[request.topic] || `[data-help="${request.topic}"]` }));
  return <GuideDialog step={step} steps={steps} mode="help" targetElement={request.target} onStep={setStep} onFinish={() => {
    const scroll = request.scroll;
    setRequest(null);
    requestAnimationFrame(() => window.scrollTo({ top: scroll, behavior: 'instant' }));
  }} />;
}
