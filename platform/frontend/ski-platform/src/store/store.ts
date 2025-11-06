/**
 * Redux Store Configuration
 * Redux Store 配置
 */
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import courseTrackingReducer from './slices/courseTrackingSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    courseTracking: courseTrackingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // 忽略某些 action 的序列化检查
        ignoredActions: ['courseTracking/addToast'],
      },
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
