import type {
  ErrorConfig,
  HttpAdapter,
  InterceptorPair,
  RequestConfig,
  RequestOptions,
  RequestOptionsWithResponse,
  RequestOptionsWithoutResponse,
  RequestInterceptor,
  UnifiedResponse,
} from './types';

import { fetchAdapter } from './adapters/FetchAdapter';
import { axiosAdapter } from './adapters/AxiosAdapter';

export type AdapterName = 'fetch' | 'axios';

export interface CreateClientOptions<T = any> extends RequestConfig<T> {
  adapter?: AdapterName | HttpAdapter;
}

class InterceptorManager<T> {
  private handlers: Array<InterceptorPair<T> | ((arg: T) => Promise<T> | T) | undefined> = [];
  use(handler: InterceptorPair<T> | ((arg: T) => Promise<T> | T)) {
    this.handlers.push(handler);
    return this.handlers.length - 1;
  }
  eject(id: number) {
    if (this.handlers[id] !== undefined) this.handlers[id] = undefined;
  }
  async run(initial: T): Promise<T> {
    let current = initial;
    for (const h of this.handlers) {
      if (!h) continue;
      if (Array.isArray(h)) {
        try {
          current = (await h[0](current)) as T;
        } catch (err) {
          if (h[1]) h[1](err);
          throw err;
        }
      } else {
        current = (await h(current)) as T;
      }
    }
    return current;
  }
}

class RequestInterceptorManager {
  private handlers: Array<RequestInterceptor | InterceptorPair<RequestOptions> | undefined> = [];
  use(handler: RequestInterceptor | InterceptorPair<RequestOptions>) {
    this.handlers.push(handler);
    return this.handlers.length - 1;
  }
  eject(id: number) {
    if (this.handlers[id] !== undefined) this.handlers[id] = undefined;
  }
  async run(
    url: string,
    options: RequestOptions
  ): Promise<{ url: string; options: RequestOptions }> {
    let currentUrl = url;
    let currentOptions = options;
    for (const h of this.handlers) {
      if (!h) continue;
      if (Array.isArray(h)) {
        try {
          currentOptions = (await h[0](currentOptions)) as RequestOptions;
        } catch (err) {
          if (h[1]) h[1](err);
          throw err;
        }
      } else {
        // function signature: (config) or (url, config)
        const maybeTwoArgs = h as (
          url: string,
          config: RequestOptions
        ) =>
          | Promise<{ url: string; options: RequestOptions }>
          | { url: string; options: RequestOptions };
        const maybeOneArg = h as (
          config: RequestOptions
        ) => Promise<RequestOptions> | RequestOptions;

        // heuristics: check if handler expects two args by inspecting toString (not reliable) is avoided; instead we try calling with two args and fallback
        try {
          const result = (await maybeTwoArgs(currentUrl || '', currentOptions)) as {
            url: string;
            options: RequestOptions;
          };
          if (result && typeof result === 'object' && 'url' in result && 'options' in result) {
            currentUrl = result.url;
            currentOptions = result.options;
          } else {
            currentOptions = (await maybeOneArg(currentOptions)) as RequestOptions;
          }
        } catch (_) {
          currentOptions = (await maybeOneArg(currentOptions)) as RequestOptions;
        }
      }
    }
    return { url: currentUrl, options: currentOptions };
  }
}

export class UniRequestClient<T = any> {
  private adapter: HttpAdapter;
  private requestInterceptors = new RequestInterceptorManager();
  private responseInterceptors = new InterceptorManager<UnifiedResponse<any>>();
  private errorConfig?: ErrorConfig<T>;
  private baseURL?: string;
  private timeout?: number;

  constructor(options: CreateClientOptions<T> = {}) {
    if (options.errorConfig !== undefined) this.errorConfig = options.errorConfig;
    if (options.baseURL !== undefined) this.baseURL = options.baseURL;
    if (options.timeout !== undefined) this.timeout = options.timeout;

    if (typeof options.adapter === 'object' && options.adapter) {
      this.adapter = options.adapter;
    } else {
      const name = (options.adapter || 'fetch') as AdapterName;
      this.adapter = name === 'axios' ? axiosAdapter : fetchAdapter;
    }

    options.requestInterceptors?.forEach((i) => this.requestInterceptors.use(i));
    options.responseInterceptors?.forEach((i) => this.responseInterceptors.use(i));
  }

  useRequestInterceptor(i: InterceptorPair<RequestOptions> | RequestInterceptor) {
    return this.requestInterceptors.use(i);
  }

  useResponseInterceptor(
    i:
      | InterceptorPair<UnifiedResponse<any>>
      | ((res: UnifiedResponse<any>) => Promise<UnifiedResponse<any>> | UnifiedResponse<any>)
  ) {
    return this.responseInterceptors.use(i as any);
  }

  ejectRequestInterceptor(id: number) {
    this.requestInterceptors.eject(id);
  }
  ejectResponseInterceptor(id: number) {
    this.responseInterceptors.eject(id);
  }

  private async handleError(error: unknown, opts: RequestOptions) {
    if (opts.skipErrorHandler) return;
    try {
      this.errorConfig?.errorHandler?.(error as any, opts);
    } catch (e) {
      // rethrow custom handler errors letting caller catch
      throw e;
    }
  }

  async request<U = any>(
    url: string,
    opts: RequestOptionsWithResponse
  ): Promise<UnifiedResponse<U>>;
  async request<U = any>(url: string, opts: RequestOptionsWithoutResponse): Promise<U>;
  async request<U = any>(url: string, opts?: RequestOptions): Promise<U>;
  async request<U = any>(
    url: string,
    opts: RequestOptions = { method: 'GET' }
  ): Promise<U | UnifiedResponse<U>> {
    const merged: RequestOptions = { ...opts };
    const baseURL = opts.baseURL !== undefined ? opts.baseURL : this.baseURL;
    const timeout = opts.timeout !== undefined ? opts.timeout : this.timeout;
    if (baseURL !== undefined) merged.baseURL = baseURL;
    if (timeout !== undefined) merged.timeout = timeout;

    // attach per-call interceptors (and collect ids for eject)
    const reqIds: number[] = [];
    const resIds: number[] = [];
    opts.requestInterceptors?.forEach((i) => reqIds.push(this.requestInterceptors.use(i)));
    opts.responseInterceptors?.forEach((i) => resIds.push(this.responseInterceptors.use(i as any)));

    try {
      // request interceptors can mutate url/options or both
      const processed = await this.requestInterceptors.run(url, merged);
      const res = await this.adapter.request<U>(processed.url, processed.options);

      // thrower hook
      if ((res as any)?.data?.success === false && this.errorConfig?.errorThrower) {
        this.errorConfig.errorThrower(res.data as any);
      }

      const finalRes = await this.responseInterceptors.run(res as UnifiedResponse<any>);
      return (opts.getResponse ? (finalRes as UnifiedResponse<U>) : (finalRes.data as U)) as any;
    } catch (error) {
      await this.handleError(error, merged);
      throw error;
    } finally {
      // eject one-off interceptors
      reqIds.forEach((id) => this.requestInterceptors.eject(id));
      resIds.forEach((id) => this.responseInterceptors.eject(id));
    }
  }
}

export type IRequest = {
  <T = any>(url: string, opts: RequestOptionsWithResponse): Promise<UnifiedResponse<T>>;
  <T = any>(url: string, opts: RequestOptionsWithoutResponse): Promise<T>;
  <T = any>(url: string, opts?: RequestOptions): Promise<T>;
  <T = any>(url: string): Promise<T>;
};

export const createClient = <T = any>(options: CreateClientOptions<T> = {}) =>
  new UniRequestClient<T>(options);
