/**
 * PwaInstallContext — Global PWA install lifecycle manager
 *
 * Captures `beforeinstallprompt` at app root startup (not inside a modal
 * that may not be open when the browser fires the event).
 *
 * Exposes:
 *   canInstall    — true when browser has queued an install prompt
 *   isInstalled   — true when app was installed via this session
 *   isStandalone  — true when running as installed PWA
 *   promptInstall — triggers the native install prompt from a user gesture
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

interface PwaInstallContextType {
  canInstall: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
}

const PwaInstallContext = createContext<PwaInstallContextType>({
  canInstall: false,
  isInstalled: false,
  isStandalone: false,
  promptInstall: async () => 'unavailable',
});

export function usePwaInstall() {
  return useContext(PwaInstallContext);
}

// Store the deferred prompt globally so it's captured before any component mounts
interface InstallPromptEvent extends Event {
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed' } | void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    __qadaInstallPrompt?: InstallPromptEvent | null;
    __qadaInstalled?: boolean;
  }
}

const currentPrompt = () => typeof window !== 'undefined' ? window.__qadaInstallPrompt ?? null : null;

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPromptEvent | null>(currentPrompt);
  const [isInstalled, setIsInstalled] = useState(() => typeof window !== 'undefined' && !!window.__qadaInstalled);

  // Detect standalone mode (already installed)
  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true);

  useEffect(() => {
    // Restore any prompt captured before this component mounted
    setDeferredPrompt(currentPrompt());
    setIsInstalled(!!window.__qadaInstalled);

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      window.__qadaInstallPrompt = e as InstallPromptEvent;
      setDeferredPrompt(e as InstallPromptEvent);
    };

    const handleAppInstalled = () => {
      window.__qadaInstallPrompt = null;
      window.__qadaInstalled = true;
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    // Read the actual invitation at click time, not a possibly stale React render.
    const invitation = currentPrompt();
    if (!invitation || isStandalone || window.__qadaInstalled) return 'unavailable';

    // A browser prompt is single-use, including dismissal or failure.
    window.__qadaInstallPrompt = null;
    setDeferredPrompt(null);

    try {
      // No asynchronous preparation before prompt(): preserve the user's gesture.
      const result = await invitation.prompt();
      const { outcome } = result || await invitation.userChoice;
      if (outcome === 'accepted') {
        return 'accepted';
      }
      return 'dismissed';
    } catch {
      return 'unavailable';
    }
  }, [isStandalone]);

  const canInstall = !!deferredPrompt && !isStandalone && !isInstalled;

  return (
    <PwaInstallContext.Provider
      value={{ canInstall, isInstalled, isStandalone, promptInstall }}
    >
      {children}
    </PwaInstallContext.Provider>
  );
}
