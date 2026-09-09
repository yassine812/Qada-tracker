import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

function warmOfflineCache() {
  if (!('serviceWorker' in navigator)) return;

  window.setTimeout(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const urls = Array.from(performance.getEntriesByType('resource'))
        .map((entry) => entry.name)
        .filter((url) => new URL(url).origin === window.location.origin);

      registration.active?.postMessage({
        type: 'WARM_OFFLINE_CACHE',
        urls: ['/', '/app', '/index.html', '/manifest.webmanifest', ...urls],
      });
    } catch {
      // Offline support is progressive; the app remains usable without this warm-up.
    }
  }, 1500);
}

warmOfflineCache();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
