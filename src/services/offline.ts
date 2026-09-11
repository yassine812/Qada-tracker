export type OfflinePhase = 'preparing' | 'ready' | 'unavailable' | 'unsupported' | 'development';
export type OfflineSnapshot = { phase: OfflinePhase; online: boolean };
type WorkerStatus = { ready: boolean; buildId: string };

let snapshot: OfflineSnapshot = {
  phase: import.meta.env.PROD ? 'preparing' : 'development',
  online: typeof navigator === 'undefined' || navigator.onLine,
};
const listeners = new Set<() => void>();
let started = false;
let registration: ServiceWorkerRegistration | undefined;
let registering = false;
let retryTimer: number | undefined;
const MAX_AUTOMATIC_RETRIES = 3;
let retryCount = 0;
let lastRepair = 0;
let generation = 0;
const watched = new WeakSet<ServiceWorker>();

export const getOfflineSnapshot = () => snapshot;
export function subscribeOffline(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function publish(phase: OfflinePhase) {
  const online = navigator.onLine;
  if (snapshot.phase === phase && snapshot.online === online) return;
  snapshot = { phase, online };
  listeners.forEach((listener) => listener());
}

function query(worker: ServiceWorker, type = 'QADA_OFFLINE_STATUS'): Promise<WorkerStatus | null> {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    let complete = false;
    const finish = (value: WorkerStatus | null) => {
      if (complete) return;
      complete = true;
      window.clearTimeout(timeout);
      channel.port1.close();
      channel.port2.close();
      resolve(value);
    };
    const timeout = window.setTimeout(() => finish(null), type === 'QADA_REPAIR_OFFLINE' ? 45000 : 4000);
    channel.port1.onmessage = (event) => {
      const value = event.data;
      finish(typeof value?.ready === 'boolean' && typeof value?.buildId === 'string' ? value : null);
    };
    channel.port1.onmessageerror = () => finish(null);
    try { worker.postMessage({ type }, [channel.port2]); }
    catch { finish(null); }
  });
}

async function refresh(allowRepair = false) {
  const currentGeneration = ++generation;
  const worker = navigator.serviceWorker.controller;
  if (!worker) {
    publish(registration?.installing || registering ? 'preparing' : 'unavailable');
    return;
  }
  const documentBuild = document.querySelector<HTMLMetaElement>('meta[name="qada-build"]')?.content;
  let result = await query(worker);
  if (currentGeneration !== generation || navigator.serviceWorker.controller !== worker) return;

  // Repair only the active document's own build. A waiting update activates on
  // the next session without replacing code beneath the user's unsaved state.
  if (allowRepair && navigator.onLine && result && !result.ready &&
      documentBuild === result.buildId && Date.now() - lastRepair > 60000) {
    lastRepair = Date.now();
    publish('preparing');
    result = await query(worker, 'QADA_REPAIR_OFFLINE');
    if (currentGeneration !== generation || navigator.serviceWorker.controller !== worker) return;
  }
  publish(result?.ready && documentBuild === result.buildId ? 'ready' : 'unavailable');
}

function scheduleRetry() {
  if (retryTimer || !navigator.onLine || retryCount >= MAX_AUTOMATIC_RETRIES) return;
  const delay = Math.min(30000 * 2 ** retryCount, 300000);
  retryCount++;
  retryTimer = window.setTimeout(() => {
    retryTimer = undefined;
    void register(true);
  }, delay);
}

function resetRetries() {
  if (retryTimer) window.clearTimeout(retryTimer);
  retryTimer = undefined;
  retryCount = 0;
}

function watch(worker: ServiceWorker | null) {
  if (!worker || watched.has(worker)) return;
  watched.add(worker);
  worker.addEventListener('statechange', () => {
    if (worker.state === 'redundant') scheduleRetry();
    // register() resolving only means an install started, not that any required
    // assets downloaded successfully. Reset backoff only after actual success.
    if (worker.state === 'installed' || worker.state === 'activated') resetRetries();
    void refresh();
  });
}

async function register(scheduledRetry = false) {
  if (registering || (!scheduledRetry && (retryTimer || retryCount >= MAX_AUTOMATIC_RETRIES))) return;
  registering = true;
  if (snapshot.phase !== 'ready') publish('preparing');
  try {
    const next = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
    if (registration !== next) {
      registration = next;
      next.addEventListener('updatefound', () => {
        watch(next.installing);
        if (!navigator.serviceWorker.controller) publish('preparing');
        const installing = next.installing;
        if (installing) {
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              installing.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        }
      });
    }
    if (next.waiting && navigator.serviceWorker.controller) {
      next.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    watch(next.installing);
    watch(next.waiting);
    watch(next.active);
  } catch {
    scheduleRetry();
  } finally {
    registering = false;
    await refresh(true);
  }
}

export function startOfflineSupport() {
  if (started || !import.meta.env.PROD) return;
  started = true;
  if (!window.isSecureContext || !('serviceWorker' in navigator) || typeof MessageChannel === 'undefined') {
    publish('unsupported');
    return;
  }
  const hadController = Boolean(navigator.serviceWorker.controller);
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    void refresh(true);
    if (hadController && !refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
  window.addEventListener('offline', () => { publish(snapshot.phase); void refresh(); });
  window.addEventListener('online', () => {
    resetRetries();
    publish(snapshot.phase);
    void register();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void refresh(true);
      if (navigator.onLine && !registration?.active && !registration?.installing) void register();
    }
  });
  // Recheck actual cache keys after storage eviction or a long-running repair.
  // This does not download assets or request storage/notification permissions.
  window.setInterval(() => {
    if (document.visibilityState === 'visible') void refresh(navigator.onLine);
  }, 30000);
  void register();
}
