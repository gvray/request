import { createClient } from './client';
import type { RequestOptions } from './types';
import type { IRequest } from './client';
import { errorConfig } from './requestErrorConfig';

let singleton: ReturnType<typeof createClient> | null = null;

export const getClient = () => {
  if (singleton) return singleton;
  const baseURL = (globalThis as any)?.__APP_API_URL__;
  const timeoutVal = (globalThis as any)?.__APP_API_TIMEOUT__;
  const timeout = typeof timeoutVal === 'number' ? timeoutVal : Number(timeoutVal);

  const options: any = { adapter: 'axios', errorConfig };
  if (typeof baseURL === 'string') options.baseURL = baseURL;
  if (!Number.isNaN(timeout) && timeout !== undefined && timeout !== null)
    options.timeout = timeout;

  singleton = createClient(options);
  return singleton;
};

export const request: IRequest = ((url: string, opts?: RequestOptions) => {
  const client = getClient();
  return (client.request as any)(url, opts);
}) as any;
