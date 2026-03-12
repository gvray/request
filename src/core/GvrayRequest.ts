import type {
  GvrayInstance,
  GvrayError,
  Engine,
  ErrorConfig,
  GvrayRequestInterceptorConfig,
  GvrayRequestInterceptor,
  GvrayRequestConfig,
  GvrayRequestConfigWithResponse,
  GvrayResponseInterceptorConfig,
  GvrayResponseInterceptor,
  GvrayErrorInterceptor,
  GvrayConfig,
  GvrayResponse,
  GvrayOptions,
} from '../types';
import {
  requestBearerAuth,
  requestJsonContentType,
  requestAcceptLanguage,
  requestWithCredentials,
  requestAuthRefresh,
  createResponseAuthRefresh,
  createResponseRetry,
  createLoggingInterceptor,
} from '../interceptor';
import {
  getAdapter,
  registerRequestInterceptor,
  registerResponseInterceptor,
} from './gvrayRequestHelpers';

class GvrayRequest {
  constructor(options: GvrayConfig) {
    const { engine, errorConfig, requestInterceptors, responseInterceptors, ...rest } = options;
    this.engine = engine || 'axios';
    this.requestOptions = rest;
    this.errorConfig = errorConfig || null;
    this.requestInterceptors = requestInterceptors || null;
    this.responseInterceptors = responseInterceptors || null;
    this.getRequestInstance(rest);
  }
  static requestClient: GvrayRequest | null = null;
  private engine: Engine;
  private requestInstance: GvrayInstance | null = null;
  private requestOptions: GvrayOptions;
  private errorConfig: ErrorConfig | null = null;
  private requestInterceptors: GvrayRequestInterceptorConfig[] | null = null;
  private responseInterceptors: GvrayResponseInterceptorConfig[] | null = null;

  static getRequestClient(options: GvrayConfig) {
    if (GvrayRequest.requestClient) return GvrayRequest.requestClient;
    GvrayRequest.requestClient = new GvrayRequest(options);
    return GvrayRequest.requestClient;
  }
  private getRequestInstance(config: GvrayRequestConfig) {
    const adapter = getAdapter(this.engine);
    this.requestInstance = adapter.create(config);

    // Auto register built-in interceptors from preset
    const preset = (this.requestOptions as GvrayConfig)?.preset;
    // builtinRequestInterceptors 只包含实际的拦截器，不包含工厂函数
    const builtinRequestInterceptors: Array<
      | [GvrayRequestInterceptor, GvrayErrorInterceptor]
      | [GvrayRequestInterceptor]
      | GvrayRequestInterceptor
    > = [];
    // builtinResponseInterceptors 只包含实际的拦截器，不包含工厂函数
    const builtinResponseInterceptors: Array<
      | [GvrayResponseInterceptor, GvrayErrorInterceptor]
      | [GvrayResponseInterceptor]
      | GvrayResponseInterceptor
    > = [];

    if (preset?.bearerAuth) {
      const { getToken, header, scheme, exclude } = preset.bearerAuth;
      builtinRequestInterceptors.push(requestBearerAuth(getToken, header, scheme, exclude));
    }
    if (preset?.jsonContentType) {
      builtinRequestInterceptors.push(requestJsonContentType());
    }
    if (preset?.acceptLanguage) {
      const { getLocale, header } = preset.acceptLanguage;
      builtinRequestInterceptors.push(requestAcceptLanguage(getLocale, header));
    }
    if (preset?.withCredentials) {
      builtinRequestInterceptors.push(requestWithCredentials());
    }
    if (preset?.requestAuthRefresh) {
      builtinRequestInterceptors.push(requestAuthRefresh(preset.requestAuthRefresh));
    }
    if (preset?.responseAuthRefresh) {
      builtinResponseInterceptors.push(
        createResponseAuthRefresh(preset.responseAuthRefresh, this.requestInstance!)
      );
    }
    if (preset?.retry) {
      builtinResponseInterceptors.push(createResponseRetry(preset.retry, this.requestInstance!));
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
        // 这里的 interceptor 一定是 GvrayResponseInterceptor，不是工厂函数
        this.requestInstance?.interceptors.response.use(interceptor as GvrayResponseInterceptor);
      }
    });

    this.requestInterceptors?.forEach((interceptor) => {
      registerRequestInterceptor(interceptor, this.requestInstance!);
    });

    this.responseInterceptors?.forEach((interceptor) => {
      registerResponseInterceptor(interceptor, this.requestInstance!);
    });

    // 当响应的数据 success 是 false 的时候，抛出 error 以供 errorHandler 处理。
    this.requestInstance?.interceptors.response.use((response: GvrayResponse) => {
      const data = response.data as Record<string, any> | undefined;
      if (data?.success === false && this.errorConfig?.errorThrower) {
        this.errorConfig.errorThrower(data);
      }
      return response;
    });

    return this.requestInstance;
  }

  public request<T = any>(
    url: string,
    opts: GvrayRequestConfigWithResponse
  ): Promise<GvrayResponse<T>>;
  public request<T = any>(url: string, opts?: GvrayOptions): Promise<T>;
  public request<T = any>(url: string, opts?: GvrayOptions): Promise<T | GvrayResponse<T>> {
    const requestInstance = this.requestInstance;

    if (!requestInstance) throw new Error('Request instance is not initialized');

    const {
      getResponse = false,
      requestInterceptors,
      responseInterceptors,
      // skipErrorHandler 和 skipAuth 通过 opts 对象传递给拦截器，不需要在这里解构
    } = opts || this.requestOptions || {};

    const requestInterceptorsToEject = requestInterceptors?.map((interceptor): number => {
      return registerRequestInterceptor(interceptor, requestInstance);
    });

    const responseInterceptorsToEject = responseInterceptors?.map((interceptor): number => {
      return registerResponseInterceptor(interceptor, requestInstance);
    });

    return new Promise<T | GvrayResponse<T>>((resolve, reject) => {
      requestInstance
        .request({ ...opts, url })
        .then((res) => {
          requestInterceptorsToEject?.forEach((interceptor) => {
            requestInstance.interceptors.request.eject(interceptor);
          });
          responseInterceptorsToEject?.forEach((interceptor) => {
            requestInstance.interceptors.response.eject(interceptor);
          });
          resolve(getResponse ? (res as GvrayResponse<T>) : (res as GvrayResponse<T>).data);
        })
        .catch((error: any) => {
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
              handler(error as GvrayError, opts as GvrayRequestConfig, feedBack);
            }
          } catch (e) {
            reject(e);
          }
          reject(error);
        });
    });
  }
}

export default GvrayRequest;
