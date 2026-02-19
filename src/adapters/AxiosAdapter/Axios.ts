import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { Adapter } from '../Adapter';
import type { HttpInstance, HttpOptions } from '../../types';

/**
 * Axios adapter — wraps axios internals behind the unified HttpInstance interface.
 * Axios-specific types (AxiosResponse, AxiosError, etc.) are NOT exported.
 */
export class AxiosAdapter extends Adapter {
  private instance: AxiosInstance | null = null;

  create(options: HttpOptions): HttpInstance {
    // Cast our unified config to axios-compatible config at the boundary
    this.instance = axios.create(options as any);
    return this.instance as unknown as HttpInstance;
  }

  private ensureInstance(options?: HttpOptions): AxiosInstance {
    if (this.instance) return this.instance;
    this.instance = axios.create((options || {}) as any);
    return this.instance;
  }

  async request<T = unknown>(options: HttpOptions): Promise<T> {
    const inst = this.ensureInstance(options);
    const res = await inst.request(options as any);
    return options?.getResponse ? (res as unknown as T) : (res.data as T);
  }
}

export const axiosAdapter = new AxiosAdapter();
