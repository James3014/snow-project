/**
 * Root Layout
 * 根布局组件
 */
import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import Navbar from '@/shared/components/Navbar';
import ToastContainer from '@/shared/components/ToastContainer';

export default function RootLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <Navbar />

      {/* 主內容區域 */}
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">載入中...</div>
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>

      {/* Toast 通知容器 */}
      <ToastContainer />
    </div>
  );
}
