/**
 * 統一狀態管理 Store
 * 使用 Redux Toolkit 實現
 */
import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';

// 認證狀態
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

const initialAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = null;
    },
  },
});

// 行程狀態
export interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'confirmed' | 'completed' | 'cancelled';
}

export interface TripsState {
  trips: Trip[];
  currentTrip: Trip | null;
  loading: boolean;
  error: string | null;
}

const initialTripsState: TripsState = {
  trips: [],
  currentTrip: null,
  loading: false,
  error: null,
};

const tripsSlice = createSlice({
  name: 'trips',
  initialState: initialTripsState,
  reducers: {
    fetchTripsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchTripsSuccess: (state, action: PayloadAction<Trip[]>) => {
      state.loading = false;
      state.trips = action.payload;
    },
    fetchTripsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    setCurrentTrip: (state, action: PayloadAction<Trip>) => {
      state.currentTrip = action.payload;
    },
    addTrip: (state, action: PayloadAction<Trip>) => {
      state.trips.push(action.payload);
    },
    updateTrip: (state, action: PayloadAction<Trip>) => {
      const index = state.trips.findIndex(trip => trip.id === action.payload.id);
      if (index !== -1) {
        state.trips[index] = action.payload;
      }
    },
    removeTrip: (state, action: PayloadAction<string>) => {
      state.trips = state.trips.filter(trip => trip.id !== action.payload);
    },
  },
});

// 社交狀態
export interface Activity {
  id: string;
  userId: string;
  type: string;
  content: string;
  timestamp: string;
}

export interface SocialState {
  activities: Activity[];
  followers: string[];
  following: string[];
  loading: boolean;
  error: string | null;
}

const initialSocialState: SocialState = {
  activities: [],
  followers: [],
  following: [],
  loading: false,
  error: null,
};

const socialSlice = createSlice({
  name: 'social',
  initialState: initialSocialState,
  reducers: {
    fetchActivitiesStart: (state) => {
      state.loading = true;
    },
    fetchActivitiesSuccess: (state, action: PayloadAction<Activity[]>) => {
      state.loading = false;
      state.activities = action.payload;
    },
    addActivity: (state, action: PayloadAction<Activity>) => {
      state.activities.unshift(action.payload);
    },
  },
});

// 裝備狀態
export interface Gear {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'for_sale' | 'sold';
  price?: number;
}

export interface GearState {
  gear: Gear[];
  loading: boolean;
  error: string | null;
}

const initialGearState: GearState = {
  gear: [],
  loading: false,
  error: null,
};

const gearSlice = createSlice({
  name: 'gear',
  initialState: initialGearState,
  reducers: {
    fetchGearStart: (state) => {
      state.loading = true;
    },
    fetchGearSuccess: (state, action: PayloadAction<Gear[]>) => {
      state.loading = false;
      state.gear = action.payload;
    },
    addGear: (state, action: PayloadAction<Gear>) => {
      state.gear.push(action.payload);
    },
    updateGear: (state, action: PayloadAction<Gear>) => {
      const index = state.gear.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.gear[index] = action.payload;
      }
    },
  },
});

// Root State 類型
export interface RootState {
  auth: AuthState;
  trips: TripsState;
  social: SocialState;
  gear: GearState;
}

// Store 配置
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    trips: tripsSlice.reducer,
    social: socialSlice.reducer,
    gear: gearSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

// Actions 導出
export const authActions = authSlice.actions;
export const tripsActions = tripsSlice.actions;
export const socialActions = socialSlice.actions;
export const gearActions = gearSlice.actions;

// Types 導出
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;

// Selectors
export const selectAuth = (state: RootState) => state.auth;
export const selectTrips = (state: RootState) => state.trips;
export const selectSocial = (state: RootState) => state.social;
export const selectGear = (state: RootState) => state.gear;

// 異步 Actions (Thunks)
import { createAsyncThunk } from '@reduxjs/toolkit';
import { authApi, tripsApi, socialApi, gearApi } from './api-client';

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }) => {
    const response = await authApi.login(credentials);
    return response.data;
  }
);

export const fetchTrips = createAsyncThunk(
  'trips/fetchTrips',
  async () => {
    const response = await tripsApi.getTrips();
    return response.data;
  }
);

export const fetchUserFeed = createAsyncThunk(
  'social/fetchFeed',
  async (userId: string) => {
    const response = await socialApi.getFeed(userId);
    return response.data;
  }
);

export const fetchUserGear = createAsyncThunk(
  'gear/fetchGear',
  async (userId: string) => {
    const response = await gearApi.getUserGear(userId);
    return response.data;
  }
);
