// Polyfills for localStorage and sessionStorage in sandboxed iframe environment where storage can be blocked
try {
  const testKey = '__storage_test_key__';
  window.localStorage.setItem(testKey, testKey);
  window.localStorage.removeItem(testKey);
} catch (e) {
  console.warn('[Storage Polyfill] Local storage blocked by iframe sandbox. Initializing resilient in-memory fallback.');
  const memoryStore: Record<string, string> = {};
  const mockStorage: Storage = {
    getItem: (key: string): string | null => {
      return key in memoryStore ? memoryStore[key] : null;
    },
    setItem: (key: string, value: string): void => {
      memoryStore[key] = String(value);
    },
    removeItem: (key: string): void => {
      delete memoryStore[key];
    },
    clear: (): void => {
      for (const key in memoryStore) {
        delete memoryStore[key];
      }
    },
    get length(): number {
      return Object.keys(memoryStore).length;
    },
    key: (index: number): string | null => {
      return Object.keys(memoryStore)[index] || null;
    }
  };
  try {
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true
    });
  } catch (err) {
    console.error('[Storage Polyfill Failed] Unable to redefine localStorage:', err);
  }
}

try {
  const testKey = '__session_test_key__';
  window.sessionStorage.setItem(testKey, testKey);
  window.sessionStorage.removeItem(testKey);
} catch (e) {
  console.warn('[Storage Polyfill] Session storage blocked. Initializing resilient in-memory fallback.');
  const memoryStore: Record<string, string> = {};
  const mockStorage: Storage = {
    getItem: (key: string): string | null => {
      return key in memoryStore ? memoryStore[key] : null;
    },
    setItem: (key: string, value: string): void => {
      memoryStore[key] = String(value);
    },
    removeItem: (key: string): void => {
      delete memoryStore[key];
    },
    clear: (): void => {
      for (const key in memoryStore) {
        delete memoryStore[key];
      }
    },
    get length(): number {
      return Object.keys(memoryStore).length;
    },
    key: (index: number): string | null => {
      return Object.keys(memoryStore)[index] || null;
    }
  };
  try {
    Object.defineProperty(window, 'sessionStorage', {
      value: mockStorage,
      writable: true,
      configurable: true
    });
  } catch (err) {
    console.error('[Storage Polyfill Failed] Unable to redefine sessionStorage:', err);
  }
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

