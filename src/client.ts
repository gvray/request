import RequestClient from './core/RequestClient';
import type { RequestConfig } from './types';

const createClient = (options: RequestConfig) => {
  return RequestClient.getRequestClient(options);
};

export { createClient, createClient as createRequestClient, RequestClient as UniRequestClient };
