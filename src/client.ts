import RequestClient from './core/GvrayRequest';
import type {
  GvrayConfig,
  GvrayRequestConfig,
  GvrayRequestConfigWithResponse,
  GvrayResponse,
} from './types';

/**
 * Initialize the global request client. After calling this, `request` can be used directly.
 */
const createClient = (options: GvrayConfig): void => {
  RequestClient.getRequestClient(options);
};

/**
 * Create an independent request function with its own configuration.
 * Useful for multi-token or multi-baseURL scenarios.
 */
const createRequest = (options: GvrayConfig) => {
  const client = new RequestClient(options);
  function req<T = any>(
    url: string,
    opts: GvrayRequestConfigWithResponse
  ): Promise<GvrayResponse<T>>;
  function req<T = any>(url: string, opts?: GvrayRequestConfig): Promise<T>;
  function req<T = any>(url: string, opts: GvrayRequestConfig = { method: 'GET' }) {
    return client.request<T>(url, opts);
  }
  return req;
};

export { createClient, createRequest, RequestClient };
