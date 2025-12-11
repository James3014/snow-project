/**
 * Router Utilities - 路由工具函數
 */
import React, { Suspense } from 'react';
import PageLoader from '@/shared/components/PageLoader';

/**
 * Lazy load with retry on failure
 */
export function lazyWithRetry(
  factory: () => Promise<{ default: React.ComponentType }>
): React.LazyExoticComponent<React.ComponentType> {
  return React.lazy(() =>
    factory().catch(() => {
      window.location.reload();
      return new Promise(() => {});
    })
  );
}

/**
 * Wrap component with Suspense
 */
export function withSuspense(
  Component: React.LazyExoticComponent<React.ComponentType>
): React.ReactElement {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}
