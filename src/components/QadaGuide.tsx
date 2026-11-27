import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { GuideDialog, GUIDE_STEPS } from './guide/GuideDialog';
import { REPLAY_GUIDE } from '../services/companionFeedback';

export function QadaGuide() {
  const { settings, loading, updateSettings, setActiveTab, setIbadatSubTab } = useApp();
  const { session } = useAuth();
  const accountId = session?.user.id;
  const storageKey = `qada:app-guide:v1:${accountId || 'local'}`;
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  // Settings are restored asynchronously. Do not decide whether to show the
  // tour until that restore is complete, otherwise every fresh render can
  // briefly treat an existing user as a first-time visitor.
  useEffect(() => {
    if (loading || !settings || !accountId) return;
    let completedLocally = false;
    try { completedLocally = localStorage.getItem(storageKey) === 'done'; } catch { /* The account setting still applies. */ }
    setOpen(!settings.hasSeenAppGuide && !completedLocally);
  }, [accountId, loading, settings, storageKey]);

  useEffect(() => {
    const replay = () => { setStep(0); setOpen(true); };
    window.addEventListener(REPLAY_GUIDE, replay);
    return () => window.removeEventListener(REPLAY_GUIDE, replay);
  }, []);

  useEffect(() => {
    if (!open) return;
    const current = GUIDE_STEPS[step];
    if (current.subTab) setIbadatSubTab(current.subTab);
    setActiveTab(current.tab);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [open, step, setActiveTab, setIbadatSubTab]);

  const finish = () => {
    setOpen(false);
    setActiveTab('dashboard');
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    try { localStorage.setItem(storageKey, 'done'); } catch { /* Account settings remain the primary record. */ }
    if (!settings?.hasSeenAppGuide) void updateSettings({ hasSeenAppGuide: true }).catch(() => undefined);
  };

  return open ? <GuideDialog step={step} onStep={setStep} onFinish={finish} /> : null;
}
