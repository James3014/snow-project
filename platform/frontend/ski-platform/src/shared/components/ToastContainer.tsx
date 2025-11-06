/**
 * Toast Container Component
 * Toast 通知容器组件
 */
import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { removeToast } from '@/store/slices/courseTrackingSlice';

export default function ToastContainer() {
  const toasts = useAppSelector((state) => state.courseTracking.toasts);
  const dispatch = useAppDispatch();

  useEffect(() => {
    toasts.forEach((toast) => {
      const duration = toast.duration || 3000;
      const timer = setTimeout(() => {
        dispatch(removeToast(toast.id));
      }, duration);

      return () => clearTimeout(timer);
    });
  }, [toasts, dispatch]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 w-80">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={() => dispatch(removeToast(toast.id))} />
      ))}
    </div>
  );
}

function Toast({ toast, onClose }: { toast: any; onClose: () => void }) {
  const bgColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div
      className={`${bgColors[toast.type]} text-white px-6 py-4 rounded-lg shadow-lg flex items-center justify-between animate-slide-in`}
    >
      <div className="flex items-center space-x-3">
        <span className="text-xl">{icons[toast.type]}</span>
        <span className="font-medium">{toast.message}</span>
      </div>
      <button
        onClick={onClose}
        className="ml-4 text-white hover:text-gray-200 focus:outline-none"
      >
        ✕
      </button>
    </div>
  );
}
