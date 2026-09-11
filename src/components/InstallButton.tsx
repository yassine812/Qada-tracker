import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { usePwaInstall } from '../context/PwaInstallContext';
import { InstallModal } from './InstallModal';

/** Installation remains discoverable even before Chrome offers its native prompt. */
export function InstallButton({ className = '' }: { className?: string }) {
  const { canInstall, isInstalled, isStandalone, promptInstall } = usePwaInstall();
  const [showHelp, setShowHelp] = useState(false);
  const [busy, setBusy] = useState(false);

  const install = async () => {
    if (busy) return;
    if (!canInstall) { setShowHelp(true); return; }
    setBusy(true);
    try {
      if (await promptInstall() === 'unavailable') setShowHelp(true);
    } finally { setBusy(false); }
  };

  if (isInstalled || isStandalone) return null;
  return <>
    <button type="button" onClick={() => { void install(); }} disabled={busy}
      aria-label="تثبيت التطبيق" data-install-entry
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap disabled:opacity-60 ${className}`}>
      <Download className="w-4 h-4" aria-hidden="true" />
      <span>تثبيت التطبيق</span>
    </button>
    <InstallModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
  </>;
}
