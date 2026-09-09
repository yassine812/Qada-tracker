import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {startOfflineSupport} from './services/offline';
import './index.css';

// Start immediately: decorative media must not delay the first offline download.
// Vite's development modules intentionally never register a production worker.
if (import.meta.env.PROD) startOfflineSupport();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
