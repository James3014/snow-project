/**
 * Router Configuration
 * 路由配置
 */
import { createBrowserRouter } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import RootLayout from '@/shell/RootLayout';
import AdminRoute from '@/shared/components/auth/AdminRoute';

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-ice-primary"></div>
      <p className="mt-4 text-crystal-blue">載入中...</p>
    </div>
  </div>
);

// Error component
const PageError = () => (
  <div className="min-h-screen flex items-center justify-center px-4">
    <div className="text-center max-w-md">
      <div className="text-6xl mb-4">❄️</div>
      <h2 className="text-2xl font-bold text-frost-white mb-2">載入失敗</h2>
      <p className="text-crystal-blue mb-6">頁面載入時發生錯誤，請重新整理頁面</p>
      <button
        onClick={() => window.location.reload()}
        className="btn-neon px-6 py-3"
      >
        重新載入
      </button>
    </div>
  </div>
);

// Lazy load with retry
const lazyWithRetry = (importFn: () => Promise<any>) => {
  return lazy(() =>
    importFn().catch(() => {
      // If import fails, reload the page to get fresh chunks
      window.location.reload();
      return new Promise(() => {});
    })
  );
};

// Lazy load pages for code splitting
const ResortList = lazyWithRetry(() => import('@/features/course-tracking/pages/ResortList'));
const ResortDetail = lazyWithRetry(() => import('@/features/course-tracking/pages/ResortDetail'));
const CourseHistory = lazyWithRetry(() => import('@/features/course-tracking/pages/CourseHistory'));
const Recommendations = lazyWithRetry(() => import('@/features/course-tracking/pages/Recommendations'));
const Rankings = lazyWithRetry(() => import('@/features/course-tracking/pages/Rankings'));
const Achievements = lazyWithRetry(() => import('@/features/course-tracking/pages/Achievements'));
const Leaderboard = lazyWithRetry(() => import('@/features/course-tracking/pages/Leaderboard'));
const ShareCard = lazyWithRetry(() => import('@/features/course-tracking/pages/ShareCard'));
const FeedPage = lazyWithRetry(() => import('@/features/activity-feed/pages/FeedPage'));
const SkiMapPage = lazyWithRetry(() => import('@/features/ski-map/pages/SkiMapPage'));
const LoginPage = lazyWithRetry(() => import('@/features/auth/pages/LoginPage'));
const RegisterPage = lazyWithRetry(() => import('@/features/auth/pages/RegisterPage'));
const AdminDashboard = lazyWithRetry(() => import('@/features/admin/pages/AdminDashboard'));
const UserListPage = lazyWithRetry(() => import('@/features/admin/pages/UserListPage'));
const UserDetailPage = lazyWithRetry(() => import('@/features/admin/pages/UserDetailPage'));
const SeasonManagement = lazyWithRetry(() => import('@/features/trip-planning/pages/SeasonManagement'));
const SeasonDetail = lazyWithRetry(() => import('@/features/trip-planning/pages/SeasonDetail'));
const TripDetail = lazyWithRetry(() => import('@/features/trip-planning/pages/TripDetail'));
const TripExplore = lazyWithRetry(() => import('@/features/trip-planning/pages/TripExplore'));
const TripRecommendations = lazyWithRetry(() => import('@/features/trip-planning/pages/TripRecommendations'));
const MyGear = lazyWithRetry(() => import('@/features/gear/pages/MyGear'));
const SnowbuddyBoard = lazyWithRetry(() => import('@/features/snowbuddy/pages/SnowbuddyBoard'));
const SmartMatchingPage = lazyWithRetry(() => import('@/features/snowbuddy/pages/SmartMatchingPage'));
const MatchRequestsPage = lazyWithRetry(() => import('@/features/snowbuddy/pages/MatchRequestsPage'));

// Wrapper for lazy components
const withSuspense = (Component: React.LazyExoticComponent<React.ComponentType<any>>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/login',
    element: withSuspense(LoginPage),
    errorElement: <PageError />,
  },
  {
    path: '/register',
    element: withSuspense(RegisterPage),
    errorElement: <PageError />,
  },
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <PageError />,
    children: [
      {
        index: true,
        element: withSuspense(ResortList),
        errorElement: <PageError />,
      },
      {
        path: 'resorts',
        element: withSuspense(ResortList),
        errorElement: <PageError />,
      },
      {
        path: 'resorts/:resortId',
        element: withSuspense(ResortDetail),
        errorElement: <PageError />,
      },
      {
        path: 'history',
        element: withSuspense(CourseHistory),
        errorElement: <PageError />,
      },
      {
        path: 'resorts/:resortId/recommendations',
        element: withSuspense(Recommendations),
      },
      {
        path: 'resorts/:resortId/rankings',
        element: withSuspense(Rankings),
      },
      {
        path: 'achievements',
        element: withSuspense(Achievements),
      },
      {
        path: 'leaderboard',
        element: withSuspense(Leaderboard),
      },
      {
        path: 'share/achievement/:achievementId',
        element: withSuspense(ShareCard),
      },
      {
        path: 'feed',
        element: withSuspense(FeedPage),
      },
      {
        path: 'ski-map',
        element: withSuspense(SkiMapPage),
      },
      {
        path: 'admin',
        element: <AdminRoute>{withSuspense(AdminDashboard)}</AdminRoute>,
      },
      {
        path: 'admin/users',
        element: <AdminRoute>{withSuspense(UserListPage)}</AdminRoute>,
      },
      {
        path: 'admin/users/:userId',
        element: <AdminRoute>{withSuspense(UserDetailPage)}</AdminRoute>,
      },
      {
        path: 'trips',
        element: withSuspense(SeasonManagement),
      },
      {
        path: 'seasons/:seasonId',
        element: withSuspense(SeasonDetail),
      },
      {
        path: 'trips/:tripId',
        element: withSuspense(TripDetail),
      },
      {
        path: 'trips/explore',
        element: withSuspense(TripExplore),
      },
      {
        path: 'trips/recommendations',
        element: withSuspense(TripRecommendations),
      },
      {
        path: 'gear',
        element: withSuspense(MyGear),
      },
      {
        path: 'snowbuddy',
        element: withSuspense(SnowbuddyBoard),
      },
      {
        path: 'snowbuddy/smart-matching',
        element: withSuspense(SmartMatchingPage),
      },
      {
        path: 'snowbuddy/requests',
        element: withSuspense(MatchRequestsPage),
      },
    ],
  },
]);
