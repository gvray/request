import type { AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';

export type RequestError = AxiosError | Error;

export interface IErrorHandler {
  (error: RequestError, opts: IRequestOptions, feedBack?: (errorInfo: ErrorFeedInfo) => void): void;
}

export interface Preset {
  bearerAuth?: {
    getToken: () => WithPromise<string | null | undefined>;
    header?: string;
    scheme?: string;
    exclude?: Array<string | RegExp> | ((url?: string, options?: IRequestOptions) => boolean);
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
}

// 创建期配置（客户端级）
export interface ClientConfig<T = any> extends AxiosRequestConfig {
  errorConfig?: ErrorConfig<T>;
  requestInterceptors?: IRequestInterceptorTuple[];
  responseInterceptors?: IResponseInterceptorTuple[];
  preset?: Preset;
}

export type RequestConfig<T = any> = ClientConfig<T>;

// 请求期配置（运行时），等于 RequestConfig 去掉创建期专属字段
export type RuntimeRequestConfig<T = any> = Omit<
  ClientConfig<T>,
  'errorConfig' | 'requestInterceptors' | 'responseInterceptors'
>;

export interface IRequestOptions extends RuntimeRequestConfig {
  skipErrorHandler?: boolean;
  getResponse?: boolean;
  requestInterceptors?: IRequestInterceptorTuple[];
  responseInterceptors?: IResponseInterceptorTuple[];
  // 控制本次请求是否跳过 Authorization 注入（如登录接口等）
  skipAuth?: boolean;
}

export type RequestOptions = IRequestOptions;

export interface IRequestOptionsWithResponse extends IRequestOptions {
  getResponse: true;
}

export interface IRequestOptionsWithoutResponse extends IRequestOptions {
  getResponse: false;
}

export interface IRequest {
  <T = any>(url: string, opts: IRequestOptionsWithResponse): Promise<AxiosResponse<T>>;
  <T = any>(url: string, opts: IRequestOptionsWithoutResponse): Promise<T>;
  <T = any>(url: string, opts: IRequestOptions): Promise<T>; // getResponse 默认是 false， 因此不提供该参数时，只返回 data
  <T = any>(url: string): Promise<T>; // 不提供 opts 时，默认使用 'GET' method，并且默认返回 data
}

export type WithPromise<T> = T | Promise<T>;
export type IRequestInterceptorAxios = (config: IRequestOptions) => WithPromise<IRequestOptions>;
export type IRequestInterceptorAxiosTwoArg = (
  url: string,
  options: IRequestOptions
) => WithPromise<{ url: string; options: IRequestOptions }>;

export type BizError = Error & {
  name: string;
  info: any;
};

export enum ErrorShowType {
  SILENT = 0,
  WARN_MESSAGE = 1,
  ERROR_MESSAGE = 2,
  NOTIFICATION = 3,
  DEFAULT = 4,
  REDIRECT = 9,
}

export type ErrorType = 'BizError' | 'AxiosError' | 'ResponseError' | 'RequestError';

export type ErrorFeedInfo = {
  showType: ErrorShowType;
  errorType: ErrorType;
  message: string;
  code?: number;
  error?: RequestError;
};

export type ErrorFeedBack = (errorInfo: ErrorFeedInfo) => void;

export interface ErrorConfig<T = any> {
  errorHandler?: IErrorHandler;
  errorThrower?: (res: T) => void;
  errorFeedBack?: ErrorFeedBack;
}
export type IErrorInterceptor = (error: AxiosError) => WithPromise<AxiosError | AxiosResponse>;
export type IResponseInterceptor = <T = any>(
  response: AxiosResponse<T>
) => WithPromise<AxiosResponse<T>>;
export type IRequestInterceptor = IRequestInterceptorAxios | IRequestInterceptorAxiosTwoArg;
export type IRequestInterceptorTuple =
  | [IRequestInterceptor, IErrorInterceptor]
  | [IRequestInterceptor]
  | IRequestInterceptor;
export type IResponseInterceptorTuple =
  | [IResponseInterceptor, IErrorInterceptor]
  | [IResponseInterceptor]
  | IResponseInterceptor;

export type RequestResult<T = any> = {
  data?: T;
  error?: any;
  response?: AxiosResponse<T>;
};

export interface HttpAdapter {
  request<T = any>(options: RequestOptions): Promise<T>;
}
