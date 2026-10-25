import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
// Polyfill localStorage for Node 22+ jsdom environment
if (typeof window !== 'undefined' && !window.localStorage) {
  const store: Record<string, string> = {};
  (window as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    length: 0,
    key: (index: number) => Object.keys(store)[index] || null,
  };
}
if (typeof globalThis !== 'undefined' && !(globalThis as any).localStorage) {
  (globalThis as any).localStorage = (typeof window !== 'undefined' ? window.localStorage : undefined);
}

import '@/lib/i18n';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from '@/mocks/server';

import { resetAuthMock, resetTrustMock } from '@/mocks/handlers';

// Polyfill Blob/File stream and arrayBuffer for jsdom in Node 20
if (typeof Blob !== 'undefined') {
  if (!Blob.prototype.arrayBuffer) {
    Blob.prototype.arrayBuffer = async function () {
      return new Uint8Array([1, 2, 3]).buffer;
    };
  }
  if (!Blob.prototype.stream) {
    Blob.prototype.stream = function () {
      const buf = new Uint8Array([1, 2, 3]);
      return new ReadableStream({
        start(controller) {
          controller.enqueue(buf);
          controller.close();
        },
      });
    };
  }
}

if (typeof File !== 'undefined') {
  if (!File.prototype.arrayBuffer) {
    File.prototype.arrayBuffer = async function () {
      return new Uint8Array([1, 2, 3]).buffer;
    };
  }
  if (!File.prototype.stream) {
    File.prototype.stream = function () {
      const buf = new Uint8Array([1, 2, 3]);
      return new ReadableStream({
        start(controller) {
          controller.enqueue(buf);
          controller.close();
        },
      });
    };
  }
}

// Polyfill ResizeObserver for Recharts in JSDOM
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
if (typeof global !== 'undefined' && !(global as any).ResizeObserver) {
  (global as any).ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
  };
}

if (typeof window !== 'undefined' && (!window.crypto || !window.crypto.subtle) && typeof globalThis !== 'undefined' && globalThis.crypto) {
  Object.defineProperty(window, 'crypto', {
    value: globalThis.crypto,
    writable: true,
  });
}
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  resetAuthMock();
  resetTrustMock();
  localStorage.clear();
  sessionStorage.clear();
});
afterAll(() => server.close());
