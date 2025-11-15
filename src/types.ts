import { AxiosRequestConfig, AxiosError, AxiosResponse } from '@/adapters/AxiosAdapter';

type RequestError = AxiosError | Error;

export interface IErrorHandler {
  (error: RequestError, opts: IRequestOptions): void;
}

export interface IRequestOptions extends AxiosRequestConfig {
  skipErrorHandler?: boolean;
  requestInterceptors?: IRequestInterceptorTuple[];
  responseInterceptors?: IResponseInterceptorTuple[];
  [key: string]: any;
}

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
type WithPromise<T> = T | Promise<T>;
type IRequestInterceptorAxios = (config: IRequestOptions) => WithPromise<IRequestOptions>;

export interface ErrorConfig<T = any> {
  errorHandler?: IErrorHandler;
  errorThrower?: (res: T) => void;
}
export type IErrorInterceptor = (error: Error) => Promise<Error>;
export type IResponseInterceptor = <T = any>(
  response: AxiosResponse<T>
) => WithPromise<AxiosResponse<T>>;
export type IRequestInterceptor = IRequestInterceptorAxios;
export type IRequestInterceptorTuple =
  | [IRequestInterceptor, IErrorInterceptor]
  | [IRequestInterceptor]
  | IRequestInterceptor;
export type IResponseInterceptorTuple =
  | [IResponseInterceptor, IErrorInterceptor]
  | [IResponseInterceptor]
  | IResponseInterceptor;

export interface RequestConfig<T = any> extends AxiosRequestConfig {
  errorConfig?: ErrorConfig<T>;
  requestInterceptors?: IRequestInterceptorTuple[];
  responseInterceptors?: IResponseInterceptorTuple[];
}
