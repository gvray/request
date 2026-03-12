import type { GvrayRequestInterceptor } from '../types';

/**
 * 开启跨域携带 Cookie（配置 withCredentials）
 */
export function withCredentials(): GvrayRequestInterceptor {
  return (config) => ({ ...config, withCredentials: true });
}
