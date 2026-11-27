import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import LicenseGate from './LicenseGate.jsx';
import './index.css';
import { applyTheme, loadTheme } from './theme.js';

// Terapkan tema tersimpan sebelum render agar tidak berkedip
applyTheme(loadTheme());

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LicenseGate>
      <App />
    </LicenseGate>
  </React.StrictMode>
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('SW gagal:', err));
  });
}
