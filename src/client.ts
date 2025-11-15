import RequestClient, { RequestConfig } from './core/RequestClient';

const createClient = (options: RequestConfig) => {
  return RequestClient.getRequestClient(options);
};

export { createClient, RequestClient as UniRequestClient };
