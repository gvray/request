import type { HttpAdapter, RequestOptions, UnifiedResponse } from '../types'

const buildQueryString = (params?: RequestOptions['params']) => {
  if (!params) return '';
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    sp.append(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
};

const getBody = (options: RequestOptions) => {
  // prefer data, fallback to body
  const payload = options.data !== undefined ? options.data : options.body;
  if (payload === undefined || payload === null) return undefined;
  // If FormData/Blob/ArrayBuffer/ReadableStream, pass through; otherwise JSON
  if (
    typeof FormData !== 'undefined' && payload instanceof FormData ||
    typeof Blob !== 'undefined' && payload instanceof Blob ||
    typeof ArrayBuffer !== 'undefined' && payload instanceof ArrayBuffer
  ) {
    return payload as BodyInit;
  }
  if (typeof payload === 'string') return payload;
  return JSON.stringify(payload);
};

export const fetchAdapter: HttpAdapter = {
  async request<T = any>(url: string, options: RequestOptions): Promise<UnifiedResponse<T>> {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
    const timeout = options.timeout ?? 30000;
    const timer = controller ? setTimeout(() => controller.abort(), Math.max(0, timeout)) : undefined;

    try {
      const baseURL = options.baseURL ?? '';
      const qs = buildQueryString(options.params);
      const finalUrl = `${baseURL}${url}${qs}`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers,
      };
      // If body is FormData or Blob, remove default content-type to let browser set boundary
      const payload = options.data !== undefined ? options.data : options.body;
      if (typeof FormData !== 'undefined' && payload instanceof FormData) {
        delete headers['Content-Type'];
      }

      const init: RequestInit = {
        method: options.method ?? 'GET',
        headers,
        body: getBody(options),
        signal: controller?.signal,
      };

      const res = await fetch(finalUrl, init);
      const ct = res.headers.get('content-type') || '';
      let data: any;
      if (ct.includes('application/json')) {
        data = await res.json().catch(() => undefined);
      } else {
        data = await res.text().catch(() => undefined);
      }

      const headersObj: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        headersObj[key] = value;
      });

      const unified: UnifiedResponse<T> = {
        data: data as T,
        status: res.status,
        headers: headersObj,
        url: res.url,
        raw: res,
      };

      return unified;
    } finally {
      if (timer) clearTimeout(timer);
    }
  },
};