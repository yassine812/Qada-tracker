import React, { useEffect, useRef, useState } from 'react';
import {
  advertisingConfig, loadAdvertisingScript, pauseAdvertising,
  requestAdvertisingSlot, watchAdvertisingEligibility,
} from '../services/advertising';

/** Only mount on the two public editorial guides, separated from app controls. */
export function AdSlot() {
  const [eligible, setEligible] = useState(false);
  const eligibleNow = useRef(false);
  useEffect(() => watchAdvertisingEligibility(value => {
    eligibleNow.current = value;
    setEligible(value);
  }), []);

  if (!eligible) return null;
  return <ConsentedSlot stillEligible={() => eligibleNow.current} />;
}

function ConsentedSlot({ stillEligible }: { stillEligible: () => boolean }) {
  const container = useRef<HTMLModElement>(null);
  const [failed, setFailed] = useState(false);
  const eligibility = useRef(stillEligible);
  eligibility.current = stillEligible;

  useEffect(() => {
    let disposed = false;
    let timeout: number | undefined;
    let observer: MutationObserver | undefined;
    const allowed = () => !disposed && eligibility.current();
    const fail = () => { if (!disposed) { pauseAdvertising(); setFailed(true); } };
    void loadAdvertisingScript(allowed).then(loaded => {
      if (!loaded || !allowed()) { fail(); return; }
      const element = container.current;
      if (!element) return;
      const checkFill = () => {
        const status = element.getAttribute('data-ad-status');
        if (status === 'unfilled' || status === 'unfill-optimized') fail();
        if (['filled', 'unfilled', 'unfill-optimized'].includes(status || '')) window.clearTimeout(timeout);
      };
      observer = new MutationObserver(checkFill);
      observer.observe(element, { attributes: true, attributeFilter: ['data-ad-status'] });
      timeout = window.setTimeout(fail, 15000);
      // React StrictMode must not submit the same physical slot twice.
      if (!element.dataset.qadaRequested) {
        element.dataset.qadaRequested = 'true';
        if (!requestAdvertisingSlot(allowed)) fail();
      }
      checkFill();
    }).catch(fail);
    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      observer?.disconnect();
      pauseAdvertising();
    };
  }, []);

  if (failed) return null;
  return (
    <aside data-testid="public-ad" aria-label="إعلان" className="my-14 border-y py-8"
      style={{ borderColor: 'var(--qada-border-strong)' }}>
      <p className="mb-3 text-center text-xs" style={{ color: 'var(--qada-text-muted)' }}>إعلان</p>
      <ins ref={container} className="adsbygoogle" style={{ display: 'block', minHeight: 100 }}
        data-ad-client={advertisingConfig.client} data-ad-slot={advertisingConfig.guideSlot}
        data-ad-format="auto" data-full-width-responsive="true" />
    </aside>
  );
}
