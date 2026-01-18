# @gvray/request

Universal HTTP client for modern web applications

[![npm version](https://img.shields.io/npm/v/@gvray/request.svg)](https://www.npmjs.com/package/@gvray/request)
[![license](https://img.shields.io/npm/l/@gvray/request.svg)](https://github.com/gvray/request/blob/main/LICENSE)

## Installation

```bash
npm install @gvray/request
```

## Quick Start

```typescript
import { createClient, request } from '@gvray/request';

// Initialize global client
createClient({
  baseURL: 'https://api.example.com',
  preset: {
    bearerAuth: { getToken: () => localStorage.getItem('token') },
  },
});

// Make requests
const users = await request('/users');
```

## API Patterns

### Global Client (Recommended)

```typescript
import { createClient, request } from '@gvray/request';

// Initialize once
createClient({
  baseURL: '/api',
  preset: {
    bearerAuth: { getToken: () => token },
    authRefresh: { refreshToken: async () => newToken },
  },
});

// Use anywhere
await request('/users');
```

### Independent Instances

```typescript
import { createRequest } from '@gvray/request';

// Multiple configurations
const apiRequest = createRequest({ baseURL: '/api' });
const adminRequest = createRequest({
  baseURL: '/admin',
  preset: { bearerAuth: { getToken: () => adminToken } },
});

await apiRequest('/users');
await adminRequest('/users');
```

## Built-in Features

- `bearerAuth` - Auto-inject Authorization header
- `authRefresh` - Auto-refresh expired tokens
- `acceptLanguage` - Auto-inject Accept-Language header
- `jsonContentType` - Set Content-Type to application/json
- `withCredentials` - Enable credentials for cross-origin requests

## Request Options

```typescript
// Standard request
const data = await request<User[]>('/users');

// With options
const user = await request<User>('/users', {
  method: 'POST',
  data: { name: 'John' },
  skipAuth: true,
  getResponse: true,
});
```

## Error Handling

```typescript
import { ErrorShowType } from '@gvray/request';

createClient({
  errorConfig: {
    errorHandler: (error, opts, feedBack) => {
      feedBack?.({
        showType: ErrorShowType.ERROR_MESSAGE,
        message: error.message,
      });
    },
  },
});
```

## Interceptors

```typescript
createClient({
  requestInterceptors: [(config) => config],
  responseInterceptors: [(response) => response],
});
```

## License

MIT
