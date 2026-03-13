<div align="center">
<h1>@gvray/request</h1>
<p>A powerful, composable HTTP client for modern JavaScript applications.</p>
<p>
<a href="https://www.npmjs.com/package/@gvray/request"><img src="https://img.shields.io/npm/v/@gvray/request.svg?style=flat-square" alt="npm version" /></a>
<a href="https://www.npmjs.com/package/@gvray/request"><img src="https://img.shields.io/npm/dm/@gvray/request.svg?style=flat-square" alt="npm downloads" /></a>
<a href="https://bundlephobia.com/package/@gvray/request"><img src="https://img.shields.io/bundlephobia/minzip/@gvray/request?style=flat-square" alt="bundle size" /></a>
<a href="https://github.com/gvray/request/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@gvray/request.svg?style=flat-square" alt="license" /></a>
<img src="https://img.shields.io/badge/TypeScript-strict-blue?style=flat-square" alt="TypeScript" />
</p>
</div>

---

**@gvray/request** is a universal HTTP client built on a **dual-engine architecture** (Axios + Fetch) with a declarative preset system and a rich set of composable interceptors. It handles the hard parts — auth token refresh, retry with backoff, response caching, structured logging — so you can focus on your application logic.

## Features

- **Dual engine** — switch between Axios and native Fetch per-instance
- **Preset system** — configure complex behaviors declaratively with zero boilerplate
- **Smart token refresh** — proactive (request-side) and reactive (response-side) strategies
- **Auto retry** — exponential backoff, custom conditions, status code filtering
- **Response caching** — pluggable storage, TTL, per-request bypass
- **Structured logging** — configurable log levels, custom loggers, request timing
- **Two usage patterns** — global singleton or independent instances
- **Fully typed** — strict TypeScript, generic response types, no `any` leakage
- **Composable interceptors** — use presets or compose interceptors manually

## Installation

```bash
npm install @gvray/request
# or
pnpm add @gvray/request
# or
yarn add @gvray/request
```

## Quick Start

```typescript
import { createClient, request } from '@gvray/request';
import storetify from 'storetify';

createClient({
  baseURL: 'https://api.example.com',
  preset: {
    bearerAuth: {
      getToken: () => storetify<string>('access_token'),
    },
  },
});

const users = await request<User[]>('/users');
```

## Usage Patterns

### Global Singleton

Initialize once, use `request` anywhere in your app. Ideal for most applications with a single API base URL.

```typescript
import { createClient, request, requestSafe } from '@gvray/request';
import storetify from 'storetify';

createClient({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  preset: {
    bearerAuth: { getToken: () => storetify<string>('access_token') },
    retry: { maxRetries: 2, retryDelay: 500 },
    logging: { logRequest: true, logResponse: true },
  },
});

// Returns T directly, throws on error
const users = await request<User[]>('/users');

// Returns { data, error } — never throws
const { data, error } = await requestSafe<User[]>('/users');
```

### Independent Instances

Create isolated instances with different configurations. Perfect for multi-tenant apps, admin vs. public APIs, or per-domain settings.

```typescript
import { createRequest } from '@gvray/request';

const publicApi = createRequest({ baseURL: 'https://api.example.com' });

const adminApi = createRequest({
  baseURL: 'https://admin.example.com',
  preset: {
    bearerAuth: { getToken: () => getAdminToken() },
    retry: { maxRetries: 3 },
  },
});

const data = await publicApi<Product[]>('/products');
const report = await adminApi<Report>('/reports/summary');
```

## Preset System

Presets are declarative configurations for built-in interceptors. They compose cleanly, register in the correct order, and eliminate repetitive setup code.

### `bearerAuth` — Bearer Token Injection

Automatically injects `Authorization: Bearer <token>` on every request.

```typescript
import storetify from 'storetify';

createClient({
  preset: {
    bearerAuth: {
      getToken: () => storetify<string>('access_token'), // sync or async
      header: 'Authorization', // default
      scheme: 'Bearer', // default
      exclude: ['/auth/login', '/auth/register', /^\/public\//],
    },
  },
});
```

### `requestAuthRefresh` — Proactive Token Refresh

Checks token validity _before_ the request is sent. If `getToken()` returns `null` or `undefined`, the refresh is triggered first. All concurrent requests share a single refresh — no duplicate calls.

```typescript
createClient({
  preset: {
    requestAuthRefresh: {
      getToken: () => tokenStore.get('access_token'), // null = expired
      refreshToken: async () => {
        const res = await fetch('/auth/refresh', { method: 'POST' });
        const { accessToken } = await res.json();
        return accessToken;
      },
      setToken: (token) => tokenStore.set('access_token', token),
      exclude: ['/auth/login', '/auth/refresh'],
    },
  },
});
```

### `responseAuthRefresh` — Reactive Token Refresh

Triggers a token refresh when the server responds with `401` or `403`. Queues all subsequent failing requests during the refresh and retries them automatically on success.

```typescript
createClient({
  preset: {
    bearerAuth: { getToken: () => tokenStore.get('access_token') },
    responseAuthRefresh: {
      refreshToken: async () => {
        /* ... */ return newAccessToken;
      },
      setToken: (token) => tokenStore.set('access_token', token),
      statuses: [401, 403], // default
      loginRedirect: () => router.push('/login'),
    },
  },
});
```

> **Choosing a strategy:** Use `requestAuthRefresh` when your frontend can determine expiry (e.g. JWT `exp`, time-based store). Use `responseAuthRefresh` when you rely on the server to signal expiry via status codes.

### `retry` — Automatic Retry with Backoff

Retries failed requests with exponential backoff. Understands network errors, timeouts, and configurable status codes. Plays nicely with `responseAuthRefresh` — auth-retried requests are never double-retried.

```typescript
createClient({
  preset: {
    retry: {
      maxRetries: 3,
      retryDelay: 500, // base delay in ms
      exponentialBackoff: true, // 500ms → 1s → 2s
      retryableStatuses: [408, 429, 500, 502, 503, 504],
      retryCondition: (error) => error.response?.status === 503,
      onRetry: (count, error) => console.warn(`Retry #${count}:`, error.message),
    },
  },
});
```

### `logging` — Structured Request Logging

Logs requests, responses, and errors with timing information. Supports custom loggers for integration with any logging infrastructure.

```typescript
createClient({
  preset: {
    logging: {
      level: 'info',
      logRequest: true,
      logResponse: true,
      logError: true,
      logRequestBody: false, // avoid logging sensitive data
      logResponseBody: false,
      logger: {
        info: (...args) => myLogger.info(...args),
        error: (...args) => myLogger.error(...args),
      },
    },
  },
});
```

### `acceptLanguage` — i18n Header Injection

```typescript
createClient({
  preset: {
    acceptLanguage: {
      getLocale: () => i18n.language, // sync or async
      header: 'Accept-Language', // default
    },
  },
});
```

### `jsonContentType` and `withCredentials`

```typescript
createClient({
  preset: {
    jsonContentType: true, // auto Content-Type: application/json for non-GET
    withCredentials: true, // credentials: 'include' for cross-origin
  },
});
```

## Request Options

```typescript
// Auto-inferred return type
const users = await request<User[]>('/users');

// With explicit options
const user = await request<User>('/users/1', {
  method: 'PUT',
  data: { name: 'Alice' },
  timeout: 5000,
  skipAuth: true, // skip auth interceptors for this request
});

// Get the full response object
const response = await request<User>('/users/1', {
  getResponse: true,
  // response.data, response.status, response.headers ...
});

// Per-request interceptors (scoped, automatically ejected after the request)
const result = await request('/upload', {
  method: 'POST',
  data: formData,
  requestInterceptors: [(config) => ({ ...config, onUploadProgress: (e) => setProgress(e) })],
});
```

## Standalone Interceptors

All preset capabilities are available as standalone interceptors for full manual control.

### Auth

```typescript
import { requestBearerAuth, requestAuthRefresh, createResponseAuthRefresh } from '@gvray/request';
import storetify from 'storetify';

const myRequest = createRequest({
  baseURL: '/api',
  requestInterceptors: [
    requestBearerAuth(() => storetify<string>('access_token')),
    requestAuthRefresh({ getToken, refreshToken, setToken }),
  ],
});
```

### Cache

```typescript
import { createCacheInterceptor } from '@gvray/request';

const cache = createCacheInterceptor({
  ttl: 60_000, // 1 minute
  onlyGet: true,
  exclude: ['/realtime', /\/live\//],
  onCacheHit: (key) => console.log('HIT:', key),
  onCacheMiss: (key) => console.log('MISS:', key),
  // Bring your own storage (Redis, localStorage, etc.)
  storage: {
    get: (key) => redisClient.get(key),
    set: (key, value) => redisClient.set(key, value),
    delete: (key) => redisClient.del(key),
    clear: () => redisClient.flushdb(),
  },
});

const cachedRequest = createRequest({
  baseURL: '/api',
  requestInterceptors: [cache.request],
  responseInterceptors: [cache.response],
});
```

### Retry

```typescript
import { createResponseRetry } from '@gvray/request';

const myRequest = createRequest({ baseURL: '/api' });

// Factory form: instance is injected automatically
const retryInterceptor = createResponseRetry({
  maxRetries: 5,
  retryDelay: 300,
  exponentialBackoff: true,
});
```

### Timeout

```typescript
import { requestTimeout } from '@gvray/request';

const myRequest = createRequest({
  baseURL: '/api',
  requestInterceptors: [requestTimeout({ timeout: 3000, message: 'Request timed out' })],
});
```

### Logging

```typescript
import { createLoggingInterceptor } from '@gvray/request';

const logger = createLoggingInterceptor({ level: 'debug', logResponseBody: true });

const myRequest = createRequest({
  baseURL: '/api',
  requestInterceptors: [logger.request],
  responseInterceptors: [logger.response],
});
```

## Engine Switching

Switch from Axios to the native Fetch API per-instance, no other changes required.

```typescript
const fetchRequest = createRequest({
  engine: 'fetch', // 'axios' (default) | 'fetch'
  baseURL: 'https://api.example.com',
  preset: {
    bearerAuth: { getToken: () => token },
    retry: { maxRetries: 2 },
  },
});
```

## Error Handling

```typescript
import { createClient, ErrorShowType } from '@gvray/request';

createClient({
  errorConfig: {
    errorHandler: (error, opts, feedback) => {
      if (error.response?.status === 401) {
        router.push('/login');
        return;
      }
      feedback?.({
        showType: ErrorShowType.ERROR_MESSAGE,
        message: error.message,
      });
    },
    errorThrower: (data) => {
      // Called when response.data.success === false
      throw new Error(data.errorMessage);
    },
  },
});
```

## TypeScript

@gvray/request is written in strict TypeScript. All interceptors, configs, and response types are fully typed.

```typescript
import type {
  GvrayConfig,
  GvrayOptions,
  GvrayResponse,
  GvrayError,
  GvrayRequestInterceptor,
  GvrayResponseInterceptor,
} from '@gvray/request';

const myInterceptor: GvrayRequestInterceptor = (config) => {
  return { ...config, headers: { ...config.headers, 'X-App-Version': '1.0.0' } };
};
```

## License

[MIT](./LICENSE) © Gavin
