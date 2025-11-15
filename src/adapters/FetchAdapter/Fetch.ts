import { Adapter } from '@/adapters/Adapter';
import type { RequestOptions } from '../../types';

export class FetchAdapter extends Adapter {
  private defaultConfig: RequestOptions | null = null;

  create<T = any>(options: RequestOptions): T {
    this.defaultConfig = options;
    return options as unknown as T;
  }

  private buildUrl(options: RequestOptions): string {
    const baseURL = options.baseURL || this.defaultConfig?.baseURL || '';
    const url = `${baseURL || ''}${options.url || ''}`;
    const params = options.params || {};
    const usp = new URLSearchParams();
    Object.entries(params as Record<string, any>).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      if (Array.isArray(v)) {
        v.forEach((item) => usp.append(k, String(item)));
      } else {
        usp.append(k, String(v));
      }
    });
    const qs = usp.toString();
    return qs ? `${url}${url.includes('?') ? '&' : '?'}${qs}` : url;
  }

  private toFetchInit(options: RequestOptions): RequestInit {
    const method = (options.method || 'GET').toUpperCase();
    const headers: Record<string, string> = {
      ...((this.defaultConfig?.headers as Record<string, string>) || {}),
      ...((options.headers as Record<string, string>) || {}),
    };
    let body: BodyInit | null = null;
    const data = options.data as any;
    if (data !== undefined && data !== null && method !== 'GET' && method !== 'HEAD') {
      if (typeof data === 'string' || data instanceof Blob || data instanceof FormData) {
        body = data as BodyInit;
      } else {
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
        body = JSON.stringify(data);
      }
    }

    const init: RequestInit = {
      method,
      headers,
      body,
    };

    // credentials mapping if provided
    if ((options as any).withCredentials) {
      (init as any).credentials = 'include';
    }

    // timeout support via AbortController
    const timeout = (options as any).timeout || (this.defaultConfig as any)?.timeout;
    if (typeof timeout === 'number' && timeout > 0) {
      const controller = new AbortController();
      init.signal = controller.signal;
      setTimeout(() => controller.abort(), timeout);
    }

    return init;
  }

  private async parseResponse<T = any>(res: Response, options: RequestOptions): Promise<T> {
    const responseType = (options as any).responseType || 'json';
    if (options?.getResponse) return res as unknown as T;

    try {
      if (responseType === 'text') {
        return (await res.text()) as unknown as T;
      }
      if (responseType === 'blob') {
        return (await res.blob()) as unknown as T;
      }
      // default json
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return (await res.json()) as T;
      }
      // fallback to text
      return (await res.text()) as unknown as T;
    } catch (e) {
      // if parsing fails, throw error
      throw e;
    }
  }

  async request<T = any>(options: RequestOptions): Promise<T> {
    const url = this.buildUrl({ ...(this.defaultConfig || {}), ...options });
    const init = this.toFetchInit({ ...(this.defaultConfig || {}), ...options });
    const res = await fetch(url, init);
    if (!res.ok) {
      // mimic axios error shape minimally
      const error: any = new Error(res.statusText);
      error.response = {
        status: res.status,
        data: await this.safeJson(res),
        headers: this.headersToObject(res.headers),
      };
      error.request = { url, init };
      throw error;
    }
    return this.parseResponse<T>(res, options);
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

  // helpers
  private async safeJson(res: Response): Promise<any> {
    try {
      return await res.clone().json();
    } catch {
      try {
        return await res.clone().text();
      } catch {
        return null;
      }
    }
  }

  private headersToObject(headers: Headers): Record<string, string> {
    const obj: Record<string, string> = {};
    headers.forEach((v, k) => {
      obj[k] = v;
    });
    return obj;
  }
}

export const fetchAdapter = new FetchAdapter();
