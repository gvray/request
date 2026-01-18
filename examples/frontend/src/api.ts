import {
  createClient,
  errorConfig,
  axiosAdapter,
  createRetryInterceptor,
  createCacheInterceptor,
  createLoggingInterceptor,
} from '@gvray/request';

// 模拟本地存储的 token（示例演示）
let ACCESS_TOKEN: string | null = null;
let REFRESH_TOKEN: string | null = null;

const BASE_URL = 'http://localhost:4000';

// ============================================
// 主客户端：带认证和基础拦截器
// ============================================
const client = createClient({
  baseURL: BASE_URL,
  timeout: 8000,
  errorConfig: {
    ...errorConfig,
    errorFeedBack: (errorInfo) => {
      console.error('[Request] Error:', errorInfo);
    },
  },
  features: {
    // 注入 Bearer Auth
    bearerAuth: {
      getToken: async () => ACCESS_TOKEN,
      header: 'Authorization',
      scheme: 'Bearer',
    },
    // 刷新令牌逻辑：当 401/403 时刷新并重试
    authRefresh: {
      refreshToken: async () => {
        if (!REFRESH_TOKEN) return null;
        const previous = ACCESS_TOKEN;
        ACCESS_TOKEN = null;
        try {
          const res = await client.request('/api/refresh', {
            method: 'POST',
            data: { refreshToken: REFRESH_TOKEN },
            getResponse: true,
          });
          ACCESS_TOKEN = (res as any).data?.accessToken || null;
          return ACCESS_TOKEN;
        } catch (e) {
          ACCESS_TOKEN = previous;
          throw e;
        }
      },
      setToken: async (token: string) => {
        ACCESS_TOKEN = token;
      },
      getToken: async () => ACCESS_TOKEN,
      statuses: [401, 403],
    },
    // 自动注入 Content-Type: application/json
    jsonContentType: true,
    // 注入 Accept-Language
    acceptLanguage: {
      getLocale: async () => 'zh-CN',
    },
    // 跨域时携带 cookie
    withCredentials: true,
  },
});

// ============================================
// 创建拦截器实例
// ============================================

// 重试拦截器：最多重试3次，指数退避
const retryInterceptors = createRetryInterceptor({
  maxRetries: 3,
  retryDelay: 500,
  exponentialBackoff: true,
  retryCondition: (error) => {
    const status = error.response?.status;
    return status === 503 || status === 502 || status === 500;
  },
  onRetry: (retryCount, error) => {
    console.log(`[Retry] Attempt ${retryCount}, error:`, error.message);
  },
});

// 缓存拦截器：TTL 5秒
const cacheInterceptors = createCacheInterceptor({
  ttl: 5000,
  onCacheHit: (key) => console.log(`[Cache] HIT: ${key}`),
  onCacheMiss: (key) => console.log(`[Cache] MISS: ${key}`),
});

// 日志拦截器
const loggingInterceptors = createLoggingInterceptor({
  logRequest: true,
  logResponse: true,
  logError: true,
  logRequestBody: true,
  logResponseBody: true,
});

// ============================================
// 带重试的 axios 实例
// ============================================
const retryAxios = axiosAdapter.create({ baseURL: BASE_URL, timeout: 10000 });
retryAxios.interceptors.response.use(...retryInterceptors);

// ============================================
// 带缓存的 axios 实例
// ============================================
const cacheAxios = axiosAdapter.create({ baseURL: BASE_URL, timeout: 8000 });
cacheAxios.interceptors.request.use(cacheInterceptors.request);
cacheAxios.interceptors.response.use(...cacheInterceptors.response);

// ============================================
// 带日志的 axios 实例
// ============================================
const loggingAxios = axiosAdapter.create({ baseURL: BASE_URL, timeout: 8000 });
loggingAxios.interceptors.request.use(loggingInterceptors.request);
loggingAxios.interceptors.response.use(...loggingInterceptors.response);

// 集中管理 API 接口定义
export const api = {
  // 登录：返回并设置本地存储的令牌
  login: async (username = 'demo', password = 'pass') => {
    const res = await client.request('/api/login', {
      method: 'POST',
      data: { username, password },
    });
    ACCESS_TOKEN = (res as any)?.accessToken || null;
    REFRESH_TOKEN = (res as any)?.refreshToken || null;
    return { accessToken: ACCESS_TOKEN, refreshToken: REFRESH_TOKEN };
  },
  // 受保护接口（需要 Authorization）
  protected: () => client.request('/api/protected', { method: 'GET' }),
  // 语言演示
  lang: () => client.request('/api/lang', { method: 'GET' }),
  // Cookie 跨域演示
  cookieSet: () => client.request('/api/cookie-set', { method: 'GET' }),
  cookieRead: () => client.request('/api/cookie-read', { method: 'GET' }),
  // 常规示例
  ping: () => client.request('/api/ping', { method: 'GET' }),
  users: () => client.request('/api/users', { method: 'GET' }),
  echo: (data: any) => client.request('/api/echo', { method: 'POST', data }),
  slow: (timeout = 500) => client.request('/api/slow', { method: 'GET', timeout }),
  notFound: () => client.request('/api/not-found', { method: 'GET' }),
  error: () => client.request('/api/error', { method: 'GET' }),
  // 工具方法
  expireToken: () => {
    ACCESS_TOKEN = 'expired-token';
    return ACCESS_TOKEN;
  },
  getTokens: () => ({ accessToken: ACCESS_TOKEN, refreshToken: REFRESH_TOKEN }),

  // ============================================
  // Retry 演示
  // ============================================
  retryReset: () => retryAxios.post('/api/unstable/reset'),
  retrySuccess: () => retryAxios.get('/api/unstable?failTimes=2'),
  retryFail: () => retryAxios.get('/api/unstable?failTimes=5'),

  // ============================================
  // Timeout 演示
  // ============================================
  timeoutOk: () => client.request('/api/delay/500', { method: 'GET', timeout: 2000 }),
  timeoutFail: () => client.request('/api/delay/3000', { method: 'GET', timeout: 1000 }),

  // ============================================
  // Cache 演示
  // ============================================
  cacheTimestamp: () => cacheAxios.get('/api/timestamp'),
  cacheData1: () => cacheAxios.get('/api/data/1'),
  cacheData2: () => cacheAxios.get('/api/data/2'),
  cacheNoCache: () => cacheAxios.get('/api/timestamp', { params: { noCache: true } }),

  // ============================================
  // Logging 演示
  // ============================================
  logGet: () => loggingAxios.get('/api/headers'),
  logPost: () => loggingAxios.post('/api/log-test', { message: 'Hello', timestamp: Date.now() }),
};

export default api;
