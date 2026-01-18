import { Adapter } from '@/adapters/Adapter';
import type { RequestOptions } from '../../types';

// Axios 兼容的响应结构
export interface FetchResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestOptions;
}

// Axios 兼容的错误结构
export interface FetchError extends Error {
  config?: RequestOptions;
  code?: string;
  request?: { url: string; init: RequestInit };
  response?: {
    status: number;
    statusText: string;
    data: any;
    headers: Record<string, string>;
  };
  isAxiosError?: boolean;
}

// 拦截器管理器
class InterceptorManager<T> {
  private handlers: Array<{ fulfilled?: (value: T) => T | Promise<T>; rejected?: (error: any) => any } | null> = [];

  use(fulfilled?: (value: T) => T | Promise<T>, rejected?: (error: any) => any): number {
    const handler: { fulfilled?: (value: T) => T | Promise<T>; rejected?: (error: any) => any } = {};
    if (fulfilled) handler.fulfilled = fulfilled;
    if (rejected) handler.rejected = rejected;
    this.handlers.push(handler);
    return this.handlers.length - 1;
  }

  eject(id: number): void {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }

  forEach(fn: (handler: { fulfilled?: (value: T) => T | Promise<T>; rejected?: (error: any) => any }) => void): void {
    this.handlers.forEach((handler) => {
      if (handler !== null) {
        fn(handler);
      }
    });
  }

  clear(): void {
    this.handlers = [];
  }
}

// Fetch 实例类型（与 AxiosInstance 兼容的接口）
export interface FetchInstance {
  (config: RequestOptions): Promise<any>;
  request<T = any>(config: RequestOptions): Promise<FetchResponse<T>>;
  get<T = any>(url: string, config?: RequestOptions): Promise<FetchResponse<T>>;
  delete<T = any>(url: string, config?: RequestOptions): Promise<FetchResponse<T>>;
  head<T = any>(url: string, config?: RequestOptions): Promise<FetchResponse<T>>;
  options<T = any>(url: string, config?: RequestOptions): Promise<FetchResponse<T>>;
  post<T = any>(url: string, data?: any, config?: RequestOptions): Promise<FetchResponse<T>>;
  put<T = any>(url: string, data?: any, config?: RequestOptions): Promise<FetchResponse<T>>;
  patch<T = any>(url: string, data?: any, config?: RequestOptions): Promise<FetchResponse<T>>;
  interceptors: {
    request: InterceptorManager<RequestOptions>;
    response: InterceptorManager<FetchResponse>;
  };
  defaults: RequestOptions;
}

function createFetchInstance(defaultConfig: RequestOptions = {}): FetchInstance {
  const requestInterceptors = new InterceptorManager<RequestOptions>();
  const responseInterceptors = new InterceptorManager<FetchResponse>();

  function buildUrl(options: RequestOptions, defaults: RequestOptions): string {
    const baseURL = options.baseURL || defaults.baseURL || '';
    const url = `${baseURL}${options.url || ''}`;
    const params = options.params || {};
    const usp = new URLSearchParams();
    Object.entries(params as Record<string, any>).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      if (Array.isArray(v)) {
        v.forEach((item) => usp.append(k, String(item)));
      } else {
        usp.append(k, String(v));
      }
    });
    const qs = usp.toString();
    return qs ? `${url}${url.includes('?') ? '&' : '?'}${qs}` : url;
  }

  function headersToObject(headers: Headers): Record<string, string> {
    const obj: Record<string, string> = {};
    headers.forEach((v, k) => {
      obj[k] = v;
    });
    return obj;
  }

  async function safeJson(res: Response): Promise<any> {
    try {
      return await res.clone().json();
    } catch {
      try {
        return await res.clone().text();
      } catch {
        return null;
      }
    }
  }

  function toFetchInit(options: RequestOptions, defaults: RequestOptions): RequestInit {
    const method = (options.method || 'GET').toUpperCase();
    const headers: Record<string, string> = {
      ...((defaults.headers as Record<string, string>) || {}),
      ...((options.headers as Record<string, string>) || {}),
    };
    let body: BodyInit | null = null;
    const data = options.data as any;
    if (data !== undefined && data !== null && method !== 'GET' && method !== 'HEAD') {
      if (typeof data === 'string' || data instanceof Blob || data instanceof FormData) {
        body = data as BodyInit;
      } else {
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
        body = JSON.stringify(data);
      }
    }

    const init: RequestInit = { method, headers, body };

    if ((options as any).withCredentials) {
      init.credentials = 'include';
    }

    const timeout = (options as any).timeout || (defaults as any).timeout;
    if (typeof timeout === 'number' && timeout > 0) {
      const controller = new AbortController();
      init.signal = controller.signal;
      setTimeout(() => controller.abort(), timeout);
    }

    return init;
  }

  async function parseResponse<T>(res: Response, config: RequestOptions): Promise<FetchResponse<T>> {
    const responseType = (config as any).responseType || 'json';
    let data: any;

    try {
      if (responseType === 'text') {
        data = await res.text();
      } else if (responseType === 'blob') {
        data = await res.blob();
      } else if (responseType === 'arraybuffer') {
        data = await res.arrayBuffer();
      } else {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          data = await res.json();
        } else {
          data = await res.text();
        }
      }
    } catch {
      data = null;
    }

    return {
      data,
      status: res.status,
      statusText: res.statusText,
      headers: headersToObject(res.headers),
      config,
    };
  }

  async function dispatchRequest<T>(config: RequestOptions): Promise<FetchResponse<T>> {
    const mergedConfig = { ...defaultConfig, ...config };
    const url = buildUrl(mergedConfig, defaultConfig);
    const init = toFetchInit(mergedConfig, defaultConfig);

    let res: Response;
    try {
      res = await fetch(url, init);
    } catch (e: any) {
      const error: FetchError = new Error(e.message || 'Network Error');
      error.config = mergedConfig;
      error.code = e.name === 'AbortError' ? 'ECONNABORTED' : 'ERR_NETWORK';
      error.request = { url, init };
      error.isAxiosError = true;
      throw error;
    }

    if (!res.ok) {
      const error: FetchError = new Error(res.statusText || `Request failed with status ${res.status}`);
      error.config = mergedConfig;
      error.response = {
        status: res.status,
        statusText: res.statusText,
        data: await safeJson(res),
        headers: headersToObject(res.headers),
      };
      error.request = { url, init };
      error.isAxiosError = true;
      throw error;
    }

    return parseResponse<T>(res, mergedConfig);
  }

  async function request<T = any>(config: RequestOptions): Promise<FetchResponse<T>> {
    // 构建请求拦截器链
    let currentConfig = { ...config };

    // 应用请求拦截器
    const requestChain: Array<{ fulfilled?: (c: RequestOptions) => RequestOptions | Promise<RequestOptions>; rejected?: (e: any) => any }> = [];
    requestInterceptors.forEach((interceptor) => {
      requestChain.push(interceptor);
    });

    for (const interceptor of requestChain) {
      try {
        if (interceptor.fulfilled) {
          currentConfig = await interceptor.fulfilled(currentConfig);
        }
      } catch (error) {
        if (interceptor.rejected) {
          await interceptor.rejected(error);
        }
        throw error;
      }
    }

    // 执行请求
    let response: FetchResponse<T>;
    try {
      response = await dispatchRequest<T>(currentConfig);
    } catch (error) {
      // 应用响应错误拦截器
      let handledError = error;
      const responseChain: Array<{ fulfilled?: (r: FetchResponse) => FetchResponse | Promise<FetchResponse>; rejected?: (e: any) => any }> = [];
      responseInterceptors.forEach((interceptor) => {
        responseChain.push(interceptor);
      });

      for (const interceptor of responseChain) {
        if (interceptor.rejected) {
          try {
            const result = await interceptor.rejected(handledError);
            if (result && result.data !== undefined) {
              return result as FetchResponse<T>;
            }
            handledError = result;
          } catch (e) {
            handledError = e;
          }
        }
      }
      throw handledError;
    }

    // 应用响应拦截器
    let currentResponse = response;
    const responseChain: Array<{ fulfilled?: (r: FetchResponse) => FetchResponse | Promise<FetchResponse>; rejected?: (e: any) => any }> = [];
    responseInterceptors.forEach((interceptor) => {
      responseChain.push(interceptor);
    });

    for (const interceptor of responseChain) {
      try {
        if (interceptor.fulfilled) {
          currentResponse = await interceptor.fulfilled(currentResponse as any);
        }
      } catch (error) {
        if (interceptor.rejected) {
          const result = await interceptor.rejected(error);
          if (result && result.data !== undefined) {
            currentResponse = result;
            continue;
          }
        }
        throw error;
      }
    }

    return currentResponse as FetchResponse<T>;
  }

  // 创建实例函数
  const instance = function (config: RequestOptions) {
    return request(config);
  } as FetchInstance;

  instance.request = request;
  instance.get = <T = any>(url: string, config?: RequestOptions) => request<T>({ ...config, url, method: 'GET' });
  instance.delete = <T = any>(url: string, config?: RequestOptions) => request<T>({ ...config, url, method: 'DELETE' });
  instance.head = <T = any>(url: string, config?: RequestOptions) => request<T>({ ...config, url, method: 'HEAD' });
  instance.options = <T = any>(url: string, config?: RequestOptions) => request<T>({ ...config, url, method: 'OPTIONS' });
  instance.post = <T = any>(url: string, data?: any, config?: RequestOptions) => request<T>({ ...config, url, method: 'POST', data });
  instance.put = <T = any>(url: string, data?: any, config?: RequestOptions) => request<T>({ ...config, url, method: 'PUT', data });
  instance.patch = <T = any>(url: string, data?: any, config?: RequestOptions) => request<T>({ ...config, url, method: 'PATCH', data });

  instance.interceptors = {
    request: requestInterceptors,
    response: responseInterceptors,
  };

  instance.defaults = defaultConfig;

  return instance;
}

export class FetchAdapter extends Adapter {
  private instance: FetchInstance | null = null;
  private defaultConfig: RequestOptions = {};

  create<T = any>(options: RequestOptions): T {
    this.defaultConfig = options;
    this.instance = createFetchInstance(options);
    return this.instance as unknown as T;
  }

  private ensureInstance(): FetchInstance {
    if (this.instance) return this.instance;
    this.instance = createFetchInstance(this.defaultConfig);
    return this.instance;
  }

  async request<T = any>(options: RequestOptions): Promise<T> {
    const inst = this.ensureInstance();
    const res = await inst.request<T>(options);
    return options?.getResponse ? (res as unknown as T) : (res.data as T);
  }

  get<T = any>(options: RequestOptions = {} as RequestOptions): Promise<T> {
    return this.request<T>({ ...options, method: 'GET' });
  }

  delete<T = any>(options: RequestOptions = {} as RequestOptions): Promise<T> {
    return this.request<T>({ ...options, method: 'DELETE' });
  }

  head<T = any>(options: RequestOptions = {} as RequestOptions): Promise<T> {
    return this.request<T>({ ...options, method: 'HEAD' });
  }

  options<T = any>(options: RequestOptions = {} as RequestOptions): Promise<T> {
    return this.request<T>({ ...options, method: 'OPTIONS' });
  }

  post<T = any>(options: RequestOptions = {} as RequestOptions): Promise<T> {
    return this.request<T>({ ...options, method: 'POST' });
  }

  put<T = any>(options: RequestOptions = {} as RequestOptions): Promise<T> {
    return this.request<T>({ ...options, method: 'PUT' });
  }

  patch<T = any>(options: RequestOptions = {} as RequestOptions): Promise<T> {
    return this.request<T>({ ...options, method: 'PATCH' });
  }
}

export const fetchAdapter = new FetchAdapter();
export { createFetchInstance };
