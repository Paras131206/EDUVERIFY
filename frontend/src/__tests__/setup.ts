import '@testing-library/jest-dom';
import '@/lib/i18n';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from '@/mocks/server';

import { resetAuthMock } from '@/mocks/handlers';

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  resetAuthMock();
  localStorage.clear();
  sessionStorage.clear();
});
afterAll(() => server.close());
