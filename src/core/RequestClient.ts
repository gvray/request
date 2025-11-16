import { axiosAdapter, AxiosInstance } from '../adapters';
import {
  ErrorConfig,
  IRequestInterceptorTuple,
  IRequestOptions,
  IResponseInterceptorTuple,
  RequestConfig,
  RuntimeRequestConfig,
  RequestOptions,
} from '../types';
import { wrapInterceptor } from './interceptor';

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

  public request(url: string, opts?: RequestOptions) {
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

    return new Promise((resolve, reject) => {
      requestInstance
        .request({ ...opts, url })
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
            if (handler) {
              handler(error, opts as IRequestOptions);
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
