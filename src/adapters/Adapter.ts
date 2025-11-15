import type { HttpAdapter, RequestOptions, UnifiedResponse } from '../types';

// Base adapter providing common utilities and conventions for all transport implementations
export abstract class Adapter implements HttpAdapter {
  // Build query string from params
  protected buildQueryString(params?: RequestOptions['params']): string {
    if (!params) return '';
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      sp.append(k, String(v));
    });
    const qs = sp.toString();
    return qs ? `?${qs}` : '';
  }

  // Prefer axios-like `data`, fallback to fetch-like `body`
  protected getPayload(options: RequestOptions): any {
    const payload = options.data !== undefined ? options.data : options.body;
    return payload;
  }

  // Default headers; if payload is FormData/Blob/ArrayBuffer or string, respect it
  protected getDefaultHeaders(payload: any): Record<string, string> {
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    const isBlob = typeof Blob !== 'undefined' && payload instanceof Blob;
    const isArrayBuffer = typeof ArrayBuffer !== 'undefined' && payload instanceof ArrayBuffer;
    const isString = typeof payload === 'string';

    // For non-structured payloads, do not set content-type, let runtime decide
    if (isFormData || isBlob || isArrayBuffer) return {};
    // For string, assume caller set appropriate type; do not force JSON
    if (isString) return {};
    // Otherwise default to JSON
    return { 'Content-Type': 'application/json' };
  }

  // Merge headers with defaults, user headers take precedence
  protected mergeHeaders(
    defaults: Record<string, string>,
    user?: Record<string, string>
  ): Record<string, string> {
    return { ...defaults, ...(user || {}) };
  }

  // Compose final URL from baseURL + url + query string
  protected finalizeUrl(
    baseURL: string | undefined,
    url: string,
    params?: RequestOptions['params']
  ): string {
    const qs = this.buildQueryString(params);
    const base = baseURL ?? '';
    return `${base}${url}${qs}`;
  }

  // Helper to create unified response object
  protected toUnifiedResponse<T>(
    data: any,
    status: number,
    headers: Record<string, string>,
    url: string,
    raw: any
  ): UnifiedResponse<T> {
    return { data: data as T, status, headers, url, raw };
  }

  // Contract: subclasses must implement the actual transport
  abstract request<T = any>(url: string, options: RequestOptions): Promise<UnifiedResponse<T>>;
}
