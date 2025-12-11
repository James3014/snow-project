/**
 * Vitest Setup File
 * 測試環境配置
 */
import { vi } from 'vitest';

// 完整的 Storage Mock 實現 - 單一職責原則
const createStorageMock = (): Storage => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
});

// 模組化設置
globalThis.localStorage = createStorageMock();
globalThis.sessionStorage = createStorageMock();
