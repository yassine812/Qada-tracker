import { useSyncExternalStore } from 'react';
import { getOfflineSnapshot, subscribeOffline } from '../services/offline';

export function OfflineStatus() {
  const { phase, online } = useSyncExternalStore(subscribeOffline, getOfflineSnapshot, getOfflineSnapshot);
  if (phase === 'development') return null;
  const text = phase === 'ready'
    ? online ? 'جاهز بدون إنترنت' : 'تعمل الآن بدون إنترنت'
    : phase === 'preparing' && online
      ? 'جارٍ تجهيز الاستخدام بدون إنترنت…'
      : phase === 'unsupported'
        ? 'هذا المتصفح يحتاج إلى اتصال بالإنترنت'
        : online
          ? 'الاستخدام دون اتصال غير جاهز بعد'
          : 'بعض الملفات غير متاحة — أعد الاتصال لاحقاً';

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-testid="offline-status"
      data-offline-phase={phase}
      dir="rtl"
      className="fixed left-3 z-40 pointer-events-none max-w-[calc(100vw-1.5rem)] rounded-full border px-3 py-1.5 text-[10px] sm:text-xs shadow-sm"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5.5rem)',
        color: 'var(--qada-text)',
        backgroundColor: 'var(--qada-surface-1)',
        borderColor: 'var(--qada-border)',
      }}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-1.5 w-1.5 rounded-full ml-1.5 ${phase === 'preparing' ? 'animate-pulse motion-reduce:animate-none' : ''}`}
        style={{ backgroundColor: phase === 'ready' ? 'var(--qada-success)' : 'var(--qada-warning)' }}
      />
      {text}
    </div>
  );
}
