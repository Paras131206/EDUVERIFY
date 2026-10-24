import createClient from 'openapi-fetch';
import type { paths } from '@/api/schema.gen';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

let authToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

export const apiClient = createClient<paths>({
  baseUrl: API_BASE_URL,
});

apiClient.use({
  async onRequest({ request }) {
    if (authToken) {
      request.headers.set('Authorization', `Bearer ${authToken}`);
    }
    return request;
  },

  async onResponse({ response, request }) {
    if (response.status === 401 && !request.url.includes('/auth/login') && !request.url.includes('/auth/refresh')) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const res = await fetch(`${API_BASE_URL}/v1/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          if (res.ok) {
            const data = await res.json();
            const newToken = data.access_token;
            setAuthToken(newToken);
            isRefreshing = false;
            onRefreshed(newToken);

            const retryRequest = new Request(request.url, {
              ...request,
              headers: new Headers(request.headers),
            });
            retryRequest.headers.set('Authorization', `Bearer ${newToken}`);
            return fetch(retryRequest);
          } else {
            setAuthToken(null);
            isRefreshing = false;
          }
        } catch {
          setAuthToken(null);
          isRefreshing = false;
        }
      } else {
        return new Promise<Response>((resolve) => {
          subscribeTokenRefresh((newToken: string) => {
            const retryRequest = new Request(request.url, {
              ...request,
              headers: new Headers(request.headers),
            });
            retryRequest.headers.set('Authorization', `Bearer ${newToken}`);
            resolve(fetch(retryRequest));
          });
        });
      }
    }
    return response;
  },
});

/**
 * Universal authenticated fetch utility.
 * Automatically resolves relative paths (e.g. /v1/...) to API_BASE_URL,
 * injects Authorization: Bearer <token> headers, handles credentials,
 * and seamlessly retries on 401 token expiration.
 */
export async function fetchWithAuth(
  input: RequestInfo | URL | string,
  init?: RequestInit
): Promise<Response> {
  let resolvedUrl: string | URL | Request;

  if (typeof input === 'string') {
    if (input.startsWith('/')) {
      resolvedUrl = `${API_BASE_URL}${input}`;
    } else {
      resolvedUrl = input;
    }
  } else if (input instanceof URL) {
    if (
      typeof window !== 'undefined' &&
      input.origin === window.location.origin &&
      input.pathname.startsWith('/v1')
    ) {
      resolvedUrl = `${API_BASE_URL}${input.pathname}${input.search}`;
    } else {
      resolvedUrl = input;
    }
  } else {
    resolvedUrl = input;
  }

  const reqInit: RequestInit = { ...init };
  const headers = new Headers(
    reqInit.headers ||
      (typeof input === 'object' && 'headers' in input ? (input as Request).headers : undefined)
  );

  if (authToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  if (reqInit.credentials === undefined) {
    reqInit.credentials = 'include';
  }
  reqInit.headers = headers;

  const response = await fetch(resolvedUrl, reqInit);

  const urlString =
    typeof resolvedUrl === 'string'
      ? resolvedUrl
      : resolvedUrl instanceof URL
        ? resolvedUrl.toString()
        : (resolvedUrl as Request).url;

  if (
    response.status === 401 &&
    !urlString.includes('/auth/login') &&
    !urlString.includes('/auth/refresh')
  ) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const res = await fetch(`${API_BASE_URL}/v1/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const data = await res.json();
          const newToken = data.access_token;
          setAuthToken(newToken);
          isRefreshing = false;
          onRefreshed(newToken);

          headers.set('Authorization', `Bearer ${newToken}`);
          reqInit.headers = headers;
          return fetch(resolvedUrl, reqInit);
        } else {
          setAuthToken(null);
          isRefreshing = false;
        }
      } catch {
        setAuthToken(null);
        isRefreshing = false;
      }
    } else {
      return new Promise<Response>((resolve) => {
        subscribeTokenRefresh(async (newToken: string) => {
          headers.set('Authorization', `Bearer ${newToken}`);
          reqInit.headers = headers;
          resolve(fetch(resolvedUrl, reqInit));
        });
      });
    }
  }

  return response;
}

