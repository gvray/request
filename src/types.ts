// ─── Engine-agnostic types ───────────────────────────────────────────────────
// These types abstract away the underlying HTTP engine (axios, fetch, etc.).
// User code should NEVER import axios/fetch types directly.

/** Unified response structure */
export interface GvrayResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: GvrayOptions;
}

/** Unified error structure */
export interface GvrayError extends Error {
  config?: GvrayOptions;
  code?: string;
  request?: any;
  response?: {
    status: number;
    statusText: string;
    data: any;
    headers: Record<string, string>;
  };
  isRequestError?: boolean;
}

/**
 * ResponseType - 支持的响应类型
 * - 'arraybuffer', 'blob', 'json', 'text', 'formdata': axios 和 fetch 都支持
 * - 'document': 只有 axios (XMLGvrayRequest) 支持
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

/**
 * 时间单位：毫秒
 */
export type Milliseconds = number;

/**
 * GvrayRequestConfig - axios 和 fetch 引擎的交集
 * 只包含创建客户端的全局配置（默认值）
 * 注意：不包含请求特定字段（url, method, headers, params, data, signal），这些在运行时传递
 */
export interface GvrayRequestConfig {
  baseURL?: string;
  timeout?: Milliseconds;
  withCredentials?: boolean;
  responseType?: ResponseType;
}

/**
 * HTTP Headers
 */
export type HeaderValue = string | string[] | number | boolean | null;

export interface RawHeaders {
  [key: string]: HeaderValue;
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
  | HeaderValue
  | 'text/html'
  | 'text/plain'
  | 'multipart/form-data'
  | 'application/json'
  | 'application/x-www-form-urlencoded'
  | 'application/octet-stream';

/**
 * RawRequestHeaders - 提供常用请求头的类型提示
 */
export type RawRequestHeaders = Partial<
  RawHeaders & {
    [Key in CommonRequestHeadersList]: HeaderValue;
  } & {
    'Content-Type': ContentType;
  }
>;

/**
 * GvrayRequestHeaders - 请求头类型
 */
export type GvrayRequestHeaders = RawRequestHeaders;

// 常用响应头列表
type CommonResponseHeadersList =
  | 'Server'
  | 'Content-Type'
  | 'Content-Length'
  | 'Cache-Control'
  | 'Content-Encoding'
  | 'Set-Cookie';

/**
 * RawResponseHeaders - 提供常用响应头的类型提示
 */
export type RawResponseHeaders = Partial<
  RawHeaders & {
    [Key in CommonResponseHeadersList]: HeaderValue;
  }
>;

/**
 * GvrayResponseHeaders - 响应头类型
 */
export type GvrayResponseHeaders = RawResponseHeaders;

/** Engine type */
export type Engine = 'axios' | 'fetch';

// ─── Interceptor types ───────────────────────────────────────────────────────

/**
 * MaybePromise - 可能是同步值或 Promise
 */
export type MaybePromise<T> = T | Promise<T>;

export type GvrayRequestInterceptor = (
  config: GvrayRequestConfig
) => MaybePromise<GvrayRequestConfig>;

export type GvrayErrorInterceptor = (error: any) => MaybePromise<any>;
export type GvrayResponseInterceptor = <T = any>(
  response: GvrayResponse<T>
) => MaybePromise<GvrayResponse<T>>;

export type GvrayRequestInterceptorConfig =
  | [GvrayRequestInterceptor, GvrayErrorInterceptor]
  | [GvrayRequestInterceptor]
  | GvrayRequestInterceptor
  | ((instance: GvrayInstance) => [GvrayRequestInterceptor, GvrayErrorInterceptor])
  | ((instance: GvrayInstance) => [GvrayRequestInterceptor])
  | ((instance: GvrayInstance) => GvrayRequestInterceptor);
export type GvrayResponseInterceptorConfig =
  | [GvrayResponseInterceptor, GvrayErrorInterceptor]
  | [GvrayResponseInterceptor]
  | GvrayResponseInterceptor
  | ((instance: GvrayInstance) => [GvrayResponseInterceptor, GvrayErrorInterceptor])
  | ((instance: GvrayInstance) => [GvrayResponseInterceptor])
  | ((instance: GvrayInstance) => GvrayResponseInterceptor);

// ─── Error handling ──────────────────────────────────────────────────────────

export interface ErrorHandler {
  (
    error: GvrayError,
    opts: GvrayRequestConfig,
    feedback?: (errorInfo: ErrorFeedbackInfo) => void
  ): void;
}

export type BusinessError = Error & {
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

export type ErrorType = 'Business' | 'Response' | 'Request';

export type ErrorFeedbackInfo = {
  showType: ErrorShowType;
  errorType: ErrorType;
  message: string;
  code?: number;
  error?: GvrayError;
};

export type ErrorFeedback = (errorInfo: ErrorFeedbackInfo) => void;

export interface ErrorConfig<TErrorData = any> {
  errorHandler?: ErrorHandler;
  errorThrower?: (res: TErrorData) => void;
  errorFeedback?: ErrorFeedback;
}

// ─── Preset (built-in interceptor config) ────────────────────────────────────

export interface InterceptorPreset {
  bearerAuth?: {
    getToken: () => MaybePromise<string | null | undefined>;
    header?: string;
    scheme?: string;
    exclude?: Array<string | RegExp> | ((url?: string, options?: GvrayRequestConfig) => boolean);
  };
  acceptLanguage?: {
    getLocale: () => MaybePromise<string | null | undefined>;
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
    retryCondition?: (error: GvrayError) => boolean;
    onRetry?: (retryCount: number, error: GvrayError, config: GvrayOptions) => void;
  };
  logging?:
    | {
        level?: 'debug' | 'info' | 'warn' | 'error' | 'none';
        logRequest?: boolean;
        logResponse?: boolean;
        logError?: boolean;
        logRequestBody?: boolean;
        logResponseBody?: boolean;
        logger?: {
          debug?: (...args: any[]) => void;
          info?: (...args: any[]) => void;
          warn?: (...args: any[]) => void;
          error?: (...args: any[]) => void;
        };
        timestampKey?: string;
      }
    | boolean;
}

// ─── Client / Request config ─────────────────────────────────────────────────

/**
 * RuntimeControlFields - 运行时控制字段
 * 用于拦截器内部状态管理和流程控制
 */
export interface RuntimeControlFields {
  skipErrorHandler?: boolean;
  skipAuth?: boolean;
  getResponse?: boolean;
  _retry?: boolean;
}

/**
 * GvrayRequestConfig - 请求配置（所有请求共有的字段）
 */
export interface GvrayRequestConfig<D = any> extends RuntimeControlFields {
  // 基础配置
  baseURL?: string;
  timeout?: Milliseconds;
  withCredentials?: boolean;
  responseType?: ResponseType;
  // 请求字段
  url?: string;
  method?: Method | string;
  headers?: GvrayRequestHeaders;
  params?: any;
  data?: D;
  signal?: AbortSignal;
  // 运行时拦截器
  requestInterceptors?: GvrayRequestInterceptorConfig[];
  responseInterceptors?: GvrayResponseInterceptorConfig[];
  // 索引签名，用于兼容引擎特定字段和用户自定义字段
  [key: string]: any;
}

/**
 * GvrayConfig - 创建客户端时的配置
 * 在 GvrayRequestConfig 基础上增加客户端级别的配置
 */
export interface GvrayConfig<TErrorData = any> extends GvrayRequestConfig {
  engine?: Engine;
  errorConfig?: ErrorConfig<TErrorData>;
  preset?: InterceptorPreset;
}

/**
 * GvrayOptions - GvrayRequestConfig 的别名
 */
export type GvrayOptions<D = any> = GvrayRequestConfig<D>;

export interface GvrayRequestConfigWithResponse extends GvrayRequestConfig {
  getResponse: true;
}

export interface GvrayRequestConfigWithoutResponse extends GvrayRequestConfig {
  getResponse: false;
}

export interface GvrayRequest {
  <T = any>(url: string, opts: GvrayRequestConfigWithResponse): Promise<GvrayResponse<T>>;
  <T = any>(url: string, opts: GvrayRequestConfigWithoutResponse): Promise<T>;
  <T = any>(url: string, opts: GvrayRequestConfig): Promise<T>;
  <T = any>(url: string): Promise<T>;
}

export type GvrayResult<T = any> = {
  data?: T;
  error?: any;
  response?: GvrayResponse<T>;
};

// ─── Http instance ──────────────────────────────────────────────────────────
// GvrayInstance defines the common structural contract that both AxiosInstance
// and FetchInstance satisfy. Adapters cast their native instance to this type
// at the boundary, keeping the internal API engine-agnostic.
//
// The shape is derived from AxiosInstance / FetchInstance so it stays grounded
// to real engine implementations rather than drifting.

export interface GvrayInstance {
  // Callable signatures — mirrors AxiosInstance
  <T = any>(config: GvrayOptions): Promise<GvrayResponse<T>>;
  <T = any>(url: string, config?: GvrayOptions): Promise<GvrayResponse<T>>;

  // Core request method
  request<T = any>(config: GvrayOptions): Promise<GvrayResponse<T>>;

  // HTTP shortcut methods
  get<T = any>(url: string, config?: GvrayOptions): Promise<GvrayResponse<T>>;
  delete<T = any>(url: string, config?: GvrayOptions): Promise<GvrayResponse<T>>;
  head<T = any>(url: string, config?: GvrayOptions): Promise<GvrayResponse<T>>;
  options<T = any>(url: string, config?: GvrayOptions): Promise<GvrayResponse<T>>;
  post<T = any>(url: string, data?: any, config?: GvrayOptions): Promise<GvrayResponse<T>>;
  put<T = any>(url: string, data?: any, config?: GvrayOptions): Promise<GvrayResponse<T>>;
  patch<T = any>(url: string, data?: any, config?: GvrayOptions): Promise<GvrayResponse<T>>;

  // Interceptors
  interceptors: {
    request: {
      use(
        fulfilled?: ((config: GvrayOptions) => GvrayOptions | Promise<GvrayOptions>) | null,
        rejected?: ((error: any) => unknown) | null
      ): number;
      eject(id: number): void;
    };
    response: {
      use(
        fulfilled?: ((response: GvrayResponse) => GvrayResponse | Promise<GvrayResponse>) | null,
        rejected?: ((error: any) => unknown) | null
      ): number;
      eject(id: number): void;
    };
  };

  // Defaults
  defaults: GvrayOptions;
}

export interface GvrayAdapter {
  create(options: GvrayOptions): GvrayInstance;
  request<T = any>(options: GvrayOptions): Promise<T>;
}
