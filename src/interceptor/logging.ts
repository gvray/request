import type {
  IRequestInterceptorAxios,
  IErrorInterceptor,
  IResponseInterceptor,
  IRequestOptions,
} from '../types';
import type { AxiosError, AxiosResponse } from 'axios';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

export type LoggingOptions = {
  // 日志级别
  level?: LogLevel;
  // 是否记录请求
  logRequest?: boolean;
  // 是否记录响应
  logResponse?: boolean;
  // 是否记录错误
  logError?: boolean;
  // 是否记录请求体
  logRequestBody?: boolean;
  // 是否记录响应体
  logResponseBody?: boolean;
  // 自定义日志函数
  logger?: {
    debug?: (...args: any[]) => void;
    info?: (...args: any[]) => void;
    warn?: (...args: any[]) => void;
    error?: (...args: any[]) => void;
  };
  // 请求开始时间记录键名
  timestampKey?: string;
};

const defaultLogger = {
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

function shouldLog(currentLevel: LogLevel, targetLevel: LogLevel): boolean {
  const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'none'];
  return levels.indexOf(currentLevel) <= levels.indexOf(targetLevel);
}

/**
 * 创建日志拦截器
 * 记录请求和响应的详细信息
 */
export function createLoggingInterceptor(options: LoggingOptions = {}): {
  request: IRequestInterceptorAxios;
  response: [IResponseInterceptor, IErrorInterceptor];
} {
  const {
    level = 'info',
    logRequest = true,
    logResponse = true,
    logError = true,
    logRequestBody = false,
    logResponseBody = false,
    logger = defaultLogger,
    timestampKey = '_requestStartTime',
  } = options;

  const log = (logLevel: Exclude<LogLevel, 'none'>, ...args: unknown[]) => {
    if (level === 'none' || !shouldLog(level, logLevel)) return;
    const logFn = logger[logLevel] || console.log;
    logFn(...args);
  };

  const requestInterceptor: IRequestInterceptorAxios = (config) => {
    if (logRequest) {
      const method = ((config as any).method || 'GET').toUpperCase();
      const url = (config as any).url || '';

      log('info', `[Request] ${method} ${url}`);

      if (logRequestBody && (config as any).data) {
        log('debug', '[Request Body]', (config as any).data);
      }
    }

    // 记录请求开始时间
    (config as any)[timestampKey] = Date.now();

    return config as any;
  };

  const responseInterceptor: IResponseInterceptor = (response: AxiosResponse) => {
    if (logResponse) {
      const config = response.config as IRequestOptions & { [key: string]: any };
      const method = (config.method || 'GET').toUpperCase();
      const url = config.url || '';
      const status = response.status;
      const startTime = config[timestampKey];
      const duration = startTime ? `${Date.now() - startTime}ms` : 'N/A';

      log('info', `[Response] ${method} ${url} - ${status} (${duration})`);

      if (logResponseBody && response.data) {
        log('debug', '[Response Body]', response.data);
      }
    }

    return response;
  };

  const errorInterceptor: IErrorInterceptor = (error: AxiosError) => {
    if (logError) {
      const config = error.config as IRequestOptions & { [key: string]: any };
      const method = (config?.method || 'GET').toUpperCase();
      const url = config?.url || '';
      const status = error.response?.status || 'N/A';
      const startTime = config?.[timestampKey];
      const duration = startTime ? `${Date.now() - startTime}ms` : 'N/A';

      log('error', `[Error] ${method} ${url} - ${status} (${duration})`);
      log('error', '[Error Details]', error.message);
    }

    return Promise.reject(error);
  };

  return {
    request: requestInterceptor,
    response: [responseInterceptor, errorInterceptor],
  };
}

/**
 * 简单日志拦截器（仅记录基本信息）
 */
export function logging(): {
  request: IRequestInterceptorAxios;
  response: [IResponseInterceptor, IErrorInterceptor];
} {
  return createLoggingInterceptor();
}
