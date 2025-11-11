/*
 * Universal Request Types and Adapter Interfaces
 */

export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'HEAD'
  | 'OPTIONS';

export type URLLike = string | URL;

// Interceptor function that can either accept (config) or (url, config) and return possibly modified values
export type RequestInterceptor =
  | ((config: RequestOptions) => Promise<RequestOptions> | RequestOptions)
  | ((
      url: string,
      config: RequestOptions,
    ) => Promise<{ url: string; options: RequestOptions }> | { url: string; options: RequestOptions });

export type ResponseInterceptor<T = any> = (
  response: UnifiedResponse<T>,
) => Promise<UnifiedResponse<T>> | UnifiedResponse<T>;

export type InterceptorPair<T = any> = [
  (arg: T) => Promise<T> | T,
  (error: unknown) => unknown,
];

export interface IErrorHandler {
  (error: RequestError, opts: RequestOptions): void;
}

export interface ErrorConfig<T = any> {
  errorHandler?: IErrorHandler;
  errorThrower?: (res: T) => void;
}

export interface RequestConfig<T = any> {
  baseURL?: string;
  timeout?: number;
  errorConfig?: ErrorConfig<T>;
  requestInterceptors?: Array<RequestInterceptor | InterceptorPair<RequestOptions>>;
  responseInterceptors?: Array<
    ResponseInterceptor<T> | InterceptorPair<UnifiedResponse<T>>
  >;
}

export interface RequestOptions extends Omit<RequestConfig, 'requestInterceptors' | 'responseInterceptors' | 'errorConfig'> {
  method?: HttpMethod;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined | null>;
  data?: any; // axios-like name
  body?: any; // fetch-like name
  skipErrorHandler?: boolean;
  requestInterceptors?: Array<RequestInterceptor | InterceptorPair<RequestOptions>>;
  responseInterceptors?: Array<
    ResponseInterceptor | InterceptorPair<UnifiedResponse<any>>
  >;
  getResponse?: boolean; // default false
}

export type RequestOptionsWithResponse = RequestOptions & { getResponse: true };
export type RequestOptionsWithoutResponse = RequestOptions & { getResponse: false };

export interface UnifiedResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
  url: string;
  raw?: any; // adapter-specific raw response (AxiosResponse or Fetch Response)
}

export type RequestError = Error & {
  isAxiosError?: boolean;
  response?: any;
  request?: any;
  status?: number;
  data?: any;
};

export interface HttpAdapter {
  request<T = any>(url: string, options: RequestOptions): Promise<UnifiedResponse<T>>;
}