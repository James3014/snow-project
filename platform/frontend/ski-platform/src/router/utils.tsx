/**
 * Router Utilities - 路由工具函數
 * 遵循 Linus 原則：切小、模組化
 */
import { Suspense, lazy, ComponentType, ReactNode } from 'react';
import PageLoader from '@/shared/components/PageLoader';

// Lazy load with retry - 單一職責
export const lazyWithRetry = <T extends ComponentType<Record<string, never>>>(
  importFn: () => Promise<{ default: T }>
) => {
  return lazy(() =>
    importFn().catch(() => {
      window.location.reload();
      return new Promise<never>(() => {});
    })
  );
};

// Suspense wrapper - 關注點分離
export const withSuspense = (Component: ComponentType): ReactNode => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);
