# @gvray/request

Universal Request Standard for Modern Web and Multi-Platform Apps

[![npm version](https://img.shields.io/npm/v/@gvray/request.svg)](https://www.npmjs.com/package/@gvray/request)
[![license](https://img.shields.io/npm/l/@gvray/request.svg)](https://github.com/gvray/request/blob/main/LICENSE)

## Installation

```bash
# npm
npm install @gvray/request

# pnpm
pnpm add @gvray/request

# yarn
yarn add @gvray/request
```

## Quick Start

```typescript
import { createClient, request } from '@gvray/request';

// Create a client instance
const client = createClient({
  baseURL: 'https://api.example.com',
  timeout: 10000,
});

// Make requests
const data = await request('/users');
```

## Features

- **Universal** - Works in browser, Node.js, and multi-platform apps
- **TypeScript First** - Full type safety out of the box
- **Interceptors** - Request and response interceptors for flexible customization
- **Built-in Auth** - Bearer token, refresh token, and credential handling
- **Error Handling** - Configurable error handlers with multiple display types
- **Axios Based** - Built on top of the reliable Axios library

## Configuration

### Client Configuration

```typescript
import { createClient } from '@gvray/request';

const client = createClient({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  features: {
    // Auto-inject Bearer token
    bearerAuth: {
      getToken: () => localStorage.getItem('token'),
      exclude: ['/auth/login', '/auth/register'],
    },
    // Auto-inject Accept-Language header
    acceptLanguage: {
      getLocale: () => navigator.language,
    },
    // Auto-set Content-Type: application/json
    jsonContentType: true,
    // Include credentials in requests
    withCredentials: true,
  },
  errorConfig: {
    errorHandler: (error, opts, feedBack) => {
      // Custom error handling
    },
  },
});
```

### Built-in Features

| Feature           | Description                                        |
| ----------------- | -------------------------------------------------- |
| `bearerAuth`      | Auto-inject Authorization header with Bearer token |
| `acceptLanguage`  | Auto-inject Accept-Language header                 |
| `jsonContentType` | Set Content-Type to application/json               |
| `withCredentials` | Enable credentials for cross-origin requests       |
| `authRefresh`     | Auto-refresh expired tokens                        |

## Making Requests

```typescript
import { request, requestSafe } from '@gvray/request';

// Standard request - throws on error
const users = await request<User[]>('/users');

// Safe request - returns result object
const { data, error, response } = await requestSafe<User[]>('/users');

// With options
const user = await request<User>('/users', {
  method: 'POST',
  data: { name: 'John' },
  skipErrorHandler: true,
  skipAuth: true,
});

// Get full response
const response = await request<User>('/users/1', {
  getResponse: true,
});
```

## Interceptors

```typescript
import { createClient, interceptors } from '@gvray/request';

const client = createClient({
  baseURL: 'https://api.example.com',
  requestInterceptors: [
    (config) => {
      // Modify request config
      return config;
    },
  ],
  responseInterceptors: [
    (response) => {
      // Modify response
      return response;
    },
  ],
});
```

## Error Handling

```typescript
import { createClient, ErrorShowType } from '@gvray/request';

const client = createClient({
  errorConfig: {
    errorHandler: (error, opts, feedBack) => {
      feedBack?.({
        showType: ErrorShowType.ERROR_MESSAGE,
        errorType: 'BizError',
        message: error.message,
      });
    },
    errorFeedBack: (errorInfo) => {
      // Display error to user (toast, notification, etc.)
      console.error(errorInfo.message);
    },
  },
});
```

### Error Show Types

| Type            | Value | Description            |
| --------------- | ----- | ---------------------- |
| `SILENT`        | 0     | No feedback            |
| `WARN_MESSAGE`  | 1     | Warning message        |
| `ERROR_MESSAGE` | 2     | Error message          |
| `NOTIFICATION`  | 3     | Notification popup     |
| `DEFAULT`       | 4     | Default behavior       |
| `REDIRECT`      | 9     | Redirect to error page |

## License

MIT
