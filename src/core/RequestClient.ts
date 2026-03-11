import { axiosAdapter, fetchAdapter } from '../adapters';
import type {
  HttpInstance,
  HttpError,
  Engine,
  ErrorConfig,
  HttpRequestInterceptorConfig,
  HttpRequestInterceptor,
  HttpRequestOptions,
  HttpRequestOptionsWithResponse,
  HttpResponseInterceptorConfig,
  HttpResponseInterceptor,
  HttpErrorInterceptor,
  HttpConfig,
  HttpResponse,
  RuntimeRequestConfig,
  HttpOptions,
} from '../types';
import {
  bearerAuth,
  jsonContentType,
  acceptLanguage,
  withCredentials,
  createAuthRefreshInterceptor,
  createRetryInterceptor,
  createLoggingInterceptor,
} from '../interceptor';

function getAdapter(engine: Engine = 'axios') {
  return engine === 'fetch' ? fetchAdapter : axiosAdapter;
}

class RequestClient {
  constructor(options: HttpConfig) {
    const { engine, errorConfig, requestInterceptors, responseInterceptors, ...rest } = options;
    this.engine = engine || 'axios';
    this.requestOptions = rest;
    this.errorConfig = errorConfig || null;
    this.requestInterceptors = requestInterceptors || null;
    this.responseInterceptors = responseInterceptors || null;
    this.getRequestInstance(rest);
  }
  static requestClient: RequestClient | null = null;
  private engine: Engine;
  private requestInstance: HttpInstance | null = null;
  private requestOptions: HttpOptions;
  private errorConfig: ErrorConfig | null = null;
  private requestInterceptors: HttpRequestInterceptorConfig[] | null = null;
  private responseInterceptors: HttpResponseInterceptorConfig[] | null = null;

  static getRequestClient(options: HttpConfig) {
    if (RequestClient.requestClient) return RequestClient.requestClient;
    RequestClient.requestClient = new RequestClient(options);
    return RequestClient.requestClient;
  }
  private getRequestInstance(config: RuntimeRequestConfig) {
    const adapter = getAdapter(this.engine);
    this.requestInstance = adapter.create(config);

    // Auto register built-in interceptors from preset
    const preset = (this.requestOptions as HttpConfig)?.preset;
    // builtinRequestInterceptors 只包含实际的拦截器，不包含工厂函数
    const builtinRequestInterceptors: Array<
      | [HttpRequestInterceptor, HttpErrorInterceptor]
      | [HttpRequestInterceptor]
      | HttpRequestInterceptor
    > = [];
    // builtinResponseInterceptors 只包含实际的拦截器，不包含工厂函数
    const builtinResponseInterceptors: Array<
      | [HttpResponseInterceptor, HttpErrorInterceptor]
      | [HttpResponseInterceptor]
      | HttpResponseInterceptor
    > = [];

    if (preset?.bearerAuth) {
      const { getToken, header, scheme, exclude } = preset.bearerAuth;
      builtinRequestInterceptors.push(bearerAuth(getToken, header, scheme, exclude));
    }
    if (preset?.jsonContentType) {
      builtinRequestInterceptors.push(jsonContentType());
    }
    if (preset?.acceptLanguage) {
      const { getLocale, header } = preset.acceptLanguage;
      builtinRequestInterceptors.push(acceptLanguage(getLocale, header));
    }
    if (preset?.withCredentials) {
      builtinRequestInterceptors.push(withCredentials());
    }
    if (preset?.authRefresh) {
      builtinResponseInterceptors.push(
        createAuthRefreshInterceptor(preset.authRefresh, this.requestInstance!)
      );
    }
    if (preset?.retry) {
      builtinResponseInterceptors.push(createRetryInterceptor(preset.retry, this.requestInstance!));
    }
    if (preset?.logging) {
      const loggingOptions = typeof preset.logging === 'boolean' ? {} : preset.logging;
      const { request, response } = createLoggingInterceptor(loggingOptions);
      builtinRequestInterceptors.push(request);
      builtinResponseInterceptors.push(response);
    }

    // register builtin first, then user interceptors (user can override behaviors by ordering)
    builtinRequestInterceptors.forEach((interceptor) => {
      if (Array.isArray(interceptor)) {
        const [success, fail] = interceptor;
        this.requestInstance?.interceptors.request.use(success, fail);
      } else {
        this.requestInstance?.interceptors.request.use(interceptor);
      }
    });
    builtinResponseInterceptors.forEach((interceptor) => {
      // builtinResponseInterceptors 只包含实际的拦截器，不包含工厂函数
      if (Array.isArray(interceptor)) {
        const [success, fail] = interceptor;
        this.requestInstance?.interceptors.response.use(success, fail);
      } else {
        // 这里的 interceptor 一定是 HttpResponseInterceptor，不是工厂函数
        this.requestInstance?.interceptors.response.use(interceptor as HttpResponseInterceptor);
      }
    });

    this.requestInterceptors?.forEach((interceptor) => {
      // 如果是函数且有一个参数（拦截器工厂函数），调用它并传入 instance
      if (typeof interceptor === 'function' && interceptor.length === 1) {
        const factory = interceptor as (
          instance: HttpInstance
        ) =>
          | [HttpRequestInterceptor, HttpErrorInterceptor]
          | [HttpRequestInterceptor]
          | HttpRequestInterceptor;
        const result = factory(this.requestInstance!);
        if (Array.isArray(result)) {
          const [success, fail] = result;
          this.requestInstance?.interceptors.request.use(success, fail);
        } else {
          this.requestInstance?.interceptors.request.use(result);
        }
      } else if (Array.isArray(interceptor)) {
        const [success, fail] = interceptor;
        return this.requestInstance?.interceptors.request.use(success, fail);
      } else if (typeof interceptor === 'function') {
        // 普通的请求拦截器函数
        return this.requestInstance?.interceptors.request.use(
          interceptor as HttpRequestInterceptor
        );
      }
    });

    this.responseInterceptors?.forEach((interceptor) => {
      // 如果是函数且有一个参数（拦截器工厂函数），调用它并传入 instance
      if (typeof interceptor === 'function' && interceptor.length === 1) {
        const factory = interceptor as (
          instance: HttpInstance
        ) =>
          | [HttpResponseInterceptor, HttpErrorInterceptor]
          | [HttpResponseInterceptor]
          | HttpResponseInterceptor;
        const result = factory(this.requestInstance!);
        if (Array.isArray(result)) {
          const [success, fail] = result;
          this.requestInstance?.interceptors.response.use(success, fail);
        } else {
          this.requestInstance?.interceptors.response.use(result);
        }
      } else if (Array.isArray(interceptor)) {
        const [success, fail] = interceptor;
        this.requestInstance?.interceptors.response.use(success, fail);
      } else if (typeof interceptor === 'function') {
        // 普通的响应拦截器函数
        this.requestInstance?.interceptors.response.use(interceptor as HttpResponseInterceptor);
      }
    });

    // 当响应的数据 success 是 false 的时候，抛出 error 以供 errorHandler 处理。
    this.requestInstance?.interceptors.response.use((response: HttpResponse) => {
      const data = response.data as Record<string, unknown> | undefined;
      if (data?.success === false && this.errorConfig?.errorThrower) {
        this.errorConfig.errorThrower(data);
      }
      return response;
    });

    return this.requestInstance;
  }

  public request<T = unknown>(
    url: string,
    opts: HttpRequestOptionsWithResponse
  ): Promise<HttpResponse<T>>;
  public request<T = unknown>(url: string, opts?: HttpOptions): Promise<T>;
  public request<T = unknown>(url: string, opts?: HttpOptions): Promise<T | HttpResponse<T>> {
    const requestInstance = this.requestInstance;

    if (!requestInstance) throw new Error('Request instance is not initialized');

    const {
      getResponse = false,
      requestInterceptors,
      responseInterceptors,
      // skipErrorHandler 和 skipAuth 通过 opts 对象传递给拦截器，不需要在这里解构
    } = opts || this.requestOptions || {};

    const requestInterceptorsToEject = requestInterceptors?.map((interceptor): number => {
      // 如果是函数且有一个参数（拦截器工厂函数），调用它并传入 instance
      if (typeof interceptor === 'function' && interceptor.length === 1) {
        const factory = interceptor as (
          instance: HttpInstance
        ) =>
          | [HttpRequestInterceptor, HttpErrorInterceptor]
          | [HttpRequestInterceptor]
          | HttpRequestInterceptor;
        const result = factory(requestInstance);
        if (Array.isArray(result)) {
          const [success, fail] = result;
          return requestInstance.interceptors.request.use(success, fail);
        } else {
          return requestInstance.interceptors.request.use(result);
        }
      } else if (Array.isArray(interceptor)) {
        const [success, fail] = interceptor;
        return requestInstance.interceptors.request.use(success, fail);
      } else {
        return requestInstance.interceptors.request.use(interceptor as HttpRequestInterceptor);
      }
    });

    const responseInterceptorsToEject = responseInterceptors?.map((interceptor): number => {
      // 如果是函数且有一个参数（拦截器工厂函数），调用它并传入 instance
      if (typeof interceptor === 'function' && interceptor.length === 1) {
        const factory = interceptor as (
          instance: HttpInstance
        ) =>
          | [HttpResponseInterceptor, HttpErrorInterceptor]
          | [HttpResponseInterceptor]
          | HttpResponseInterceptor;
        const result = factory(requestInstance);
        if (Array.isArray(result)) {
          const [success, fail] = result;
          return requestInstance.interceptors.response.use(success, fail);
        } else {
          return requestInstance.interceptors.response.use(result);
        }
      } else if (Array.isArray(interceptor)) {
        const [success, fail] = interceptor;
        return requestInstance.interceptors.response.use(success, fail);
      } else {
        return requestInstance.interceptors.response.use(interceptor as HttpResponseInterceptor);
      }
    });

    return new Promise<T | HttpResponse<T>>((resolve, reject) => {
      requestInstance
        .request({ ...opts, url })
        .then((res) => {
          requestInterceptorsToEject?.forEach((interceptor) => {
            requestInstance.interceptors.request.eject(interceptor);
          });
          responseInterceptorsToEject?.forEach((interceptor) => {
            requestInstance.interceptors.response.eject(interceptor);
          });
          resolve(getResponse ? (res as HttpResponse<T>) : (res as HttpResponse<T>).data);
        })
        .catch((error: unknown) => {
          requestInterceptorsToEject?.forEach((interceptor) => {
            requestInstance.interceptors.request.eject(interceptor);
          });
          responseInterceptorsToEject?.forEach((interceptor) => {
            requestInstance.interceptors.response.eject(interceptor);
          });
          try {
            const handler = this.errorConfig?.errorHandler;
            const feedBack = this.errorConfig?.errorFeedback;
            if (handler) {
              handler(error as HttpError, opts as HttpRequestOptions, feedBack);
            }
          } catch (e) {
            reject(e);
          }
          reject(error);
        });
    });
  }
}

export default RequestClient;
