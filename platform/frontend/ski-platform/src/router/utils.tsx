/**
 * Router Utilities - 路由工具函數
 * 遵循 Linus 原則：切小、模組化
 */
import { Suspense, lazy } from 'react';
import PageLoader from '@/shared/components/PageLoader';

// Lazy load with retry - 單一職責
export const lazyWithRetry = (importFn: () => Promise<{ default: React.ComponentType<unknown> }>) => {
  return lazy(() =>
    importFn().catch(() => {
      window.location.reload();
      return new Promise(() => {});
    })
  );
};

// Suspense wrapper - 關注點分離
export const withSuspense = (Component: React.LazyExoticComponent<React.ComponentType<unknown>>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);
