/**
 * Main Entry Point
 * 应用入口
 */
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { setTestUser } from './store/slices/authSlice';
import './index.css';
import App from './App';

// 临时：设置测试用户
store.dispatch(setTestUser('c7347757-0bc3-4a5c-aad8-148cb6403d22')); // 张伟

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
