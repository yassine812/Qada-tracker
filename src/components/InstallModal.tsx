import React, { useEffect, useState } from 'react';
import { X, Share, PlusSquare, Download, CheckCircle } from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as installed standalone PWA
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FAF9F5] dark:bg-[#252622] border border-[#E8E4D9] dark:border-[#3D3E37] rounded-3xl p-6 max-w-sm w-full shadow-2xl relative">
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
          <h3 className="font-bold text-lg font-brand-serif text-[#2D2D2A] dark:text-[#EAE7E0]">
            تثبيت تطبيق قضاء على هاتفك
          </h3>
          <p className="text-xs text-[#8E8E80] dark:text-[#A6A699] mt-1">
            يعمل التطبيق بدون اتصال بالإنترنت ومحلياً 100%
          </p>
        </div>

        {isStandalone ? (
          <div className="text-center py-4 bg-[#F0EEE6] dark:bg-[#1C1D1A] rounded-2xl border border-[#E8E4D9] dark:border-[#3D3E37]">
            <CheckCircle className="w-8 h-8 text-[#5A5A40] dark:text-[#C8C7B9] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#2D2D2A] dark:text-[#EAE7E0]">
              التطبيق مثبت بالفعل على جهازك!
            </p>
          </div>
        ) : deferredPrompt ? (
          <div className="space-y-4">
            <p className="text-sm text-[#8E8E80] dark:text-[#A6A699] text-center">
              يمكنك تثبيت التطبيق مباشرة لفتحه كأي تطبيق هاتف بدون شريط المتصفح.
            </p>
            <button
              onClick={handleInstallClick}
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
  );
};
