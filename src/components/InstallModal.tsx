import React, { useEffect, useId, useRef, useState } from 'react';
import { X, Share, PlusSquare, Download, CheckCircle } from 'lucide-react';
import { usePwaInstall } from '../context/PwaInstallContext';
import { ModalPortal } from './ui/ModalPortal';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose }) => {
  const { canInstall, isInstalled, isStandalone, promptInstall } = usePwaInstall();
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close.current(); }
      if (event.key !== 'Tab') return;
      const buttons = panel.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
      if (!buttons?.length) return;
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); previous?.focus(); };
  }, [isOpen]);

  // Detect iOS for manual instructions
  const isIOS =
    typeof window !== 'undefined' &&
    /iphone|ipad|ipod/i.test(window.navigator.userAgent);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (busy) return;
    setBusy(true);
    try { if (await promptInstall() === 'accepted') onClose(); }
    finally { setBusy(false); }
  };

  const alreadyInstalled = isStandalone || isInstalled;

  return (
    <ModalPortal active={isOpen}>
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
    <div className="fixed qada-modal-viewport flex items-center justify-center" dir="rtl">
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
        className="qada-modal-panel bg-[#FAF9F5] dark:bg-[#252622] border border-[#E8E4D9] dark:border-[#3D3E37] rounded-3xl p-6 max-w-sm w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-full text-[#8E8E80] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5 mt-1">
          <div className="w-14 h-14 rounded-2xl bg-[#F0EEE6] dark:bg-[#1C1D1A] text-[#5A5A40] dark:text-[#C8C7B9] flex items-center justify-center mx-auto mb-3">
            <Download className="w-7 h-7" />
          </div>
          <h3 id={titleId} className="font-bold text-lg font-brand-serif text-[#2D2D2A] dark:text-[#EAE7E0]">
            تثبيت تطبيق قضاء على هاتفك
          </h3>
          <p className="text-xs text-[#8E8E80] dark:text-[#A6A699] mt-1">
            افتح التطبيق أولاً وانتظر ظهور «جاهز بدون إنترنت». يبقى متاحاً دون اتصال ما دامت ملفاته محفوظة على جهازك.
          </p>
        </div>

        {alreadyInstalled ? (
          <div className="text-center py-4 bg-[#F0EEE6] dark:bg-[#1C1D1A] rounded-2xl border border-[#E8E4D9] dark:border-[#3D3E37]">
            <CheckCircle className="w-8 h-8 text-[#5A5A40] dark:text-[#C8C7B9] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#2D2D2A] dark:text-[#EAE7E0]">
              التطبيق مثبت بالفعل على جهازك!
            </p>
          </div>
        ) : canInstall ? (
          <div className="space-y-4">
            <p className="text-sm text-[#8E8E80] dark:text-[#A6A699] text-center">
              يمكنك تثبيت التطبيق مباشرة لفتحه كأي تطبيق هاتف بدون شريط المتصفح.
            </p>
            <button
              onClick={handleInstallClick}
              disabled={busy}
              className="w-full py-3.5 bg-[#5A5A40] hover:bg-[#484833] dark:bg-[#C8C7B9] dark:hover:bg-[#B8B7A8] text-white dark:text-[#1C1D1A] font-semibold rounded-2xl transition-all shadow-md active:scale-98"
            >
              تثبيت الآن على الهاتف
            </button>
          </div>
        ) : isIOS ? (
          <div className="space-y-3 text-sm text-[#2D2D2A] dark:text-[#EAE7E0]">
            <p className="font-medium text-center mb-3">
              خطوات التثبيت على آيفون (Safari):
            </p>
            <div className="flex items-center gap-3 bg-[#F0EEE6] dark:bg-[#1C1D1A] p-3 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-[#FAF9F5] dark:bg-[#252622] text-[#5A5A40] dark:text-[#C8C7B9] flex items-center justify-center shrink-0 border border-[#E8E4D9] dark:border-[#3D3E37]">
                <Share className="w-4 h-4" />
              </div>
              <span>1. اضغط على زر <strong>المشاركة (Share)</strong> في أسفل متصفح Safari.</span>
            </div>
            <div className="flex items-center gap-3 bg-[#F0EEE6] dark:bg-[#1C1D1A] p-3 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-[#FAF9F5] dark:bg-[#252622] text-[#5A5A40] dark:text-[#C8C7B9] flex items-center justify-center shrink-0 border border-[#E8E4D9] dark:border-[#3D3E37]">
                <PlusSquare className="w-4 h-4" />
              </div>
              <span>2. اختر <strong>"إضافة إلى الصفحة الرئيسية"</strong> (Add to Home Screen).</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-sm text-[#2D2D2A] dark:text-[#EAE7E0]">
            <p className="font-medium text-center">
              لتثبيت التطبيق من قائمة المتصفح:
            </p>
            <div className="bg-[#F0EEE6] dark:bg-[#1C1D1A] p-3 rounded-xl">
              <span>اضغط على خيارات المتصفح (⋮) ثم اختر <strong>"تثبيت التطبيق"</strong> أو <strong>"الإضافة إلى الشاشة الرئيسية"</strong>.</span>
            </div>
            <p>قد يظهر الخيار باسم <bdi>Installer l’application</bdi> أو <bdi>Install app</bdi> أو <bdi>Ajouter à l’écran d’accueil</bdi>.</p>
            <p>إذا فتحت الرابط داخل تطبيق آخر، افتحه في Chrome على أندرويد. إذا لم يظهر خيار التثبيت، يمكنك استخدام قضاء من الموقع؛ المتصفح هو من يحدد إتاحة التثبيت.</p>
          </div>
        )}

        <div className="mt-5 pt-3 border-t border-[#E8E4D9] dark:border-[#3D3E37]">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-[#8E8E80] dark:text-[#A6A699] font-medium text-xs hover:text-[#2D2D2A] dark:hover:text-white transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};
