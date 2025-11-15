import { Adapter } from './Adapter';
import type { RequestOptions, UnifiedResponse } from '../types';

class FetchAdapterImpl extends Adapter {
  private async parseBody(res: Response, responseType?: RequestOptions['responseType']): Promise<any> {
    const contentType = res.headers.get('content-type') || '';

    // explicit responseType overrides auto-detection
    switch (responseType) {
      case 'text':
        return await res.text();
      case 'blob':
        return await res.blob();
      case 'arrayBuffer':
        return await res.arrayBuffer();
      case 'json':
        // fallthrough to auto json parsing below
        break;
      default:
        // auto detect
        break;
    }

    if (contentType.includes('application/json')) {
      try {
        return await res.json();
      } catch (_) {
        try {
          return await res.text();
        } catch (__) {
          return undefined;
        }
      }
    }
    try {
      return await res.text();
    } catch (_) {
      return undefined;
    }
  }

  async request<T = any>(url: string, options: RequestOptions): Promise<UnifiedResponse<T>> {
    const method = (options.method || 'GET').toUpperCase();
    const payload = this.getPayload(options);
    const defaultHeaders = this.getDefaultHeaders(payload);
    const headers = this.mergeHeaders(defaultHeaders, options.headers);

    const finalUrl = this.finalizeUrl(options.baseURL, url, options.params);

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
    let timeoutId: any = null;
    if (controller && options.timeout && options.timeout > 0) {
      timeoutId = setTimeout(() => controller.abort(), options.timeout);
    }

    // Prepare body according to method and content type
    let body: BodyInit | null = null;
    const isGetLike = method === 'GET' || method === 'HEAD';
    if (!isGetLike && payload !== undefined && payload !== null) {
      const ct = headers['Content-Type'] || headers['content-type'] || '';
      const isJson = typeof payload !== 'string' && !(
        (typeof FormData !== 'undefined' && payload instanceof FormData) ||
        (typeof Blob !== 'undefined' && payload instanceof Blob) ||
        (typeof ArrayBuffer !== 'undefined' && payload instanceof ArrayBuffer)
      ) && ct.includes('application/json');
      body = isJson ? (JSON.stringify(payload) as any) : (payload as any);
    }

    const init: RequestInit = {
      method,
      headers,
      body,
    } as RequestInit;
    if (controller) {
      // Only attach signal when a controller exists. Avoid passing null which some runtimes reject.
      (init as any).signal = controller.signal;
    }

    try {
      const res = await fetch(finalUrl, init);
      if (timeoutId) clearTimeout(timeoutId);
      const data = (await this.parseBody(res, options.responseType)) as T;

      const headersObj: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        headersObj[key] = value;
      });

      const unified = this.toUnifiedResponse<T>(data, res.status, headersObj, finalUrl, res);
      return unified;
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);
      throw error;
    }
  }
}

export const fetchAdapter = new FetchAdapterImpl();