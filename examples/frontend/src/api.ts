import { createClient, errorConfig } from '@gvray/request';

// 模拟本地存储的 token（示例演示）
let ACCESS_TOKEN: string | null = null;
let REFRESH_TOKEN: string | null = null;

// 统一创建并导出客户端实例，注册所有拦截器
const client = createClient({
  baseURL: 'http://localhost:4010',
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
        // 避免刷新请求被旧的 Authorization 头干扰：临时清空 token
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
          // 刷新失败，恢复之前的 token（示例场景）
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
};

export default api;
