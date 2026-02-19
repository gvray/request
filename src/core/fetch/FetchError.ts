/**
 * FetchError — mirrors AxiosError
 * Provides the same error shape so interceptors work identically.
 */

import type { FetchRequestConfig, FetchResponse, FetchRequestInfo } from './types';

export class FetchError<T = unknown, D = unknown> extends Error {
  config?: FetchRequestConfig<D>;
  code?: string;
  request?: FetchRequestInfo;
  response?: FetchResponse<T, D>;
  isFetchError: boolean;
  // Compat flag so interceptors that check `isAxiosError` still work
  isAxiosError: boolean;
  status?: number;

  constructor(
    message?: string,
    code?: string,
    config?: FetchRequestConfig<D>,
    request?: FetchRequestInfo,
    response?: FetchResponse<T, D>
  ) {
    super(message);
    this.name = 'FetchError';
    if (code !== undefined) this.code = code;
    if (config !== undefined) this.config = config;
    if (request !== undefined) this.request = request;
    if (response !== undefined) this.response = response;
    this.isFetchError = true;
    this.isAxiosError = true;
    if (response?.status !== undefined) this.status = response.status;

    // Fix prototype chain
    Object.setPrototypeOf(this, FetchError.prototype);
  }

  toJSON(): object {
    return {
      message: this.message,
      name: this.name,
      code: this.code,
      status: this.status,
    };
  }

  static readonly ERR_NETWORK = 'ERR_NETWORK';
  static readonly ERR_BAD_RESPONSE = 'ERR_BAD_RESPONSE';
  static readonly ERR_BAD_REQUEST = 'ERR_BAD_REQUEST';
  static readonly ERR_CANCELED = 'ERR_CANCELED';
  static readonly ECONNABORTED = 'ECONNABORTED';
  static readonly ETIMEDOUT = 'ETIMEDOUT';

  static from<T = unknown, D = unknown>(
    error: Error | unknown,
    code?: string,
    config?: FetchRequestConfig<D>,
    request?: FetchRequestInfo,
    response?: FetchResponse<T, D>
  ): FetchError<T, D> {
    const err = error instanceof Error ? error : new Error(String(error));
    const fetchError = new FetchError<T, D>(err.message, code, config, request, response);
    if (err.stack !== undefined) fetchError.stack = err.stack;
    return fetchError;
  }
}
