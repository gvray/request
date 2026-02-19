import {
  createClient,
  createRequest,
  request,
  createCacheInterceptor,
  createLoggingInterceptor,
  timeout,
} from '@gvray/request';
import type { HttpError } from '@gvray/request';

// Helper to safely access localStorage (SSR-safe)
const getStorage = (key: string) => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
};
const setStorage = (key: string, value: string) => {
  if (typeof window !== 'undefined') localStorage.setItem(key, value);
};

// ============================================================
// Overview: createClient + request (global singleton pattern)
// ============================================================
let initialized = false;
export function initClient() {
  if (initialized || typeof window === 'undefined') return;

  createClient({
    baseURL: '',
    timeout: 8000,
    preset: {
      bearerAuth: {
        getToken: () => getStorage('token'),
        header: 'Authorization',
        scheme: 'Bearer',
        exclude: ['/api/login', '/api/refresh-token'],
      },
      authRefresh: {
        refreshToken: async () => {
          const res = await request('/api/refresh-token', { method: 'POST' });
          return (res as { token?: string })?.token;
        },
        setToken: (token: string) => setStorage('token', token),
        getToken: async () => getStorage('token'),
        statuses: [401],
        loginRedirect: () => console.log('[Auth] Redirect to login'),
      },
      retry: {
        maxRetries: 2,
        retryDelay: 500,
        onRetry: (count, err) => console.log(`[Retry] Global attempt ${count}:`, err.message),
      },
    },
  });
  initialized = true;
}

// Re-export for overview page
export { request };

// ============================================================
// Other pages: createRequest (independent instance pattern)
// ============================================================

// Basic request (no interceptors)
export const basicRequest = createRequest({
  baseURL: '',
  timeout: 8000,
});

// Auth request with bearer token + auto refresh
export const authRequest = createRequest({
  baseURL: '',
  timeout: 8000,
  preset: {
    bearerAuth: {
      getToken: () => getStorage('token'),
      header: 'Authorization',
      scheme: 'Bearer',
      exclude: ['/api/login', '/api/refresh-token'],
    },
    authRefresh: {
      refreshToken: async () => {
        const res = await basicRequest('/api/refresh-token', { method: 'POST' });
        return (res as { token?: string })?.token;
      },
      setToken: (token: string) => setStorage('token', token),
      getToken: async () => getStorage('token'),
      statuses: [401],
      loginRedirect: () => console.log('[Auth] Redirect to login'),
    },
  },
});

// Retry request (via preset.retry — instance is injected automatically)
export const retryRequest = createRequest({
  baseURL: '',
  timeout: 15000,
  preset: {
    retry: {
      maxRetries: 3,
      retryDelay: 800,
      exponentialBackoff: true,
      retryCondition: (error: HttpError) => {
        const status = error.response?.status;
        return status === 503 || (status !== undefined && status >= 500);
      },
      onRetry: (count: number, err: HttpError) =>
        console.log(`[Retry] Attempt ${count}:`, err.message),
    },
  },
});

// Timeout request (2s limit)
export const timeoutRequest = createRequest({
  baseURL: '',
  requestInterceptors: [timeout({ timeout: 2000, message: 'Request timeout exceeded' })],
});

// Cache request
const cacheInterceptors = createCacheInterceptor({
  ttl: 5000,
  onCacheHit: (key: string) => console.log(`[Cache] HIT: ${key}`),
  onCacheMiss: (key: string) => console.log(`[Cache] MISS: ${key}`),
});
export const cacheRequest = createRequest({
  baseURL: '',
  timeout: 8000,
  requestInterceptors: [cacheInterceptors.request],
  responseInterceptors: [cacheInterceptors.response],
});

// Logging request
const loggingInterceptors = createLoggingInterceptor({
  logRequest: true,
  logResponse: true,
  logError: true,
});
export const loggingRequest = createRequest({
  baseURL: '',
  timeout: 8000,
  requestInterceptors: [loggingInterceptors.request],
  responseInterceptors: [loggingInterceptors.response],
});

// ============================================================
// Fetch engine (demonstrates engine switching)
// ============================================================
export const fetchRequest = createRequest({
  engine: 'fetch',
  baseURL: '',
  timeout: 8000,
});

// Fetch engine with logging
const fetchLoggingInterceptors = createLoggingInterceptor({
  logRequest: true,
  logResponse: true,
  logError: true,
});
export const fetchLoggingRequest = createRequest({
  engine: 'fetch',
  baseURL: '',
  timeout: 8000,
  requestInterceptors: [fetchLoggingInterceptors.request],
  responseInterceptors: [fetchLoggingInterceptors.response],
});
