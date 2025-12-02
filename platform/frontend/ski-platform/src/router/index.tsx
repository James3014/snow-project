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

// Lazy load pages for code splitting
const ResortList = lazy(() => import('@/features/course-tracking/pages/ResortList'));
const ResortDetail = lazy(() => import('@/features/course-tracking/pages/ResortDetail'));
const CourseHistory = lazy(() => import('@/features/course-tracking/pages/CourseHistory'));
const Recommendations = lazy(() => import('@/features/course-tracking/pages/Recommendations'));
const Rankings = lazy(() => import('@/features/course-tracking/pages/Rankings'));
const Achievements = lazy(() => import('@/features/course-tracking/pages/Achievements'));
const Leaderboard = lazy(() => import('@/features/course-tracking/pages/Leaderboard'));
const ShareCard = lazy(() => import('@/features/course-tracking/pages/ShareCard'));
const FeedPage = lazy(() => import('@/features/activity-feed/pages/FeedPage'));
const SkiMapPage = lazy(() => import('@/features/ski-map/pages/SkiMapPage'));
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'));
const AdminDashboard = lazy(() => import('@/features/admin/pages/AdminDashboard'));
const UserListPage = lazy(() => import('@/features/admin/pages/UserListPage'));
const UserDetailPage = lazy(() => import('@/features/admin/pages/UserDetailPage'));
const SeasonManagement = lazy(() => import('@/features/trip-planning/pages/SeasonManagement'));
const SeasonDetail = lazy(() => import('@/features/trip-planning/pages/SeasonDetail'));
const TripDetail = lazy(() => import('@/features/trip-planning/pages/TripDetail'));
const TripExplore = lazy(() => import('@/features/trip-planning/pages/TripExplore'));
const TripRecommendations = lazy(() => import('@/features/trip-planning/pages/TripRecommendations'));
const MyGear = lazy(() => import('@/features/gear/pages/MyGear'));
const SnowbuddyBoard = lazy(() => import('@/features/snowbuddy/pages/SnowbuddyBoard'));
const SmartMatchingPage = lazy(() => import('@/features/snowbuddy/pages/SmartMatchingPage'));
const MatchRequestsPage = lazy(() => import('@/features/snowbuddy/pages/MatchRequestsPage'));

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
  },
  {
    path: '/register',
    element: withSuspense(RegisterPage),
  },
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: withSuspense(ResortList),
      },
      {
        path: 'resorts',
        element: withSuspense(ResortList),
      },
      {
        path: 'resorts/:resortId',
        element: withSuspense(ResortDetail),
      },
      {
        path: 'history',
        element: withSuspense(CourseHistory),
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
