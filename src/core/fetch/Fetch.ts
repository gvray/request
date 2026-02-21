/**
 * Fetch — mirrors axios core/Axios class
 * Main class that holds defaults, interceptors, and provides HTTP methods.
 */

import { InterceptorManager } from './InterceptorManager';
import type { InterceptorHandler } from './InterceptorManager';
import { dispatchRequest } from './dispatchRequest';
import { buildFullPath } from './buildFullPath';
import { buildURL } from './buildURL';
import type { FetchRequestConfig, FetchResponse } from './types';
import type { HttpOptions } from '../../types';

export class Fetch {
  defaults: FetchRequestConfig;
  interceptors: {
    request: InterceptorManager<FetchRequestConfig>;
    response: InterceptorManager<FetchResponse>;
  };

  constructor(config: HttpOptions = {}) {
    this.defaults = config as FetchRequestConfig;
    this.interceptors = {
      request: new InterceptorManager<FetchRequestConfig>(),
      response: new InterceptorManager<FetchResponse>(),
    };
  }

  async request<T = unknown, R = FetchResponse<T>>(config: FetchRequestConfig): Promise<R> {
    let currentConfig = { ...config };

    // Apply request interceptors
    const requestHandlers: InterceptorHandler<FetchRequestConfig>[] = [];
    this.interceptors.request.forEach((handler) => {
      requestHandlers.push(handler);
    });

    for (const handler of requestHandlers) {
      try {
        if (handler.fulfilled) {
          currentConfig = await handler.fulfilled(currentConfig);
        }
      } catch (error) {
        if (handler.rejected) {
          await handler.rejected(error);
        }
        throw error;
      }
    }

    // Dispatch the actual request
    let response: FetchResponse<T>;
    try {
      response = await dispatchRequest<T>(currentConfig, this.defaults);
    } catch (error) {
      // Apply response error interceptors
      let handledError: unknown = error;
      const errorHandlers: InterceptorHandler<FetchResponse>[] = [];
      this.interceptors.response.forEach((handler) => {
        errorHandlers.push(handler);
      });

      for (const handler of errorHandlers) {
        if (handler.rejected) {
          try {
            const result = await handler.rejected(handledError);
            if (result && typeof result === 'object' && 'data' in result && 'status' in result) {
              return result as R;
            }
            handledError = result;
          } catch (e) {
            handledError = e;
          }
        }
      }
      throw handledError;
    }

    // Apply response interceptors
    let currentResponse: FetchResponse = response;
    const responseHandlers: InterceptorHandler<FetchResponse>[] = [];
    this.interceptors.response.forEach((handler) => {
      responseHandlers.push(handler);
    });

    for (const handler of responseHandlers) {
      try {
        if (handler.fulfilled) {
          currentResponse = await handler.fulfilled(currentResponse);
        }
      } catch (error) {
        if (handler.rejected) {
          const result = await handler.rejected(error);
          if (result && typeof result === 'object' && 'data' in result && 'status' in result) {
            currentResponse = result as FetchResponse;
            continue;
          }
        }
        throw error;
      }
    }

    return currentResponse as R;
  }

  get<T = unknown, R = FetchResponse<T>>(url: string, config?: FetchRequestConfig): Promise<R> {
    return this.request<T, R>({ ...config, url, method: 'GET' });
  }

  delete<T = unknown, R = FetchResponse<T>>(url: string, config?: FetchRequestConfig): Promise<R> {
    return this.request<T, R>({ ...config, url, method: 'DELETE' });
  }

  head<T = unknown, R = FetchResponse<T>>(url: string, config?: FetchRequestConfig): Promise<R> {
    return this.request<T, R>({ ...config, url, method: 'HEAD' });
  }

  options<T = unknown, R = FetchResponse<T>>(url: string, config?: FetchRequestConfig): Promise<R> {
    return this.request<T, R>({ ...config, url, method: 'OPTIONS' });
  }

  post<T = unknown, R = FetchResponse<T>>(
    url: string,
    data?: unknown,
    config?: FetchRequestConfig
  ): Promise<R> {
    return this.request<T, R>({ ...config, url, method: 'POST', data });
  }

  put<T = unknown, R = FetchResponse<T>>(
    url: string,
    data?: unknown,
    config?: FetchRequestConfig
  ): Promise<R> {
    return this.request<T, R>({ ...config, url, method: 'PUT', data });
  }

  patch<T = unknown, R = FetchResponse<T>>(
    url: string,
    data?: unknown,
    config?: FetchRequestConfig
  ): Promise<R> {
    return this.request<T, R>({ ...config, url, method: 'PATCH', data });
  }

  getUri(config?: FetchRequestConfig): string {
    const merged = { ...this.defaults, ...config };
    const fullPath = buildFullPath(merged.baseURL, merged.url);
    return buildURL(fullPath, merged.params);
  }
}
