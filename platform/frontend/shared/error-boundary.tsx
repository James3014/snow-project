/**
 * 統一錯誤邊界組件
 * 標準化錯誤處理和用戶體驗
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'component' | 'critical';
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // 調用自定義錯誤處理
    this.props.onError?.(error, errorInfo);

    // 記錄錯誤到監控系統
    this.logError(error, errorInfo);
  }

  private logError(error: Error, errorInfo: ErrorInfo) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      level: this.props.level || 'component',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // 發送到錯誤監控服務
    console.error('ErrorBoundary caught an error:', errorData);
    
    // 在生產環境中，這裡會發送到 Sentry 或其他監控服務
    if (process.env.NODE_ENV === 'production') {
      // window.Sentry?.captureException(error, { extra: errorData });
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // 如果有自定義 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 根據錯誤級別顯示不同的錯誤頁面
      return this.renderErrorUI();
    }

    return this.props.children;
  }

  private renderErrorUI() {
    const { level = 'component' } = this.props;
    const { error } = this.state;

    switch (level) {
      case 'critical':
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">系統發生錯誤</h3>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  很抱歉，應用程式遇到了一個嚴重錯誤。請重新載入頁面或聯繫技術支援。
                </p>
                {process.env.NODE_ENV === 'development' && error && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 cursor-pointer">錯誤詳情</summary>
                    <pre className="text-xs text-red-600 mt-1 overflow-auto">
                      {error.message}
                    </pre>
                  </details>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={this.handleReload}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  重新載入
                </button>
                <button
                  onClick={this.handleRetry}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
                >
                  重試
                </button>
              </div>
            </div>
          </div>
        );

      case 'page':
        return (
          <div className="min-h-96 flex items-center justify-center">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">頁面載入失敗</h3>
              <p className="mt-1 text-sm text-gray-500">
                這個頁面暫時無法顯示，請稍後再試。
              </p>
              <div className="mt-6">
                <button
                  onClick={this.handleRetry}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  重試
                </button>
              </div>
            </div>
          </div>
        );

      case 'component':
      default:
        return (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">
                  組件載入失敗
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>這個組件暫時無法顯示。</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={this.handleRetry}
                    className="bg-red-100 px-2 py-1 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                  >
                    重試
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
    }
  }
}

// 高階組件包裝器
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// 錯誤報告 Hook
export function useErrorHandler() {
  const handleError = React.useCallback((error: Error, errorInfo?: any) => {
    console.error('Manual error report:', error, errorInfo);
    
    // 在生產環境中發送到監控服務
    if (process.env.NODE_ENV === 'production') {
      // window.Sentry?.captureException(error, { extra: errorInfo });
    }
  }, []);

  return handleError;
}

// 異步錯誤處理 Hook
export function useAsyncError() {
  const [, setError] = React.useState();
  
  return React.useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);
}
