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
  async (credentials: { email: string; password: string; captcha_token?: string }, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials);
      localStorage.setItem('auth_token', response.access_token);
      return response;
    } catch (error: unknown) {
      // 提供更友善的錯誤訊息
      const axiosError = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { status?: number; data?: { detail?: string } } })
        : null;
      const status = axiosError?.response?.status;
      const detail = axiosError?.response?.data?.detail;

      let errorMessage = '登入失敗，請稍後再試';

      if (status === 401 || status === 403) {
        errorMessage = '帳號或密碼錯誤，請重新輸入';
      } else if (status === 404) {
        errorMessage = '帳號不存在，請先註冊';
      } else if (status === 429) {
        errorMessage = '登入嘗試次數過多，請稍後再試';
      } else if (detail && typeof detail === 'string') {
        errorMessage = detail;
      } else if (!axiosError?.response) {
        errorMessage = '無法連接伺服器，請檢查網路連線';
      }

      return rejectWithValue(errorMessage);
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
      captcha_token?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await authApi.register(data);
      localStorage.setItem('auth_token', response.access_token);
      return response;
    } catch (error: unknown) {
      // 提供更友善的錯誤訊息
      const axiosError = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { status?: number; data?: { detail?: string } } })
        : null;
      const status = axiosError?.response?.status;
      const detail = axiosError?.response?.data?.detail;

      let errorMessage = '註冊失敗，請稍後再試';

      if (status === 400) {
        if (detail?.includes('email') || detail?.includes('Email')) {
          errorMessage = '此電子郵件已被使用，請使用其他郵件或直接登入';
        } else if (detail?.includes('password')) {
          errorMessage = '密碼格式不符合要求，請使用更強的密碼';
        } else {
          errorMessage = detail || '註冊資料格式錯誤，請檢查後重試';
        }
      } else if (status === 409) {
        errorMessage = '此帳號已存在，請直接登入';
      } else if (detail && typeof detail === 'string') {
        errorMessage = detail;
      } else if (!axiosError?.response) {
        errorMessage = '無法連接伺服器，請檢查網路連線';
      }

      return rejectWithValue(errorMessage);
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
    } catch (error: unknown) {
      localStorage.removeItem('auth_token');
      const axiosError = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { detail?: string } } })
        : null;
      return rejectWithValue(axiosError?.response?.data?.detail || '載入用戶資料失敗');
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
