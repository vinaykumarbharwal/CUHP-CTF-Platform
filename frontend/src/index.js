import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const applyPerformanceMode = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasLimitedCores = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;
  const hasLowMemory = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4;
  const saveDataEnabled = typeof navigator.connection?.saveData === 'boolean' && navigator.connection.saveData;

  if (prefersReducedMotion || hasLimitedCores || hasLowMemory || saveDataEnabled) {
    document.documentElement.setAttribute('data-performance-mode', 'low');
  }
};

applyPerformanceMode();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
