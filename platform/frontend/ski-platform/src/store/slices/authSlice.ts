/**
 * Authentication Redux Slice
 * 認證狀態管理
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '@/shared/api/authApi';
import type { AuthResponse, UserProfile } from '@/shared/api/authApi';

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: localStorage.getItem('auth_token'),
  isLoading: false,
  error: null,
};

// Async thunks
export const loginThunk = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials);
      localStorage.setItem('auth_token', response.access_token);
      return response;
    } catch (error: any) {
      // 提供更清晰的錯誤訊息
      const status = error.status || error.response?.status;
      if (status === 401) {
        return rejectWithValue('帳號或密碼錯誤。如果您尚未註冊，請點擊下方「立即註冊」');
      }
      return rejectWithValue(error.message || '登入失敗，請稍後再試');
    }
  }
);

export const registerThunk = createAsyncThunk(
  'auth/register',
  async (
    data: {
      email: string;
      password: string;
      display_name: string;
      preferred_language?: string;
      experience_level?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await authApi.register(data);
      localStorage.setItem('auth_token', response.access_token);
      return response;
    } catch (error: any) {
      // 提供更清晰的錯誤訊息
      const status = error.status || error.response?.status;
      const detail = error.message || error.response?.data?.detail;

      if (status === 400 && detail?.includes('Email already registered')) {
        return rejectWithValue('此 Email 已被註冊，請直接登入或使用其他 Email');
      }
      return rejectWithValue(detail || '註冊失敗，請稍後再試');
    }
  }
);

export const loadUserThunk = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return rejectWithValue('No token found');
      }
      const user = await authApi.getCurrentUser();
      return user;
    } catch (error: any) {
      localStorage.removeItem('auth_token');
      return rejectWithValue(error.response?.data?.detail || '載入用戶資料失敗');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem('auth_token');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(loginThunk.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loginThunk.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.token = action.payload.access_token;
      state.user = {
        user_id: action.payload.user_id,
        email: action.payload.email,
        display_name: action.payload.display_name,
        preferred_language: 'zh-TW',
        experience_level: 'beginner',
        roles: ['user'],
        created_at: new Date().toISOString(),
      };
      state.error = null;
    });
    builder.addCase(loginThunk.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Register
    builder.addCase(registerThunk.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(registerThunk.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.token = action.payload.access_token;
      state.user = {
        user_id: action.payload.user_id,
        email: action.payload.email,
        display_name: action.payload.display_name,
        preferred_language: 'zh-TW',
        experience_level: 'beginner',
        roles: ['user'],
        created_at: new Date().toISOString(),
      };
      state.error = null;
    });
    builder.addCase(registerThunk.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Load user
    builder.addCase(loadUserThunk.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(loadUserThunk.fulfilled, (state, action: PayloadAction<UserProfile>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      state.error = null;
    });
    builder.addCase(loadUserThunk.rejected, (state) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
    });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
