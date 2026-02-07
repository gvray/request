import { axiosAdapter, AxiosInstance } from '../adapters';
import type { AxiosResponse } from 'axios';
import {
  ErrorConfig,
  IRequestInterceptorTuple,
  IRequestOptions,
  IRequestOptionsWithResponse,
  IResponseInterceptorTuple,
  RequestConfig,
  RuntimeRequestConfig,
  RequestOptions,
} from '../types';
import { wrapInterceptor } from './interceptor';
import {
  bearerAuth,
  jsonContentType,
  acceptLanguage,
  withCredentials,
  createAuthRefreshInterceptor,
} from '../interceptor';

class RequestClient {
  constructor(options: RequestConfig) {
    const { errorConfig, requestInterceptors, responseInterceptors, ...rest } = options;
    this.requestOptions = rest;
    this.errorConfig = errorConfig || null;
    this.requestInterceptors = requestInterceptors || null;
    this.responseInterceptors = responseInterceptors || null;
    this.getRequestInstance(rest);
  }
  static requestClient: RequestClient | null = null;
  private requestInstance: AxiosInstance | null = null;
  private requestOptions: RequestOptions;
  private errorConfig: ErrorConfig | null = null;
  private requestInterceptors: IRequestInterceptorTuple[] | null = null;
  private responseInterceptors: IResponseInterceptorTuple[] | null = null;

  static getRequestClient(options: RequestConfig) {
    if (RequestClient.requestClient) return RequestClient.requestClient;
    RequestClient.requestClient = new RequestClient(options);
    return RequestClient.requestClient;
  }
  private getRequestInstance(config: RuntimeRequestConfig) {
    this.requestInstance = axiosAdapter.create(config);

    // Auto register built-in interceptors from preset
    const preset = (this.requestOptions as any)?.preset;
    const builtinRequestInterceptors: IRequestInterceptorTuple[] = [];
    const builtinResponseInterceptors: IResponseInterceptorTuple[] = [];

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
      builtinResponseInterceptors.push(createAuthRefreshInterceptor(preset.authRefresh));
    }

    // register builtin first, then user interceptors (user can override behaviors by ordering)
    builtinRequestInterceptors.forEach((interceptor) => {
      this.requestInstance?.interceptors.request.use(wrapInterceptor(interceptor as any));
    });
    builtinResponseInterceptors.forEach((interceptor) => {
      this.requestInstance?.interceptors.response.use(interceptor as any);
    });

    this.requestInterceptors?.forEach((interceptor) => {
      if (Array.isArray(interceptor)) {
        const [success, fail] = interceptor;
        return this.requestInstance?.interceptors.request.use(wrapInterceptor(success), fail);
      }
      return this.requestInstance?.interceptors.request.use(wrapInterceptor(interceptor));
    });

    this.responseInterceptors?.forEach((interceptor) => {
      if (Array.isArray(interceptor)) {
        const [success, fail] = interceptor;
        this.requestInstance?.interceptors.response.use(success, fail);
      } else {
        this.requestInstance?.interceptors.response.use(interceptor);
      }
    });

    // 当响应的数据 success 是 false 的时候，抛出 error 以供 errorHandler 处理。
    this.requestInstance?.interceptors.response.use((response) => {
      const { data } = response;
      if (data?.success === false && this.errorConfig?.errorThrower) {
        this.errorConfig.errorThrower(data);
      }
      return response;
    });

    return this.requestInstance;
  }

  public request<T = any>(
    url: string,
    opts: IRequestOptionsWithResponse
  ): Promise<AxiosResponse<T>>;
  public request<T = any>(url: string, opts?: RequestOptions): Promise<T>;
  public request<T = any>(url: string, opts?: RequestOptions): Promise<T | AxiosResponse<T>> {
    const requestInstance = this.requestInstance;

    if (!requestInstance) throw new Error('Request instance is not initialized');

    const {
      getResponse = false,
      requestInterceptors,
      responseInterceptors,
    } = opts || this.requestOptions || {};

    const requestInterceptorsToEject = requestInterceptors?.map((interceptor) => {
      if (Array.isArray(interceptor)) {
        const [success, fail] = interceptor;
        return requestInstance.interceptors.request.use(wrapInterceptor(success), fail);
      }
      return requestInstance.interceptors.request.use(wrapInterceptor(interceptor));
    });

    const responseInterceptorsToEject = responseInterceptors?.map((interceptor) => {
      if (Array.isArray(interceptor)) {
        const [success, fail] = interceptor;
        return requestInstance.interceptors.response.use(success, fail);
      } else {
        return requestInstance.interceptors.response.use(interceptor);
      }
    });

    return new Promise<T | AxiosResponse<T>>((resolve, reject) => {
      requestInstance
        .request<T>({ ...opts, url })
        .then((res) => {
          requestInterceptorsToEject?.forEach((interceptor) => {
            requestInstance.interceptors.request.eject(interceptor);
          });
          responseInterceptorsToEject?.forEach((interceptor) => {
            requestInstance.interceptors.response.eject(interceptor);
          });
          resolve(getResponse ? res : res.data);
        })
        .catch((error) => {
          requestInterceptorsToEject?.forEach((interceptor) => {
            requestInstance.interceptors.request.eject(interceptor);
          });
          responseInterceptorsToEject?.forEach((interceptor) => {
            requestInstance.interceptors.response.eject(interceptor);
          });
          try {
            const handler = this.errorConfig?.errorHandler;
            const feedBack = this.errorConfig?.errorFeedBack;
            if (handler) {
              handler(error, opts as IRequestOptions, feedBack);
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
