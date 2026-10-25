import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { resetUploadStateOnReload } from '@/lib/uploadState';

// Guarantee: Always start stats from zero on site reload
resetUploadStateOnReload();

async function enableMocking() {
  // Enable MSW in dev mode by default unless explicitly disabled
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS !== 'false') {
    const { worker } = await import('./mocks/browser');
    return worker.start({
      onUnhandledRequest: 'bypass',
    });
  }
}

enableMocking().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
