import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {Capacitor} from '@capacitor/core';
import App from './App.tsx';
import {startOfflineSupport} from './services/offline';
import './index.css';

// Start immediately: decorative media must not delay the first offline download.
// Vite's development modules intentionally never register a production worker.
if (Capacitor.getPlatform() === 'android') {
  if (window.location.pathname === '/') window.history.replaceState(null, '', '/app');
  void import('./services/androidReminders').then(({ startAndroidReminders }) => startAndroidReminders()).catch(console.error);
} else if (import.meta.env.PROD) {
  startOfflineSupport();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
