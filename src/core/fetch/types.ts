/**
 * Fetch engine types — mirrors axios type surface
 * FetchRequestConfig  ↔ AxiosRequestConfig
 * FetchResponse       ↔ AxiosResponse
 * FetchInstance        ↔ AxiosInstance
 * FetchDefaults        ↔ AxiosDefaults
 */

import type { InterceptorManager } from './InterceptorManager';
import type { HttpHeaders } from '../../types';

// ─── Params ──────────────────────────────────────────────────────────────────

export type ParamValue = string | number | boolean | null | undefined;
export type Params = Record<string, ParamValue | ParamValue[]>;

// ─── Transform ───────────────────────────────────────────────────────────────

export type FetchRequestTransformer = (data: unknown, headers?: Record<string, string>) => unknown;
export type FetchResponseTransformer = (
  data: unknown,
  headers?: Record<string, string>,
  status?: number
) => unknown;

// ─── Request Config ──────────────────────────────────────────────────────────

export type FetchMethod =
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

export interface FetchRequestConfig<D = unknown> {
  url?: string;
  method?: FetchMethod | (string & NonNullable<unknown>);
  baseURL?: string;
  headers?: HttpHeaders;
  params?: Params;
  data?: D;
  timeout?: number;
  withCredentials?: boolean;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer' | 'formdata' | 'document' | 'stream';
  signal?: AbortSignal;
  timeoutErrorMessage?: string;
  validateStatus?: ((status: number) => boolean) | null;
  transformRequest?: FetchRequestTransformer | FetchRequestTransformer[];
  transformResponse?: FetchResponseTransformer | FetchResponseTransformer[];
  // Index signature for forward-compat with user-defined fields
  [key: string]: unknown;
}

// ─── Response ────────────────────────────────────────────────────────────────

export interface FetchResponse<T = unknown, D = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: FetchRequestConfig<D>;
  request?: FetchRequestInfo;
}

export interface FetchRequestInfo {
  url: string;
  init: RequestInit;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

export type FetchDefaults<D = unknown> = FetchRequestConfig<D>;

// ─── Instance ────────────────────────────────────────────────────────────────

export interface FetchInstance {
  // Callable signatures (mirrors AxiosInstance)
  <T = unknown, R = FetchResponse<T>, D = unknown>(config: FetchRequestConfig<D>): Promise<R>;
  <T = unknown, R = FetchResponse<T>, D = unknown>(
    url: string,
    config?: FetchRequestConfig<D>
  ): Promise<R>;

  // Core methods
  request<T = unknown, R = FetchResponse<T>, D = unknown>(
    config: FetchRequestConfig<D>
  ): Promise<R>;
  get<T = unknown, R = FetchResponse<T>, D = unknown>(
    url: string,
    config?: FetchRequestConfig<D>
  ): Promise<R>;
  delete<T = unknown, R = FetchResponse<T>, D = unknown>(
    url: string,
    config?: FetchRequestConfig<D>
  ): Promise<R>;
  head<T = unknown, R = FetchResponse<T>, D = unknown>(
    url: string,
    config?: FetchRequestConfig<D>
  ): Promise<R>;
  options<T = unknown, R = FetchResponse<T>, D = unknown>(
    url: string,
    config?: FetchRequestConfig<D>
  ): Promise<R>;
  post<T = unknown, R = FetchResponse<T>, D = unknown>(
    url: string,
    data?: D,
    config?: FetchRequestConfig<D>
  ): Promise<R>;
  put<T = unknown, R = FetchResponse<T>, D = unknown>(
    url: string,
    data?: D,
    config?: FetchRequestConfig<D>
  ): Promise<R>;
  patch<T = unknown, R = FetchResponse<T>, D = unknown>(
    url: string,
    data?: D,
    config?: FetchRequestConfig<D>
  ): Promise<R>;

  // Interceptors
  interceptors: {
    request: InterceptorManager<FetchRequestConfig>;
    response: InterceptorManager<FetchResponse>;
  };

  // Defaults
  defaults: FetchDefaults;

  // Utility
  getUri(config?: FetchRequestConfig): string;
}
