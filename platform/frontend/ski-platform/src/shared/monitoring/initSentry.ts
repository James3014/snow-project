/**
 * Minimal Sentry bootstrapping via CDN script (avoids bundler deps).
 * Only runs when VITE_SENTRY_DSN is provided.
 */
declare global {
  interface Window {
    Sentry?: {
      init: (opts: { dsn: string; tracesSampleRate?: number }) => void;
    };
  }
}

export async function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  const tracesSampleRate = parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0.05');

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://browser.sentry-cdn.com/7.114.0/bundle.tracing.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Sentry CDN load failed'));
    document.head.appendChild(script);
  }).catch(() => {
    // If CDN load fails, skip silently to avoid blocking app
  });

  if (window.Sentry && typeof window.Sentry.init === 'function') {
    window.Sentry.init({
      dsn,
      tracesSampleRate,
    });
  } else {
    console.warn('[monitoring] Sentry not initialized (CDN unavailable)');
  }
}
