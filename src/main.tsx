import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { logger } from './utils/logger';
import { config } from './config/environment';

// Initialize application
logger.info('Application starting', {
  version: config.app.version,
  environment: config.app.environment,
  buildTime: '__BUILD_TIME__',
  commitHash: '__COMMIT_HASH__'
});

// Performance monitoring
if (config.features.enableAnalytics && 'performance' in window) {
  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    logger.info('Performance metrics', {
      loadTime: perfData.loadEventEnd - perfData.loadEventStart,
      domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
      firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
      firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime
    });
  });
}

// Error boundary for unhandled errors
window.addEventListener('error', (event) => {
  logger.error('Unhandled error', event.error, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', event.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Development tools
if (config.features.enableDevtools && config.app.environment === 'development') {
  // Expose useful debugging tools
  (window as any).__BANQUE_ATLANTIQUE_DEBUG__ = {
    logger,
    config,
    clearCache: () => {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
      console.log('All caches cleared');
    },
    exportLogs: () => logger.exportLogs()
  };
  
  console.log('🔧 Debug tools available at window.__BANQUE_ATLANTIQUE_DEBUG__');
}
