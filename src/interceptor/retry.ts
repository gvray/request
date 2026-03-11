import type {
  HttpErrorInterceptor,
  HttpResponseInterceptor,
  HttpError,
  HttpOptions,
  HttpInstance,
} from '../types';

export type RetryOptions = {
  // 最大重试次数（默认 3）
  maxRetries?: number;
  // 重试延迟基数（毫秒，默认 1000）
  retryDelay?: number;
  // 是否使用指数退避（默认 true）
  exponentialBackoff?: boolean;
  // 需要重试的状态码（默认 [408, 429, 500, 502, 503, 504]）
  retryableStatuses?: number[];
  // 需要重试的错误类型（默认网络错误和超时）
  retryCondition?: (error: HttpError) => boolean;
  // 重试回调（可用于日志记录）
  onRetry?: (retryCount: number, error: HttpError, config: HttpOptions) => void;
};

const DEFAULT_RETRYABLE_STATUSES = [408, 429, 500, 502, 503, 504];

function isNetworkError(error: HttpError): boolean {
  return !error.response && Boolean(error.code) && error.code !== 'ECONNABORTED';
}

function isTimeoutError(error: HttpError): boolean {
  return error.code === 'ECONNABORTED' || error.message?.includes('timeout');
}

function defaultRetryCondition(error: HttpError, retryableStatuses: number[]): boolean {
  if (isNetworkError(error) || isTimeoutError(error)) {
    return true;
  }
  const status = error.response?.status;
  return status ? retryableStatuses.includes(status) : false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 创建请求重试拦截器
 * 在请求失败时根据配置自动重试
 *
 * 使用方式：
 * 1. 通过 Preset（推荐）：preset: { retry: { ... } }
 * 2. 手动配置：createRetryInterceptor(options, instance)
 */
// 重载 1：只传 options，返回一个接受 instance 的函数（用于手动配置）
export function createRetryInterceptor(
  options?: RetryOptions
): (instance: HttpInstance) => [HttpResponseInterceptor, HttpErrorInterceptor];
// 重载 2：传 options 和 instance，直接返回拦截器（用于 Preset）
export function createRetryInterceptor(
  options: RetryOptions | undefined,
  instance: HttpInstance
): [HttpResponseInterceptor, HttpErrorInterceptor];
// 实现
export function createRetryInterceptor(
  options?: RetryOptions,
  instance?: HttpInstance
):
  | [HttpResponseInterceptor, HttpErrorInterceptor]
  | ((instance: HttpInstance) => [HttpResponseInterceptor, HttpErrorInterceptor]) {
  if (instance) {
    // 重载 2：createRetryInterceptor(options, instance)
    return createRetryInterceptorImpl(options || {}, instance);
  } else {
    // 重载 1：createRetryInterceptor(options)
    return (instance: HttpInstance) => createRetryInterceptorImpl(options || {}, instance);
  }
}

// 实际的拦截器实现
function createRetryInterceptorImpl(
  options: RetryOptions = {},
  instance: HttpInstance
): [HttpResponseInterceptor, HttpErrorInterceptor] {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    exponentialBackoff = true,
    retryableStatuses = DEFAULT_RETRYABLE_STATUSES,
    retryCondition,
    onRetry,
  } = options;

  const onResponse: HttpResponseInterceptor = (response) => response;

  const onError: HttpErrorInterceptor = async (err: unknown) => {
    const error = err as HttpError;
    const config = (error.config || {}) as HttpOptions & { _retryCount?: number };

    if (!error.config) {
      return Promise.reject(error);
    }

    config._retryCount = config._retryCount || 0;

    // 检查是否应该重试
    const shouldRetry = retryCondition
      ? retryCondition(error)
      : defaultRetryCondition(error, retryableStatuses);

    if (!shouldRetry || config._retryCount >= maxRetries) {
      return Promise.reject(error);
    }

    config._retryCount += 1;

    // 计算延迟时间
    const delay = exponentialBackoff
      ? retryDelay * Math.pow(2, config._retryCount - 1)
      : retryDelay;

    // 触发回调
    if (onRetry) {
      onRetry(config._retryCount, error, config);
    }

    await sleep(delay);

    // Retry through the engine instance (respects engine choice and interceptor chain)
    return instance.request(config);
  };

  return [onResponse, onError];
}

/**
 * 简化的重试拦截器（使用默认配置）
 */
export function retry(
  maxRetries = 3
): (instance: HttpInstance) => [HttpResponseInterceptor, HttpErrorInterceptor] {
  return createRetryInterceptor({ maxRetries });
}
