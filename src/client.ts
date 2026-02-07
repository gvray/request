import RequestClient from './core/RequestClient';
import type { AxiosResponse } from 'axios';
import type { RequestConfig, IRequestOptions, IRequestOptionsWithResponse } from './types';

/**
 * Initialize the global request client. After calling this, `request` can be used directly.
 */
const createClient = (options: RequestConfig): void => {
  RequestClient.getRequestClient(options);
};

/**
 * Create an independent request function with its own configuration.
 * Useful for multi-token or multi-baseURL scenarios.
 */
const createRequest = (options: RequestConfig) => {
  const client = new RequestClient(options);
  function req<T = any>(url: string, opts: IRequestOptionsWithResponse): Promise<AxiosResponse<T>>;
  function req<T = any>(url: string, opts?: IRequestOptions): Promise<T>;
  function req<T = any>(url: string, opts: IRequestOptions = { method: 'GET' }) {
    return client.request<T>(url, opts);
  }
  return req;
};

export { createClient, createRequest, RequestClient };
