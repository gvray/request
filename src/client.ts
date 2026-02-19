import RequestClient from './core/RequestClient';
import type {
  HttpConfig,
  HttpRequestOptions,
  HttpRequestOptionsWithResponse,
  HttpResponse,
} from './types';

/**
 * Initialize the global request client. After calling this, `request` can be used directly.
 */
const createClient = (options: HttpConfig): void => {
  RequestClient.getRequestClient(options);
};

/**
 * Create an independent request function with its own configuration.
 * Useful for multi-token or multi-baseURL scenarios.
 */
const createRequest = (options: HttpConfig) => {
  const client = new RequestClient(options);
  function req<T = unknown>(
    url: string,
    opts: HttpRequestOptionsWithResponse
  ): Promise<HttpResponse<T>>;
  function req<T = unknown>(url: string, opts?: HttpRequestOptions): Promise<T>;
  function req<T = unknown>(url: string, opts: HttpRequestOptions = { method: 'GET' }) {
    return client.request<T>(url, opts);
  }
  return req;
};

export { createClient, createRequest, RequestClient };
