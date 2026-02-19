import type { HttpInterceptor } from '../types';

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
export function timeout(options: TimeoutOptions | number): HttpInterceptor {
  const config = typeof options === 'number' ? { timeout: options } : options;

  return (requestConfig) => {
    // 如果请求已经设置了 timeout，不覆盖
    if (requestConfig.timeout) {
      return requestConfig;
    }

    return {
      ...requestConfig,
      timeout: config.timeout,
      timeoutErrorMessage: config.message,
    };
  };
}

/**
 * 设置默认超时（60秒）
 */
export function defaultTimeout(): HttpInterceptor {
  return timeout({ timeout: 60000, message: '请求超时' });
}
