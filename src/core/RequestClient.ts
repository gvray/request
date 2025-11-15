import {
  axiosAdapter,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosError,
} from '@/adapters/AxiosAdapter';
import { ErrorConfig, IRequestOptions } from '@/types';

export interface RequestConfig<T = any> extends AxiosRequestConfig {
  errorConfig?: ErrorConfig<T>;
  requestInterceptors?: any[];
  responseInterceptors?: any[];
}

class RequestClient {
  constructor(options: RequestConfig) {
    this.getRequestInstance(options);
  }
  static requestClient: RequestClient | null = null;
  private requestInstance: AxiosInstance | null = null;

  static getRequestClient(options: RequestConfig) {
    if (RequestClient.requestClient) return RequestClient.requestClient;
    RequestClient.requestClient = new RequestClient(options);
    return RequestClient.requestClient;
  }
  private getRequestInstance(config: RequestConfig) {
    this.requestInstance = axiosAdapter.create(config);

    config?.requestInterceptors?.forEach((interceptor: any) => {
      if (Array.isArray(interceptor)) {
        this.requestInstance?.interceptors.request.use(async (config: any) => {
          const { url } = config;
          if (interceptor[0].length === 2) {
            const { url: newUrl, options } = await interceptor[0](url || '', config);
            return { ...options, url: newUrl };
          }
          return interceptor[0](config);
        }, interceptor[1]);
      } else {
        this.requestInstance?.interceptors.request.use(async (config: any) => {
          const { url } = config;
          if (interceptor.length === 2) {
            const { url: newUrl, options } = await interceptor(url || '', config);
            return { ...options, url: newUrl };
          }
          return interceptor(config);
        });
      }
    });

    config?.responseInterceptors?.forEach((interceptor: any) => {
      if (Array.isArray(interceptor)) {
        this.requestInstance?.interceptors.response.use(interceptor[0], interceptor[1]);
      } else {
        this.requestInstance?.interceptors.response.use(interceptor);
      }
    });

    // 当响应的数据 success 是 false 的时候，抛出 error 以供 errorHandler 处理。
    this.requestInstance.interceptors.response.use((response) => {
      const { data } = response;
      if (data?.success === false && config?.errorConfig?.errorThrower) {
        config.errorConfig.errorThrower(data);
      }
      return response;
    });

    return this.requestInstance;
  }

  public request(url: string, opts?: IRequestOptions) {
    const requestInstance = this.requestInstance;
    if (!requestInstance) throw new Error('Request instance is not initialized');
    const { getResponse = false, requestInterceptors, responseInterceptors } = opts;

    const requestInterceptorsToEject = requestInterceptors?.map((interceptor: any) => {
      if (Array.isArray(interceptor)) {
        return requestInstance.interceptors.request.use(async (config: any) => {
          const { url } = config;
          if (interceptor[0].length === 2) {
            const { url: newUrl, options } = await interceptor[0](url || '', config);
            return { ...options, url: newUrl };
          }
          return interceptor[0](config);
        }, interceptor[1]);
      } else {
        return requestInstance.interceptors.request.use(async (config: any) => {
          const { url } = config;
          if (interceptor.length === 2) {
            const { url: newUrl, options } = await interceptor(url || '', config);
            return { ...options, url: newUrl };
          }
          return interceptor(config);
        });
      }
    });

    const responseInterceptorsToEject = responseInterceptors?.map((interceptor: any) => {
      if (Array.isArray(interceptor)) {
        return requestInstance.interceptors.response.use(interceptor[0], interceptor[1]);
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
            const handler = config?.errorConfig?.errorHandler;
            if (handler) {
              handler(error, opts);
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
