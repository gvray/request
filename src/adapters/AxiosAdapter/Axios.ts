import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Adapter } from '../Adapter';
import type { GvrayInstance, GvrayOptions } from '../../types';

/**
 * Axios adapter — wraps axios internals behind the unified GvrayInstance interface.
 * Axios-specific types (AxiosResponse, AxiosError, etc.) are NOT exported.
 */
export class AxiosAdapter extends Adapter {
  private instance: AxiosInstance | null = null;

  create(options: GvrayOptions): GvrayInstance {
    // Cast our unified config to axios-compatible config at the boundary
    this.instance = axios.create(options as AxiosRequestConfig);
    return this.instance as unknown as GvrayInstance;
  }

  private ensureInstance(options?: GvrayOptions): AxiosInstance {
    if (this.instance) return this.instance;
    this.instance = axios.create((options || {}) as AxiosRequestConfig);
    return this.instance;
  }

  async request<T = any>(options: GvrayOptions): Promise<T> {
    const inst = this.ensureInstance(options);
    const res = await inst.request(options as AxiosRequestConfig);
    return options?.getResponse ? (res as unknown as T) : (res.data as T);
  }
}

export const axiosAdapter = new AxiosAdapter();
