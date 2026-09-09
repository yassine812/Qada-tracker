import React, { useEffect, useState } from 'react';
import { advertisingConfig, AdvertisingWindow } from '../services/advertising';

/** A convenience entry point, not a substitute for a certified CMP or its persistent link. */
export function AdvertisingPreferences() {
  const [googleUiReady, setGoogleUiReady] = useState(false);
  useEffect(() => {
    if (!advertisingConfig.enabled) return;
    let disposed = false;
    const browser = window as AdvertisingWindow;
    const register = () => {
      const queue = browser.googlefc?.callbackQueue;
      if (!queue) return false;
      queue.push({ CONSENT_API_READY: () => {
        if (!disposed) setGoogleUiReady(typeof browser.googlefc?.showRevocationMessage === 'function');
      } });
      return true;
    };
    if (register()) return () => { disposed = true; };
    const timer = window.setInterval(() => { if (register()) window.clearInterval(timer); }, 500);
    const timeout = window.setTimeout(() => window.clearInterval(timer), 15000);
    return () => { disposed = true; window.clearInterval(timer); window.clearTimeout(timeout); };
  }, []);

  if (!advertisingConfig.enabled) {
    return <p data-testid="advertising-disabled">الإعلانات غير مفعّلة حاليًا، ولا يحمّل قضاء كود إعلانات Google.</p>;
  }

  return (
    <div className="space-y-3">
      <p>رفض الإعلانات لا يمنع استخدام قضاء. يمكنك تغيير قرارك عبر زر الخصوصية الذي توفره منصة الموافقة.</p>
      {googleUiReady && <button type="button" className="underline underline-offset-4"
        onClick={() => {
          const browser = window as AdvertisingWindow;
          browser.dispatchEvent(new Event('qada-ad-preferences-opening'));
          browser.googlefc?.callbackQueue?.push({ CONSENT_API_READY: () => browser.googlefc?.showRevocationMessage?.() });
        }}>تغيير موافقة الإعلانات</button>}
      <p className="text-sm">إذا لم تظهر منصة الموافقة أو تعذّر الاتصال بها، لا نطلب إعلانات جديدة. بعد تغيير اختيارك، أعد تحميل الصفحة لتطبيقه على الأكواد التي سبق تحميلها.</p>
    </div>
  );
}
