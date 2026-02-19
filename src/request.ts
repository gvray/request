import RequestClient from './core/RequestClient';
import type {
  HttpRequestOptions,
  HttpRequestOptionsWithResponse,
  HttpResult,
  HttpResponse,
} from './types';

export const getClient = () => {
  return RequestClient.requestClient;
};

export function request<T = unknown>(
  url: string,
  opts: HttpRequestOptionsWithResponse
): Promise<HttpResponse<T>>;
export function request<T = unknown>(url: string, opts?: HttpRequestOptions): Promise<T>;
export function request<T = unknown>(url: string, opts: HttpRequestOptions = { method: 'GET' }) {
  const client = getClient();
  if (!client) throw new Error('Request client not initialized');
  return client.request<T>(url, opts);
}

export const requestSafe = async <T = unknown>(
  url: string,
  opts: HttpRequestOptions = { method: 'GET' }
): Promise<HttpResult<T>> => {
  try {
    const res = await request(url, opts);
    const getResponse = opts?.getResponse === true;
    if (getResponse) {
      const response = res as unknown as HttpResponse<T>;
      return { data: response.data, response };
    }
    return { data: res as T };
  } catch (error) {
    return { error };
  }
};
