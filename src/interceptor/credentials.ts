import type { GvrayRequestInterceptor } from '../types';

/**
 * 开启跨域携带 Cookie（配置 withCredentials）
 */
export function requestWithCredentials(): GvrayRequestInterceptor {
  return (config) => ({ ...config, withCredentials: true });
}
