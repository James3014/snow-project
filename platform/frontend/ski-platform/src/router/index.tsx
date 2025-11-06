/**
 * Router Configuration
 * 路由配置
 */
import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '@/shell/RootLayout';

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

export const router = createBrowserRouter([
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
    ],
  },
]);
