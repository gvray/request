import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosError,
  type AxiosResponse,
} from 'axios';
import { Adapter } from '../Adapter';
import type { RequestOptions } from '../../types';

// 保持 Axios 类型导出
export type { AxiosInstance, AxiosRequestConfig, AxiosError, AxiosResponse };

// 直接透传 axios 的能力
export class AxiosAdapter extends Adapter {
  private instance: AxiosInstance | null = null;

  create<T = any>(options: RequestOptions): T {
    this.instance = axios.create(options);
    return this.instance as unknown as T;
  }

  private ensureInstance(options?: RequestOptions): AxiosInstance {
    if (this.instance) return this.instance;
    return this.create(options || {}) as unknown as AxiosInstance;
  }

  async request<T = any>(options: RequestOptions): Promise<T> {
    const inst = this.ensureInstance(options);
    const res = await inst.request<T>({ ...options });
    return options?.getResponse ? (res as unknown as T) : (res.data as T);
  }

  get<T = any>(options: RequestOptions = {} as RequestOptions): Promise<T> {
    return this.request<T>({ ...options, method: 'GET' });
  }

  delete<T = any>(options: RequestOptions = {} as RequestOptions): Promise<T> {
    return this.request<T>({ ...options, method: 'DELETE' });
  }

  head<T = any>(options: RequestOptions = {} as RequestOptions): Promise<T> {
    return this.request<T>({ ...options, method: 'HEAD' });
  }

  options<T = any>(options: RequestOptions = {} as RequestOptions): Promise<T> {
    return this.request<T>({ ...options, method: 'OPTIONS' });
  }

  post<T = any>(options: RequestOptions = {} as RequestOptions): Promise<T> {
    return this.request<T>({ ...options, method: 'POST' });
  }

  put<T = any>(options: RequestOptions = {} as RequestOptions): Promise<T> {
    return this.request<T>({ ...options, method: 'PUT' });
  }

  patch<T = any>(options: RequestOptions = {} as RequestOptions): Promise<T> {
    return this.request<T>({ ...options, method: 'PATCH' });
  }
}

export const axiosAdapter = new AxiosAdapter();
