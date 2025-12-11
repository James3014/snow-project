import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: { sitekey: string; callback?: (token: string) => void }
      ) => void;
      reset?: (element?: HTMLElement) => void;
    };
  }
}

interface Props {
  onToken: (token: string | null) => void;
  siteKey?: string;
}

/**
 * Lightweight Turnstile renderer. If siteKey 未配置則不渲染。
 */
export function TurnstileWidget({ onToken, siteKey }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!siteKey) return;

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-turnstile]');
    const render = () => {
      if (containerRef.current && window.turnstile) {
        window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => onToken(token),
        });
      }
    };

    if (existingScript) {
      if (window.turnstile) render();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    script.dataset.turnstile = 'true';
    script.onload = render;
    script.onerror = () => onToken(null);
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      onToken(null);
    };
  }, [onToken, siteKey]);

  if (!siteKey) return null;

  return <div ref={containerRef} className="mt-2" />;
}
