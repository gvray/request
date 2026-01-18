import {
  createClient,
  createRequest,
  request,
  createRetryInterceptor,
  createCacheInterceptor,
  createLoggingInterceptor,
  timeout,
} from '@gvray/request'
import type { AxiosError } from 'axios'

// Helper to safely access localStorage (SSR-safe)
const getStorage = (key: string) => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(key)
}
const setStorage = (key: string, value: string) => {
  if (typeof window !== 'undefined') localStorage.setItem(key, value)
}

// ============================================================
// Overview: createClient + request (global singleton pattern)
// ============================================================
let initialized = false
export function initClient() {
  if (initialized || typeof window === 'undefined') return
  
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
          const res = await request('/api/refresh-token', { method: 'POST' })
          return (res as { token?: string })?.token
        },
        setToken: (token: string) => setStorage('token', token),
        getToken: async () => getStorage('token'),
        statuses: [401],
        loginRedirect: () => console.log('[Auth] Redirect to login'),
      },
    },
  })
  initialized = true
}

// Re-export for overview page
export { request }

// ============================================================
// Other pages: createRequest (independent instance pattern)
// ============================================================

// Basic request (no interceptors)
export const basicRequest = createRequest({
  baseURL: '',
  timeout: 8000,
})

// Auth request with bearer token
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
        const res = await basicRequest('/api/refresh-token', { method: 'POST' })
        return (res as { token?: string })?.token
      },
      setToken: (token: string) => setStorage('token', token),
      getToken: async () => getStorage('token'),
      statuses: [401],
      loginRedirect: () => console.log('[Auth] Redirect to login'),
    },
  },
})

// Retry request
export const retryRequest = createRequest({
  baseURL: '',
  timeout: 15000,
  responseInterceptors: [
    createRetryInterceptor({
      maxRetries: 3,
      retryDelay: 800,
      exponentialBackoff: true,
      retryCondition: (error: AxiosError) => {
        const status = error.response?.status
        return status === 503 || (status !== undefined && status >= 500)
      },
      onRetry: (count: number, err: AxiosError) => console.log(`[Retry] Attempt ${count}:`, err.message),
    }),
  ],
})

// Timeout request (2s limit)
export const timeoutRequest = createRequest({
  baseURL: '',
  requestInterceptors: [timeout({ timeout: 2000, message: 'Request timeout exceeded' })],
})

// Cache request
const cacheInterceptors = createCacheInterceptor({
  ttl: 5000,
  onCacheHit: (key: string) => console.log(`[Cache] HIT: ${key}`),
  onCacheMiss: (key: string) => console.log(`[Cache] MISS: ${key}`),
})
export const cacheRequest = createRequest({
  baseURL: '',
  timeout: 8000,
  requestInterceptors: [cacheInterceptors.request],
  responseInterceptors: [cacheInterceptors.response],
})

// Logging request
const loggingInterceptors = createLoggingInterceptor({
  logRequest: true,
  logResponse: true,
  logError: true,
})
export const loggingRequest = createRequest({
  baseURL: '',
  timeout: 8000,
  requestInterceptors: [loggingInterceptors.request],
  responseInterceptors: [loggingInterceptors.response],
})
