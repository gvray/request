import type { IErrorInterceptor, IResponseInterceptor } from '../types';
import type { AxiosError, AxiosRequestConfig } from 'axios';
import { axiosAdapter } from '../adapters';

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
  retryCondition?: (error: AxiosError) => boolean;
  // 重试回调（可用于日志记录）
  onRetry?: (retryCount: number, error: AxiosError, config: AxiosRequestConfig) => void;
};

const DEFAULT_RETRYABLE_STATUSES = [408, 429, 500, 502, 503, 504];

function isNetworkError(error: AxiosError): boolean {
  return !error.response && Boolean(error.code) && error.code !== 'ECONNABORTED';
}

function isTimeoutError(error: AxiosError): boolean {
  return error.code === 'ECONNABORTED' || error.message?.includes('timeout');
}

function defaultRetryCondition(error: AxiosError, retryableStatuses: number[]): boolean {
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
 */
export function createRetryInterceptor(
  options: RetryOptions = {}
): [IResponseInterceptor, IErrorInterceptor] {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    exponentialBackoff = true,
    retryableStatuses = DEFAULT_RETRYABLE_STATUSES,
    retryCondition,
    onRetry,
  } = options;

  const onResponse: IResponseInterceptor = (response) => response;

  const onError: IErrorInterceptor = async (error: AxiosError) => {
    const config = error.config as AxiosRequestConfig & { _retryCount?: number };

    if (!config) {
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

    return axiosAdapter.request({
      ...config,
      getResponse: true,
    } as any);
  };

  return [onResponse, onError];
}

/**
 * 简单的重试拦截器（使用默认配置）
 */
export function retry(maxRetries = 3): [IResponseInterceptor, IErrorInterceptor] {
  return createRetryInterceptor({ maxRetries });
}
