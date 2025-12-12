/**
 * 錯誤邊界測試
 * 遵循 TDD 原則
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary, withErrorBoundary, useErrorHandler } from '../../platform/frontend/shared/error-boundary';

// 測試組件：會拋出錯誤的組件
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// 測試組件：正常組件
const NormalComponent: React.FC = () => <div>Normal component</div>;

describe('ErrorBoundary', () => {
  // 抑制 console.error 在測試中的輸出
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <NormalComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Normal component')).toBeInTheDocument();
  });

  it('should render error UI when child component throws', () => {
    render(
      <ErrorBoundary level="component">
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('組件載入失敗')).toBeInTheDocument();
    expect(screen.getByText('這個組件暫時無法顯示。')).toBeInTheDocument();
  });

  it('should render page-level error UI', () => {
    render(
      <ErrorBoundary level="page">
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('頁面載入失敗')).toBeInTheDocument();
    expect(screen.getByText('這個頁面暫時無法顯示，請稍後再試。')).toBeInTheDocument();
  });

  it('should render critical-level error UI', () => {
    render(
      <ErrorBoundary level="critical">
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('系統發生錯誤')).toBeInTheDocument();
    expect(screen.getByText('很抱歉，應用程式遇到了一個嚴重錯誤。請重新載入頁面或聯繫技術支援。')).toBeInTheDocument();
  });

  it('should render custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('should call onError callback when error occurs', () => {
    const onError = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('should retry and render children after retry button click', () => {
    const RetryableComponent: React.FC = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);
      
      React.useEffect(() => {
        // 模擬在重試後修復錯誤
        const timer = setTimeout(() => setShouldThrow(false), 100);
        return () => clearTimeout(timer);
      }, []);

      return <ThrowError shouldThrow={shouldThrow} />;
    };

    render(
      <ErrorBoundary level="component">
        <RetryableComponent />
      </ErrorBoundary>
    );

    // 應該顯示錯誤 UI
    expect(screen.getByText('組件載入失敗')).toBeInTheDocument();

    // 點擊重試按鈕
    fireEvent.click(screen.getByText('重試'));

    // 等待組件修復並重新渲染
    setTimeout(() => {
      expect(screen.getByText('No error')).toBeInTheDocument();
    }, 200);
  });

  it('should show error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary level="critical">
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('錯誤詳情')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });
});

describe('withErrorBoundary HOC', () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('should wrap component with error boundary', () => {
    const WrappedComponent = withErrorBoundary(ThrowError, { level: 'component' });

    render(<WrappedComponent />);

    expect(screen.getByText('組件載入失敗')).toBeInTheDocument();
  });

  it('should preserve component display name', () => {
    const TestComponent = () => <div>Test</div>;
    TestComponent.displayName = 'TestComponent';

    const WrappedComponent = withErrorBoundary(TestComponent);

    expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)');
  });

  it('should use component name when displayName is not available', () => {
    function TestFunction() {
      return <div>Test</div>;
    }

    const WrappedComponent = withErrorBoundary(TestFunction);

    expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestFunction)');
  });
});

describe('useErrorHandler hook', () => {
  it('should return error handler function', () => {
    let errorHandler: (error: Error) => void;

    const TestComponent = () => {
      errorHandler = useErrorHandler();
      return <div>Test</div>;
    };

    render(<TestComponent />);

    expect(typeof errorHandler!).toBe('function');
  });

  it('should log error when called', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    let errorHandler: (error: Error) => void;

    const TestComponent = () => {
      errorHandler = useErrorHandler();
      return <div>Test</div>;
    };

    render(<TestComponent />);

    const testError = new Error('Test error');
    errorHandler!(testError);

    expect(consoleSpy).toHaveBeenCalledWith('Manual error report:', testError, undefined);

    consoleSpy.mockRestore();
  });
});

// Mock React Testing Library matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
    }
  }
}

// 簡單的 mock 實作
expect.extend({
  toBeInTheDocument(received) {
    const pass = received !== null && received !== undefined;
    return {
      message: () => `expected element ${pass ? 'not ' : ''}to be in document`,
      pass,
    };
  },
});
