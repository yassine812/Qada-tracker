/** Advertising is optional and deliberately fail-closed. No prayer data is read here. */
export interface AdvertisingConfig {
  enabled: boolean;
  client: string;
  guideSlot: string;
}

type Environment = Record<string, unknown>;
export function readAdvertisingConfig(environment: Environment = {}): AdvertisingConfig {
  const client = typeof environment.VITE_ADSENSE_CLIENT === 'string' ? environment.VITE_ADSENSE_CLIENT : '';
  const guideSlot = typeof environment.VITE_ADSENSE_GUIDE_SLOT === 'string' ? environment.VITE_ADSENSE_GUIDE_SLOT : '';
  const publisherName = typeof environment.VITE_PUBLISHER_NAME === 'string' ? environment.VITE_PUBLISHER_NAME.trim() : '';
  const contactEmail = typeof environment.VITE_CONTACT_EMAIL === 'string' ? environment.VITE_CONTACT_EMAIL : '';
  return {
    enabled: environment.VITE_ADS_ENABLED === 'true'
      && environment.VITE_ADSENSE_APPROVED === 'true' && publisherName.length > 0
      && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)
      && /^ca-pub-\d{16}$/.test(client) && /^\d{6,20}$/.test(guideSlot),
    client,
    guideSlot,
  };
}

export const advertisingConfig = readAdvertisingConfig(
  (import.meta as ImportMeta & { env?: Environment }).env,
);

export function isAdvertisingLocation(location: Pick<Location, 'pathname' | 'search' | 'hash'>): boolean {
  // Static directory hosting may redirect a guide to its single trailing-slash URL.
  // Do not normalize internal/doubled slashes, encoded paths, queries or app aliases.
  const pathname = location.pathname.replace(/\/$/, '');
  return !location.search && !location.hash
    && ['/guides/offline', '/guides/backup'].includes(pathname);
}

export interface ConsentData {
  listenerId?: number;
  cmpId?: number;
  cmpStatus?: string;
  eventStatus?: string;
  gdprApplies?: boolean;
  tcString?: string;
  purpose?: { consents?: Record<string, boolean> };
  vendor?: { consents?: Record<string, boolean> };
}

/** Minimum gate only: the certified CMP and Google still evaluate the full TCF policy. */
export function hasAdvertisingConsent(data: ConsentData | undefined, success: boolean): boolean {
  return success === true && !!data
    && data.cmpStatus === 'loaded'
    && Number.isInteger(data.cmpId) && data.cmpId! > 0
    && ['tcloaded', 'useractioncomplete'].includes(data.eventStatus || '')
    && typeof data.gdprApplies === 'boolean'
    && typeof data.tcString === 'string' && data.tcString.length >= 20
    && /^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/.test(data.tcString)
    && data.purpose?.consents?.['1'] === true
    && data.vendor?.consents?.['755'] === true;
}

type ConsentCallback = (data: ConsentData | undefined, success: boolean) => void;
type ConsentApi = (command: string, version: number, callback: ConsentCallback, listenerId?: number) => void;
type AdQueue = { push: (request: Record<string, unknown>) => unknown; requestNonPersonalizedAds?: number; pauseAdRequests?: number };
export type AdvertisingWindow = Window & {
  __tcfapi?: ConsentApi;
  adsbygoogle?: AdQueue;
  googlefc?: {
    callbackQueue?: { push: (callback: Record<string, () => void>) => unknown };
    showRevocationMessage?: () => void;
  };
};

export function pauseAdvertising(browser: AdvertisingWindow = window as AdvertisingWindow): void {
  if (browser.adsbygoogle) browser.adsbygoogle.pauseAdRequests = 1;
}

/** Watches an independently installed CMP; never manufactures consent or loads a CMP. */
export function watchAdvertisingEligibility(
  onChange: (eligible: boolean) => void,
  config: AdvertisingConfig = advertisingConfig,
  browser: AdvertisingWindow = window as AdvertisingWindow,
): () => void {
  let disposed = false;
  let consented = false;
  let listenerId: number | undefined;
  let api: ConsentApi | undefined;
  let discoverTimer: number | undefined;
  let stopTimer: number | undefined;
  const publish = () => {
    if (disposed) return;
    const eligible = config.enabled && browser.navigator.onLine === true
      && isAdvertisingLocation(browser.location) && consented;
    if (!eligible) pauseAdvertising(browser);
    onChange(eligible);
  };
  const invalidate = () => { consented = false; publish(); };
  publish();
  if (!config.enabled || !isAdvertisingLocation(browser.location)) return () => { disposed = true; };

  const discover = () => {
    if (api || disposed || typeof browser.__tcfapi !== 'function') return;
    api = browser.__tcfapi;
    if (discoverTimer !== undefined) browser.clearInterval(discoverTimer);
    try {
      api('addEventListener', 2, (data, success) => {
        if (typeof data?.listenerId === 'number') listenerId = data.listenerId;
        if (disposed) {
          if (listenerId !== undefined) api?.('removeEventListener', 2, () => {}, listenerId);
          return;
        }
        consented = hasAdvertisingConsent(data, success);
        publish();
      });
    } catch { invalidate(); }
  };
  browser.addEventListener('online', publish);
  browser.addEventListener('offline', publish);
  browser.addEventListener('popstate', publish);
  browser.addEventListener('hashchange', publish);
  browser.addEventListener('qada-ad-preferences-opening', invalidate);
  discover();
  if (!api) {
    discoverTimer = browser.setInterval(discover, 500);
    // A missing CMP must not poll indefinitely or prevent use of the app.
    stopTimer = browser.setTimeout(() => browser.clearInterval(discoverTimer), 15000);
  }
  return () => {
    disposed = true;
    browser.clearInterval(discoverTimer);
    browser.clearTimeout(stopTimer);
    browser.removeEventListener('online', publish);
    browser.removeEventListener('offline', publish);
    browser.removeEventListener('popstate', publish);
    browser.removeEventListener('hashchange', publish);
    browser.removeEventListener('qada-ad-preferences-opening', invalidate);
    if (api && listenerId !== undefined) {
      try { api('removeEventListener', 2, () => {}, listenerId); } catch { /* No requests on cleanup. */ }
    }
    pauseAdvertising(browser);
  };
}

let scriptPromise: Promise<boolean> | undefined;

export function loadAdvertisingScript(stillEligible: () => boolean): Promise<boolean> {
  const browser = window as AdvertisingWindow;
  if (!advertisingConfig.enabled || !stillEligible() || !browser.navigator.onLine
    || !isAdvertisingLocation(browser.location)) return Promise.resolve(false);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise(resolve => {
    const script = document.createElement('script');
    script.id = 'qada-adsense-script';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${advertisingConfig.client}`;
    const queue: AdQueue = browser.adsbygoogle || [];
    browser.adsbygoogle = queue;
    queue.requestNonPersonalizedAds = 1;
    // Keep requests paused until the component rechecks consent after the script loads.
    queue.pauseAdRequests = 1;
    let completed = false;
    const finish = (loaded: boolean) => {
      if (completed) return;
      completed = true;
      window.clearTimeout(timeout);
      script.onload = null;
      script.onerror = null;
      if (!loaded) script.remove();
      resolve(loaded);
    };
    const timeout = window.setTimeout(() => finish(false), 12000);
    script.onload = () => finish(true);
    script.onerror = () => finish(false);
    document.head.appendChild(script);
  });
  // No automatic retry loop, including when ads are blocked or the network fails.
  return scriptPromise;
}

export function requestAdvertisingSlot(stillEligible: () => boolean): boolean {
  const browser = window as AdvertisingWindow;
  if (!advertisingConfig.enabled || !stillEligible() || !browser.navigator.onLine
    || !isAdvertisingLocation(browser.location) || !browser.adsbygoogle) return false;
  try {
    browser.adsbygoogle.requestNonPersonalizedAds = 1;
    browser.adsbygoogle.pauseAdRequests = 0;
    browser.adsbygoogle.push({});
    return true;
  } catch {
    pauseAdvertising(browser);
    return false;
  }
}
