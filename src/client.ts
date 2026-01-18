import RequestClient from './core/RequestClient';
import type { RequestConfig, IRequestOptions } from './types';

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
  return (url: string, opts: IRequestOptions = { method: 'GET' }) => {
    return client.request(url, opts);
  };
};

export { createClient, createRequest, RequestClient };
