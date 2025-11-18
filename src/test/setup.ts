import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Mock chrome API
global.chrome = {
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn(),
    create: vi.fn(),
    remove: vi.fn(),
  },
  runtime: {
    onMessage: {
      addListener: vi.fn(),
    },
  },
} as any;
