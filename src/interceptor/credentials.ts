import type { HttpRequestInterceptor } from '../types';

/**
 * 开启跨域携带 Cookie（配置 withCredentials）
 */
export function withCredentials(): HttpRequestInterceptor {
  return (config) => ({ ...config, withCredentials: true });
}
