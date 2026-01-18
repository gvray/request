import type { IRequestInterceptorAxios } from '../types';

export type TimeoutOptions = {
  // 超时时间（毫秒）
  timeout: number;
  // 超时错误信息
  message?: string;
};

/**
 * 为请求设置超时时间
 * 如果请求配置中已有 timeout，则保留原值
 */
export function timeout(options: TimeoutOptions | number): IRequestInterceptorAxios {
  const config = typeof options === 'number' ? { timeout: options } : options;

  return (requestConfig) => {
    // 如果请求已经设置了 timeout，不覆盖
    if ((requestConfig as any).timeout) {
      return requestConfig as any;
    }

    return {
      ...requestConfig,
      timeout: config.timeout,
      timeoutErrorMessage: config.message,
    } as any;
  };
}

/**
 * 设置默认超时（10秒）
 */
export function defaultTimeout(): IRequestInterceptorAxios {
  return timeout(10000);
}
