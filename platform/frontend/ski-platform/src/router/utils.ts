/**
 * Router Utilities - 路由工具函數
 * 遵循 Linus 原則：切小、模組化
 */
import { lazy } from 'react';

// Lazy load with retry - 單一職責
export const lazyWithRetry = (importFn: () => Promise<{ default: React.ComponentType<unknown> }>) => {
  return lazy(() =>
    importFn().catch(() => {
      // If import fails, reload the page to get fresh chunks
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

// 需要導入的組件
import { Suspense } from 'react';
import PageLoader from '@/shared/components/PageLoader';
