/**
 * Router Configuration
 * 路由配置
 */
import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '@/shell/RootLayout';
import AdminRoute from '@/shared/components/auth/AdminRoute';

// Lazy load pages for code splitting
import { lazy } from 'react';

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

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <ResortList />,
      },
      {
        path: 'resorts',
        element: <ResortList />,
      },
      {
        path: 'resorts/:resortId',
        element: <ResortDetail />,
      },
      {
        path: 'history',
        element: <CourseHistory />,
      },
      {
        path: 'resorts/:resortId/recommendations',
        element: <Recommendations />,
      },
      {
        path: 'resorts/:resortId/rankings',
        element: <Rankings />,
      },
      {
        path: 'achievements',
        element: <Achievements />,
      },
      {
        path: 'leaderboard',
        element: <Leaderboard />,
      },
      {
        path: 'share/achievement/:achievementId',
        element: <ShareCard />,
      },
      {
        path: 'feed',
        element: <FeedPage />,
      },
      {
        path: 'ski-map',
        element: <SkiMapPage />,
      },
      {
        path: 'admin',
        element: <AdminRoute><AdminDashboard /></AdminRoute>,
      },
      {
        path: 'admin/users',
        element: <AdminRoute><UserListPage /></AdminRoute>,
      },
      {
        path: 'admin/users/:userId',
        element: <AdminRoute><UserDetailPage /></AdminRoute>,
      },
      {
        path: 'trips',
        element: <SeasonManagement />,
      },
      {
        path: 'seasons/:seasonId',
        element: <SeasonDetail />,
      },
      {
        path: 'trips/:tripId',
        element: <TripDetail />,
      },
      {
        path: 'trips/explore',
        element: <TripExplore />,
      },
      {
        path: 'trips/recommendations',
        element: <TripRecommendations />,
      },
      {
        path: 'gear',
        element: <MyGear />,
      },
      {
        path: 'snowbuddy',
        element: <SnowbuddyBoard />,
      },
      {
        path: 'snowbuddy/smart-matching',
        element: <SmartMatchingPage />,
      },
      {
        path: 'snowbuddy/requests',
        element: <MatchRequestsPage />,
      },
    ],
  },
]);
