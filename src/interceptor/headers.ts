import type { HttpInterceptor } from '../types';
import type { StringProvider } from './auth';

/**
 * 为非 GET/HEAD 请求自动注入 Content-Type: application/json（若未显式设置）
 */
export function jsonContentType(): HttpInterceptor {
  return (config) => {
    const method = String(config.method || 'GET').toUpperCase();
    const needBody = method !== 'GET' && method !== 'HEAD';
    const headers: Record<string, string> = { ...(config.headers || {}) };
    if (needBody && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    return { ...config, headers };
  };
}

/**
 * 注入多语言头部，如 Accept-Language: zh-CN
 */
export function acceptLanguage(
  getLocale: StringProvider,
  header = 'Accept-Language'
): HttpInterceptor {
  return async (config) => {
    const locale = await getLocale();
    if (locale) {
      const headers: Record<string, string> = { ...(config.headers || {}) };
      headers[header] = String(locale);
      return { ...config, headers };
    }
    return config;
  };
}
