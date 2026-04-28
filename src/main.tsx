import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';
import './i18n/config';
import { registerServiceWorker } from './utils/serviceWorkerRegistration';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

// Register service worker for PWA support
registerServiceWorker({
  onSuccess: () => {
    console.log('[App] Content cached for offline use');
  },
  onUpdate: () => {
    console.log('[App] New content available, please refresh');
  },
  onOffline: () => {
    console.log('[App] App is offline');
  },
  onOnline: () => {
    console.log('[App] App is back online');
  },
});
