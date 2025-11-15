import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { RequestOptions, UnifiedResponse } from '../types';
import { Adapter } from './Adapter';

let axiosInstance: AxiosInstance | null = null;

const getAxiosInstance = (options: RequestOptions): AxiosInstance => {
  if (axiosInstance) return axiosInstance;
  const createConfig: AxiosRequestConfig = {};
  if (options.baseURL !== undefined) createConfig.baseURL = options.baseURL;
  if (options.timeout !== undefined) createConfig.timeout = options.timeout;
  axiosInstance = axios.create(createConfig);
  return axiosInstance;
};

class AxiosAdapter extends Adapter {
  async request<T = any>(url: string, options: RequestOptions): Promise<UnifiedResponse<T>> {
    const instance = getAxiosInstance(options);
    const payload = this.getPayload(options);
    const headers = this.mergeHeaders(this.getDefaultHeaders(payload), options.headers);

    const axiosConfig: AxiosRequestConfig = { method: options.method || 'GET', headers, url };
    if (options.params !== undefined) axiosConfig.params = options.params;
    if (options.timeout !== undefined) axiosConfig.timeout = options.timeout;
    if (options.baseURL !== undefined) axiosConfig.baseURL = options.baseURL;
    if (payload !== undefined) axiosConfig.data = payload;

    const res: AxiosResponse<T> = await instance.request<T>(axiosConfig);
    const headersObj: Record<string, string> = {};
    Object.entries(res.headers || {}).forEach(([k, v]) => {
      headersObj[k] = Array.isArray(v) ? v.join('; ') : String(v);
    });

    return this.toUnifiedResponse<T>(res.data, res.status, headersObj, res.config?.url || url, res);
  }
}

export const axiosAdapter = new AxiosAdapter();
