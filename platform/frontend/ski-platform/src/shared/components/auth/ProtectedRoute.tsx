/**
 * Protected Route Component
 * 受保護的路由組件 - 需要登入才能訪問
 */
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadUserThunk } from '@/store/slices/authSlice';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { isAuthenticated, token, isLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // If we have a token but not authenticated, try to load user
    if (token && !isAuthenticated) {
      dispatch(loadUserThunk());
    }
  }, [dispatch, token, isAuthenticated]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🎿</div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated && !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render children
  return <>{children}</>;
}
