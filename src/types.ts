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

/**
 * ResponseType - 支持的响应类型
 * - 'arraybuffer', 'blob', 'json', 'text', 'formdata': axios 和 fetch 都支持
 * - 'document': 只有 axios (XMLHttpRequest) 支持
 * - 'stream': 只有 Node.js 环境的 axios 支持
 * @default 'json'
 */
export type ResponseType =
  | 'arraybuffer'
  | 'blob'
  | 'document'
  | 'json'
  | 'text'
  | 'stream'
  | 'formdata';

/**
 * Method - 两个引擎都支持的 HTTP 方法
 */
export type Method =
  | 'get'
  | 'GET'
  | 'delete'
  | 'DELETE'
  | 'head'
  | 'HEAD'
  | 'options'
  | 'OPTIONS'
  | 'post'
  | 'POST'
  | 'put'
  | 'PUT'
  | 'patch'
  | 'PATCH';

type Milliseconds = number;

/**
 * BaseRequestConfig - axios 和 fetch 引擎的交集
 * 只包含创建客户端的全局配置（默认值）
 * 注意：不包含请求特定字段（url, method, headers, params, data, signal），这些在运行时传递
 */
export interface BaseRequestConfig {
  baseURL?: string;
  timeout?: Milliseconds;
  withCredentials?: boolean;
  responseType?: ResponseType;
}

/**
 * HTTP Headers - 参考 axios 的设计，取其精华
 */
export type HttpHeaderValue = string | string[] | number | boolean | null;

export interface RawHttpHeaders {
  [key: string]: HttpHeaderValue;
}

// 常用请求头列表
type CommonRequestHeadersList =
  | 'Accept'
  | 'Content-Length'
  | 'User-Agent'
  | 'Content-Encoding'
  | 'Authorization';

// Content-Type 常用值（提供智能提示）
type ContentType =
  | HttpHeaderValue
  | 'text/html'
  | 'text/plain'
  | 'multipart/form-data'
  | 'application/json'
  | 'application/x-www-form-urlencoded'
  | 'application/octet-stream';

/**
 * RawHttpRequestHeaders - 提供常用请求头的类型提示
 * 参考 axios 的 RawAxiosRequestHeaders 设计
 */
export type RawHttpRequestHeaders = Partial<
  RawHttpHeaders & {
    [Key in CommonRequestHeadersList]: HttpHeaderValue;
  } & {
    'Content-Type': ContentType;
  }
>;

/**
 * HttpRequestHeaders - 请求头类型
 * 参考 axios 的 AxiosRequestHeaders = RawAxiosRequestHeaders & AxiosHeaders
 * 我们简化为直接使用 RawHttpRequestHeaders
 */
export type HttpRequestHeaders = RawHttpRequestHeaders;

/**
 * HttpHeaders - 请求头类型别名（向后兼容）
 */
export type HttpHeaders = HttpRequestHeaders;

// 常用响应头列表
type CommonResponseHeadersList =
  | 'Server'
  | 'Content-Type'
  | 'Content-Length'
  | 'Cache-Control'
  | 'Content-Encoding'
  | 'Set-Cookie';

/**
 * RawHttpResponseHeaders - 提供常用响应头的类型提示
 */
export type RawHttpResponseHeaders = Partial<
  RawHttpHeaders & {
    [Key in CommonResponseHeadersList]: HttpHeaderValue;
  }
>;

/**
 * HttpResponseHeaders - 响应头类型
 */
export type HttpResponseHeaders = RawHttpResponseHeaders;

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
export interface ClientConfig<T = any> extends BaseRequestConfig {
  engine?: Engine;
  errorConfig?: ErrorConfig<T>;
  requestInterceptors?: HttpRequestInterceptorTuple[];
  responseInterceptors?: HttpResponseInterceptorTuple[];
  preset?: Preset;
}

export type HttpConfig<T = any> = ClientConfig<T>;

/**
 * RuntimeRequestConfig - 运行时请求配置
 * 直接继承 BaseRequestConfig，不关联 ClientConfig
 * 添加运行时才需要的字段（url, method, headers, params, data, signal）
 */
export interface RuntimeRequestConfig<D = any> extends BaseRequestConfig {
  url?: string; // 请求 URL
  method?: Method | string; // 请求方法
  headers?: HttpHeaders; // 请求头
  params?: any; // 查询参数
  data?: D; // 请求体数据
  signal?: AbortSignal; // 取消信号
}

/**
 * HttpRequestOptions - 运行时请求配置
 * 包含运行时专属字段（如 skipAuth, _retry 等）
 */
export interface HttpRequestOptions<D = any> extends RuntimeRequestConfig<D> {
  skipErrorHandler?: boolean;
  getResponse?: boolean;
  requestInterceptors?: HttpRequestInterceptorTuple[];
  responseInterceptors?: HttpResponseInterceptorTuple[];
  // 运行时控制字段
  skipAuth?: boolean;
  _retry?: boolean;
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
