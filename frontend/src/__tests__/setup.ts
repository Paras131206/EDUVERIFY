import '@testing-library/jest-dom';
import '@/lib/i18n';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from '@/mocks/server';

import { resetAuthMock } from '@/mocks/handlers';

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

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  resetAuthMock();
  localStorage.clear();
  sessionStorage.clear();
});
afterAll(() => server.close());
