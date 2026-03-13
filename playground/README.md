# 🎯 @gvray/request Playground

Interactive demo application showcasing all features and interceptors of `@gvray/request` with dual-engine architecture.

## ✨ Features

### � Dual Engine Support

Switch seamlessly between **Axios** and **Fetch** engines with the same API:

- **Axios Engine** - Battle-tested HTTP client with extensive features
- **Fetch Engine** - Native browser API with modern performance

### 🎨 Interactive Demos

Each feature includes live, interactive examples with real API calls:

- **Overview** - Quick start with all interceptors
- **Basic** - Simple HTTP operations (GET, POST, PUT, DELETE)
- **Auth** - Bearer token authentication
- **Auth Refresh** - Automatic token refresh on 401/403
- **Retry** - Smart retry with exponential backoff
- **Timeout** - Request timeout control
- **Cache** - Response caching with TTL
- **Logging** - Request/response logging

## 🚀 Quick Start

```bash
# From root directory
pnpm play

# Or from playground directory
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to explore the interactive demos.

## � Project Structure

```
playground/
├── app/
│   ├── page.tsx              # Landing page with engine selection
│   ├── axios/                # Axios engine demos
│   │   ├── overview/         # Overview page
│   │   ├── basic/            # Basic requests
│   │   ├── auth/             # Authentication
│   │   ├── auth-refresh/     # Token refresh
│   │   ├── retry/            # Retry logic
│   │   ├── timeout/          # Timeout control
│   │   ├── cache/            # Response caching
│   │   └── logging/          # Request logging
│   ├── fetch/                # Fetch engine demos (same structure)
│   └── api/                  # Mock API routes
├── lib/
│   └── clients.ts            # Pre-configured request instances
└── components/
    └── ui.tsx                # Shared UI components
```

## 🎯 Navigation

The playground uses a two-level tab navigation:

1. **Engine Level** - Switch between Axios and Fetch engines
2. **Feature Level** - Navigate between different interceptor demos

Click the `@gvray/request` logo to return to the landing page.

## 🛠 Tech Stack

- **Next.js 16** - React framework with App Router
- **React 19** - Latest React with Server Components
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **@gvray/request** - Universal HTTP client

## � Key Concepts

### Engine Switching

```typescript
// Axios engine (default)
const axiosClient = createRequest({
  engine: 'axios',
  baseURL: '/api',
});

// Fetch engine
const fetchClient = createRequest({
  engine: 'fetch',
  baseURL: '/api',
});
```

### Interceptor Presets

All interceptors work identically across both engines:

```typescript
const client = createRequest({
  engine: 'axios', // or 'fetch'
  preset: {
    bearerAuth: { getToken: () => token },
    responseAuthRefresh: { refreshToken, setToken },
    retry: { maxRetries: 3 },
  },
});
```

## 🔗 Links

- [Main Documentation](../../README.md)
- [API Reference](../../docs/api.md)
- [Next.js Docs](https://nextjs.org/docs)

## 📝 Notes

- All API routes are mocked for demonstration purposes
- Token storage uses `localStorage` (client-side only)
- Check browser console for detailed interceptor logs
