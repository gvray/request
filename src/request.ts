import RequestClient from './core/RequestClient';
import { IRequestOptions } from './types';

export const getClient = () => {
  return RequestClient.requestClient;
};

export const request = (url: string, opts: IRequestOptions = { method: 'GET' }) => {
  const client = getClient();
  if (!client) throw new Error('Request client not initialized');
  return client.request(url, opts);
};
