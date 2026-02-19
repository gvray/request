// ─── Engine-agnostic types ───────────────────────────────────────────────────
// These types abstract away the underlying HTTP engine (axios, fetch, etc.).
// User code should NEVER import axios/fetch types directly.

/** Unified response structure */
export interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: HttpOptions;
}

/** Unified error structure */
export interface HttpError extends Error {
  config?: HttpOptions;
  code?: string;
  request?: unknown;
  response?: {
    status: number;
    statusText: string;
    data: unknown;
    headers: Record<string, string>;
  };
  isRequestError?: boolean;
}

/** Unified request config (engine-agnostic base) */
export interface BaseRequestConfig {
  url?: string;
  method?: string;
  baseURL?: string;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | null | undefined>;
  data?: unknown;
  timeout?: number;
  withCredentials?: boolean;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
  signal?: AbortSignal;
  [key: string]: unknown;
}

/** Engine type */
export type Engine = 'axios' | 'fetch';

// ─── Interceptor types ───────────────────────────────────────────────────────

export type WithPromise<T> = T | Promise<T>;

export type HttpInterceptor = (config: HttpRequestOptions) => WithPromise<HttpRequestOptions>;

export type HttpErrorInterceptor = (error: unknown) => WithPromise<unknown>;
export type HttpResponseInterceptor = <T = unknown>(
  response: HttpResponse<T>
) => WithPromise<HttpResponse<T>>;

export type HttpRequestInterceptorTuple =
  | [HttpInterceptor, HttpErrorInterceptor]
  | [HttpInterceptor]
  | HttpInterceptor;
export type HttpResponseInterceptorTuple =
  | [HttpResponseInterceptor, HttpErrorInterceptor]
  | [HttpResponseInterceptor]
  | HttpResponseInterceptor;

// ─── Error handling ──────────────────────────────────────────────────────────

export interface HttpErrorHandler {
  (error: HttpError, opts: HttpRequestOptions, feedBack?: (errorInfo: ErrorFeedInfo) => void): void;
}

export type BizError = Error & {
  name: string;
  info: unknown;
};

export enum ErrorShowType {
  SILENT = 0,
  WARN_MESSAGE = 1,
  ERROR_MESSAGE = 2,
  NOTIFICATION = 3,
  DEFAULT = 4,
  REDIRECT = 9,
}

export type ErrorType = 'BizError' | 'ResponseError' | 'RequestError';

export type ErrorFeedInfo = {
  showType: ErrorShowType;
  errorType: ErrorType;
  message: string;
  code?: number;
  error?: HttpError;
};

export type ErrorFeedBack = (errorInfo: ErrorFeedInfo) => void;

export interface ErrorConfig<T = unknown> {
  errorHandler?: HttpErrorHandler;
  errorThrower?: (res: T) => void;
  errorFeedBack?: ErrorFeedBack;
}

// ─── Preset (built-in interceptor config) ────────────────────────────────────

export interface Preset {
  bearerAuth?: {
    getToken: () => WithPromise<string | null | undefined>;
    header?: string;
    scheme?: string;
    exclude?: Array<string | RegExp> | ((url?: string, options?: HttpRequestOptions) => boolean);
  };
  acceptLanguage?: {
    getLocale: () => WithPromise<string | null | undefined>;
    header?: string;
  };
  jsonContentType?: boolean;
  withCredentials?: boolean;
  authRefresh?: {
    refreshToken: () => Promise<string | null | undefined>;
    setToken?: (token: string) => Promise<void> | void;
    getToken?: () => Promise<string | null | undefined>;
    statuses?: number[];
    loginRedirect?: () => void;
    header?: string;
    scheme?: string;
  };
  retry?: {
    maxRetries?: number;
    retryDelay?: number;
    exponentialBackoff?: boolean;
    retryableStatuses?: number[];
    retryCondition?: (error: HttpError) => boolean;
    onRetry?: (retryCount: number, error: HttpError, config: HttpOptions) => void;
  };
}

// ─── Client / Request config ─────────────────────────────────────────────────

// 创建期配置（客户端级）
export interface ClientConfig<T = unknown> extends BaseRequestConfig {
  engine?: Engine;
  errorConfig?: ErrorConfig<T>;
  requestInterceptors?: HttpRequestInterceptorTuple[];
  responseInterceptors?: HttpResponseInterceptorTuple[];
  preset?: Preset;
}

export type HttpConfig<T = unknown> = ClientConfig<T>;

// 请求期配置（运行时），等于 HttpConfig 去掉创建期专属字段
export type RuntimeRequestConfig<T = unknown> = Omit<
  ClientConfig<T>,
  'engine' | 'errorConfig' | 'requestInterceptors' | 'responseInterceptors' | 'preset'
>;

export interface HttpRequestOptions extends RuntimeRequestConfig {
  skipErrorHandler?: boolean;
  getResponse?: boolean;
  requestInterceptors?: HttpRequestInterceptorTuple[];
  responseInterceptors?: HttpResponseInterceptorTuple[];
  skipAuth?: boolean;
}

export type HttpOptions = HttpRequestOptions;

export interface HttpRequestOptionsWithResponse extends HttpRequestOptions {
  getResponse: true;
}

export interface HttpRequestOptionsWithoutResponse extends HttpRequestOptions {
  getResponse: false;
}

export interface HttpRequest {
  <T = unknown>(url: string, opts: HttpRequestOptionsWithResponse): Promise<HttpResponse<T>>;
  <T = unknown>(url: string, opts: HttpRequestOptionsWithoutResponse): Promise<T>;
  <T = unknown>(url: string, opts: HttpRequestOptions): Promise<T>;
  <T = unknown>(url: string): Promise<T>;
}

export type HttpResult<T = unknown> = {
  data?: T;
  error?: unknown;
  response?: HttpResponse<T>;
};

// ─── Http instance ──────────────────────────────────────────────────────────
// HttpInstance defines the common structural contract that both AxiosInstance
// and FetchInstance satisfy. Adapters cast their native instance to this type
// at the boundary, keeping the internal API engine-agnostic.
//
// The shape is derived from AxiosInstance / FetchInstance so it stays grounded
// to real engine implementations rather than drifting.

export interface HttpInstance {
  // Callable signatures — mirrors AxiosInstance
  <T = unknown>(config: HttpOptions): Promise<HttpResponse<T>>;
  <T = unknown>(url: string, config?: HttpOptions): Promise<HttpResponse<T>>;

  // Core request method
  request<T = unknown>(config: HttpOptions): Promise<HttpResponse<T>>;

  // HTTP shortcut methods
  get<T = unknown>(url: string, config?: HttpOptions): Promise<HttpResponse<T>>;
  delete<T = unknown>(url: string, config?: HttpOptions): Promise<HttpResponse<T>>;
  head<T = unknown>(url: string, config?: HttpOptions): Promise<HttpResponse<T>>;
  options<T = unknown>(url: string, config?: HttpOptions): Promise<HttpResponse<T>>;
  post<T = unknown>(url: string, data?: unknown, config?: HttpOptions): Promise<HttpResponse<T>>;
  put<T = unknown>(url: string, data?: unknown, config?: HttpOptions): Promise<HttpResponse<T>>;
  patch<T = unknown>(url: string, data?: unknown, config?: HttpOptions): Promise<HttpResponse<T>>;

  // Interceptors
  interceptors: {
    request: {
      use(
        fulfilled?: ((config: HttpOptions) => HttpOptions | Promise<HttpOptions>) | null,
        rejected?: ((error: unknown) => unknown) | null
      ): number;
      eject(id: number): void;
    };
    response: {
      use(
        fulfilled?: ((response: HttpResponse) => HttpResponse | Promise<HttpResponse>) | null,
        rejected?: ((error: unknown) => unknown) | null
      ): number;
      eject(id: number): void;
    };
  };

  // Defaults
  defaults: HttpOptions;
}

export interface HttpAdapter {
  create(options: HttpOptions): HttpInstance;
  request<T = unknown>(options: HttpOptions): Promise<T>;
}
