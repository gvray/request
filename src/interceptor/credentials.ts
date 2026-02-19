import type { HttpInterceptor } from '../types';

/**
 * 开启跨域携带 Cookie（配置 withCredentials）
 */
export function withCredentials(): HttpInterceptor {
  return (config) => ({ ...config, withCredentials: true });
}
