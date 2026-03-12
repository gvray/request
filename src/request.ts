import GvrayRequest from './core/GvrayRequest';
import type {
  GvrayRequestConfig,
  GvrayRequestConfigWithResponse,
  GvrayResult,
  GvrayResponse,
} from './types';

export const getClient = () => {
  return GvrayRequest.requestClient;
};

export function request<T = any>(
  url: string,
  opts: GvrayRequestConfigWithResponse
): Promise<GvrayResponse<T>>;
export function request<T = any>(url: string, opts?: GvrayRequestConfig): Promise<T>;
export function request<T = any>(url: string, opts: GvrayRequestConfig = { method: 'GET' }) {
  const client = getClient();
  if (!client) throw new Error('Request client not initialized');
  return client.request<T>(url, opts);
}

export const requestSafe = async <T = any>(
  url: string,
  opts: GvrayRequestConfig = { method: 'GET' }
): Promise<GvrayResult<T>> => {
  try {
    const res = await request(url, opts);
    const getResponse = opts?.getResponse === true;
    if (getResponse) {
      const response = res as unknown as GvrayResponse<T>;
      return { data: response.data, response };
    }
    return { data: res as T };
  } catch (error) {
    return { error };
  }
};
