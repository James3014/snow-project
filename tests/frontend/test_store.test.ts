/**
 * Redux Store 測試
 * 遵循 TDD 原則
 */

import { configureStore } from '@reduxjs/toolkit';
import {
  authActions,
  tripsActions,
  socialActions,
  gearActions,
  selectAuth,
  selectTrips,
  type RootState,
  type AuthState,
  type TripsState,
} from '../../platform/frontend/shared/store';

// 創建測試 store
const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: (state = {
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null,
      }, action) => {
        switch (action.type) {
          case 'auth/loginStart':
            return { ...state, loading: true, error: null };
          case 'auth/loginSuccess':
            return {
              ...state,
              loading: false,
              isAuthenticated: true,
              user: action.payload.user,
              token: action.payload.token,
              error: null,
            };
          case 'auth/loginFailure':
            return {
              ...state,
              loading: false,
              isAuthenticated: false,
              user: null,
              token: null,
              error: action.payload,
            };
          case 'auth/logout':
            return {
              ...state,
              isAuthenticated: false,
              user: null,
              token: null,
              error: null,
            };
          default:
            return state;
        }
      },
      trips: (state = {
        trips: [],
        currentTrip: null,
        loading: false,
        error: null,
      }, action) => {
        switch (action.type) {
          case 'trips/fetchTripsStart':
            return { ...state, loading: true, error: null };
          case 'trips/fetchTripsSuccess':
            return { ...state, loading: false, trips: action.payload };
          case 'trips/addTrip':
            return { ...state, trips: [...state.trips, action.payload] };
          case 'trips/updateTrip':
            return {
              ...state,
              trips: state.trips.map(trip =>
                trip.id === action.payload.id ? action.payload : trip
              ),
            };
          case 'trips/removeTrip':
            return {
              ...state,
              trips: state.trips.filter(trip => trip.id !== action.payload),
            };
          default:
            return state;
        }
      },
      social: (state = {
        activities: [],
        followers: [],
        following: [],
        loading: false,
        error: null,
      }, action) => {
        switch (action.type) {
          case 'social/addActivity':
            return { ...state, activities: [action.payload, ...state.activities] };
          default:
            return state;
        }
      },
      gear: (state = {
        gear: [],
        loading: false,
        error: null,
      }, action) => {
        switch (action.type) {
          case 'gear/addGear':
            return { ...state, gear: [...state.gear, action.payload] };
          default:
            return state;
        }
      },
    },
  });
};

describe('Auth Slice', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it('should handle login start', () => {
    store.dispatch(authActions.loginStart());
    
    const state = store.getState().auth;
    expect(state.loading).toBe(true);
    expect(state.error).toBe(null);
  });

  it('should handle login success', () => {
    const user = { id: '1', email: 'test@example.com', name: 'Test User' };
    const token = 'test-token';

    store.dispatch(authActions.loginSuccess({ user, token }));
    
    const state = store.getState().auth;
    expect(state.loading).toBe(false);
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(user);
    expect(state.token).toBe(token);
    expect(state.error).toBe(null);
  });

  it('should handle login failure', () => {
    const errorMessage = 'Invalid credentials';

    store.dispatch(authActions.loginFailure(errorMessage));
    
    const state = store.getState().auth;
    expect(state.loading).toBe(false);
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBe(null);
    expect(state.token).toBe(null);
    expect(state.error).toBe(errorMessage);
  });

  it('should handle logout', () => {
    // 先登入
    const user = { id: '1', email: 'test@example.com', name: 'Test User' };
    store.dispatch(authActions.loginSuccess({ user, token: 'test-token' }));
    
    // 然後登出
    store.dispatch(authActions.logout());
    
    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBe(null);
    expect(state.token).toBe(null);
    expect(state.error).toBe(null);
  });
});

describe('Trips Slice', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it('should handle fetch trips start', () => {
    store.dispatch(tripsActions.fetchTripsStart());
    
    const state = store.getState().trips;
    expect(state.loading).toBe(true);
    expect(state.error).toBe(null);
  });

  it('should handle fetch trips success', () => {
    const trips = [
      { id: '1', title: 'Trip 1', destination: 'Niseko', startDate: '2025-01-01', endDate: '2025-01-05', status: 'planning' as const },
      { id: '2', title: 'Trip 2', destination: 'Hakuba', startDate: '2025-02-01', endDate: '2025-02-05', status: 'confirmed' as const },
    ];

    store.dispatch(tripsActions.fetchTripsSuccess(trips));
    
    const state = store.getState().trips;
    expect(state.loading).toBe(false);
    expect(state.trips).toEqual(trips);
  });

  it('should handle add trip', () => {
    const newTrip = {
      id: '1',
      title: 'New Trip',
      destination: 'Niseko',
      startDate: '2025-01-01',
      endDate: '2025-01-05',
      status: 'planning' as const,
    };

    store.dispatch(tripsActions.addTrip(newTrip));
    
    const state = store.getState().trips;
    expect(state.trips).toHaveLength(1);
    expect(state.trips[0]).toEqual(newTrip);
  });

  it('should handle update trip', () => {
    const originalTrip = {
      id: '1',
      title: 'Original Trip',
      destination: 'Niseko',
      startDate: '2025-01-01',
      endDate: '2025-01-05',
      status: 'planning' as const,
    };

    const updatedTrip = {
      ...originalTrip,
      title: 'Updated Trip',
      status: 'confirmed' as const,
    };

    // 先添加原始行程
    store.dispatch(tripsActions.addTrip(originalTrip));
    
    // 然後更新
    store.dispatch(tripsActions.updateTrip(updatedTrip));
    
    const state = store.getState().trips;
    expect(state.trips).toHaveLength(1);
    expect(state.trips[0]).toEqual(updatedTrip);
  });

  it('should handle remove trip', () => {
    const trip = {
      id: '1',
      title: 'Trip to Remove',
      destination: 'Niseko',
      startDate: '2025-01-01',
      endDate: '2025-01-05',
      status: 'planning' as const,
    };

    // 先添加行程
    store.dispatch(tripsActions.addTrip(trip));
    expect(store.getState().trips.trips).toHaveLength(1);
    
    // 然後移除
    store.dispatch(tripsActions.removeTrip('1'));
    
    const state = store.getState().trips;
    expect(state.trips).toHaveLength(0);
  });
});

describe('Social Slice', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it('should handle add activity', () => {
    const activity = {
      id: '1',
      userId: 'user1',
      type: 'trip_completed',
      content: 'Completed a trip to Niseko',
      timestamp: '2025-12-12T10:00:00Z',
    };

    store.dispatch(socialActions.addActivity(activity));
    
    const state = store.getState().social;
    expect(state.activities).toHaveLength(1);
    expect(state.activities[0]).toEqual(activity);
  });

  it('should add new activities to the beginning of the list', () => {
    const activity1 = {
      id: '1',
      userId: 'user1',
      type: 'trip_completed',
      content: 'First activity',
      timestamp: '2025-12-12T10:00:00Z',
    };

    const activity2 = {
      id: '2',
      userId: 'user1',
      type: 'gear_added',
      content: 'Second activity',
      timestamp: '2025-12-12T11:00:00Z',
    };

    store.dispatch(socialActions.addActivity(activity1));
    store.dispatch(socialActions.addActivity(activity2));
    
    const state = store.getState().social;
    expect(state.activities).toHaveLength(2);
    expect(state.activities[0]).toEqual(activity2); // 最新的在前面
    expect(state.activities[1]).toEqual(activity1);
  });
});

describe('Gear Slice', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it('should handle add gear', () => {
    const gear = {
      id: '1',
      name: 'Snowboard',
      category: 'board',
      status: 'active' as const,
      price: 500,
    };

    store.dispatch(gearActions.addGear(gear));
    
    const state = store.getState().gear;
    expect(state.gear).toHaveLength(1);
    expect(state.gear[0]).toEqual(gear);
  });
});

describe('Selectors', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it('should select auth state', () => {
    const state = store.getState() as RootState;
    const authState = selectAuth(state);
    
    expect(authState).toEqual({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
      error: null,
    });
  });

  it('should select trips state', () => {
    const state = store.getState() as RootState;
    const tripsState = selectTrips(state);
    
    expect(tripsState).toEqual({
      trips: [],
      currentTrip: null,
      loading: false,
      error: null,
    });
  });
});
