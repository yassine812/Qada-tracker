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
let _deferredPrompt: any = null;

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(() => _deferredPrompt);
  const [isInstalled, setIsInstalled] = useState(false);

  // Detect standalone mode (already installed)
  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true);

  useEffect(() => {
    // Restore any prompt captured before this component mounted
    if (_deferredPrompt && !deferredPrompt) {
      setDeferredPrompt(_deferredPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      _deferredPrompt = e;
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      _deferredPrompt = null;
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
    if (!deferredPrompt || _deferredPrompt !== deferredPrompt) return 'unavailable';

    // A browser prompt is single-use, including dismissal or failure.
    _deferredPrompt = null;
    setDeferredPrompt(null);

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        return 'accepted';
      }
      return 'dismissed';
    } catch {
      return 'unavailable';
    }
  }, [deferredPrompt]);

  const canInstall = !!deferredPrompt && !isStandalone && !isInstalled;

  return (
    <PwaInstallContext.Provider
      value={{ canInstall, isInstalled, isStandalone, promptInstall }}
    >
      {children}
    </PwaInstallContext.Provider>
  );
}

/**
 * Attach the beforeinstallprompt listener at module evaluation time
 * so it's captured even before React mounts.
 */
if (typeof window !== 'undefined') {
  window.addEventListener(
    'beforeinstallprompt',
    (e) => {
      e.preventDefault();
      _deferredPrompt = e;
    },
    { once: false }
  );
}
