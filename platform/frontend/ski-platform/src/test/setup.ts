/**
 * Vitest Setup File
 * 測試環境配置
 */
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

globalThis.localStorage = localStorageMock as any;

// Mock sessionStorage
globalThis.sessionStorage = localStorageMock as any;
