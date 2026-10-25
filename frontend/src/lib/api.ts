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

export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(init?.headers);

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let url = input;
  if (typeof input === 'string') {
    if (input.startsWith('/v1/')) {
      url = `${API_BASE_URL}${input}`;
    } else if (!input.startsWith('http://') && !input.startsWith('https://') && !input.startsWith('/')) {
      url = `${API_BASE_URL}/${input}`;
    }
  }

  const response = await fetch(url, {
    ...init,
    headers,
    credentials: init?.credentials || 'include',
  });

  const urlStr = typeof url === 'string' ? url : url.toString();
  if (response.status === 401 && !urlStr.includes('/auth/login') && !urlStr.includes('/auth/refresh')) {
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

          const retryHeaders = new Headers(init?.headers);
          retryHeaders.set('Authorization', `Bearer ${newToken}`);
          return fetch(url, {
            ...init,
            headers: retryHeaders,
            credentials: init?.credentials || 'include',
          });
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
          const retryHeaders = new Headers(init?.headers);
          retryHeaders.set('Authorization', `Bearer ${newToken}`);
          resolve(
            fetch(url, {
              ...init,
              headers: retryHeaders,
              credentials: init?.credentials || 'include',
            })
          );
        });
      });
    }
  }

  return response;
}

