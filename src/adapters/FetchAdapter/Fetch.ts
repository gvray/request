import { Adapter } from '@/adapters/Adapter';
import type { GvrayInstance, GvrayOptions } from '../../types';
import { createInstance } from '../../core/fetch';
import type { FetchInstance } from '../../core/fetch';

/**
 * Fetch adapter — wraps the core/fetch engine behind the unified GvrayInstance interface.
 * The actual fetch implementation lives in src/core/fetch/ (mirroring axios structure).
 */
export class FetchAdapter extends Adapter {
  private instance: FetchInstance | null = null;
  private defaultConfig: GvrayOptions = {};

  create(options: GvrayOptions): GvrayInstance {
    this.defaultConfig = options;
    this.instance = createInstance(options);
    return this.instance as unknown as GvrayInstance;
  }

  private ensureInstance(): FetchInstance {
    if (this.instance) return this.instance;
    this.instance = createInstance(this.defaultConfig);
    return this.instance;
  }

  async request<T = any>(options: GvrayOptions): Promise<T> {
    const inst = this.ensureInstance();
    const res = await inst.request(options);
    return options?.getResponse ? (res as unknown as T) : (res.data as T);
  }
}

export const fetchAdapter = new FetchAdapter();
