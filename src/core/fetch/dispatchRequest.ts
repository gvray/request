/**
 * dispatchRequest — mirrors axios core/dispatchRequest
 * Handles the actual fetch() call, URL building, header merging,
 * transform, response parsing, and status validation (settle).
 */

import { FetchError } from './FetchError';
import { CanceledError } from './CanceledError';
import { buildFullPath } from './buildFullPath';
import { buildURL } from './buildURL';
import { mergeConfig } from './mergeConfig';
import { settle } from './settle';
import type {
  FetchRequestConfig,
  FetchResponse,
  FetchRequestInfo,
  FetchRequestTransformer,
  FetchResponseTransformer,
} from './types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function headersToRecord(headers: Headers): Record<string, string> {
  const obj: Record<string, string> = {};
  headers.forEach((v, k) => {
    obj[k] = v;
  });
  return obj;
}

// ─── Transform helpers ───────────────────────────────────────────────────────

function applyTransformRequest(
  data: unknown,
  headers: Record<string, string>,
  fns?: FetchRequestTransformer | FetchRequestTransformer[]
): unknown {
  if (!fns) return data;
  const arr = Array.isArray(fns) ? fns : [fns];
  let result = data;
  for (const fn of arr) {
    result = fn(result, headers);
  }
  return result;
}

function applyTransformResponse(
  data: unknown,
  headers: Record<string, string>,
  status: number,
  fns?: FetchResponseTransformer | FetchResponseTransformer[]
): unknown {
  if (!fns) return data;
  const arr = Array.isArray(fns) ? fns : [fns];
  let result = data;
  for (const fn of arr) {
    result = fn(result, headers, status);
  }
  return result;
}

// ─── Build RequestInit ───────────────────────────────────────────────────────

function toRequestInit(config: FetchRequestConfig): RequestInit {
  const method = (config.method || 'GET').toUpperCase();
  const headers: Record<string, string> = { ...(config.headers || {}) };

  let body: BodyInit | null = null;
  let data: unknown = config.data;

  // Apply request transformers
  data = applyTransformRequest(data, headers, config.transformRequest);

  if (data !== undefined && data !== null && method !== 'GET' && method !== 'HEAD') {
    if (
      typeof data === 'string' ||
      data instanceof Blob ||
      data instanceof FormData ||
      data instanceof ArrayBuffer
    ) {
      body = data as BodyInit;
    } else {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
      body = JSON.stringify(data);
    }
  }

  const init: RequestInit = { method, headers, body };

  if (config.withCredentials) {
    init.credentials = 'include';
  }

  if (config.signal) {
    init.signal = config.signal;
  }

  return init;
}

// ─── Parse Response ──────────────────────────────────────────────────────────

async function parseResponseBody<T>(
  res: globalThis.Response,
  config: FetchRequestConfig
): Promise<T> {
  const responseType = config.responseType || 'json';
  try {
    if (responseType === 'text') return (await res.text()) as T;
    if (responseType === 'blob') return (await res.blob()) as T;
    if (responseType === 'arraybuffer') return (await res.arrayBuffer()) as T;

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return (await res.json()) as T;
    }
    return (await res.text()) as T;
  } catch {
    return null as T;
  }
}

// ─── Main dispatch ───────────────────────────────────────────────────────────

export async function dispatchRequest<T = unknown>(
  config: FetchRequestConfig,
  defaults: FetchRequestConfig
): Promise<FetchResponse<T>> {
  const mergedConfig = mergeConfig(defaults, config);
  const fullPath = buildFullPath(mergedConfig.baseURL, mergedConfig.url);
  const url = buildURL(fullPath, mergedConfig.params);
  const init = toRequestInit(mergedConfig);

  // Timeout handling
  let controller: AbortController | undefined;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = mergedConfig.timeout;
  if (typeof timeout === 'number' && timeout > 0 && !mergedConfig.signal) {
    controller = new AbortController();
    init.signal = controller.signal;
    timeoutId = setTimeout(() => controller!.abort(), timeout);
  }

  const requestInfo: FetchRequestInfo = { url, init };

  let res: globalThis.Response;
  try {
    res = await fetch(url, init);
  } catch (e: unknown) {
    if (timeoutId) clearTimeout(timeoutId);
    const err = e instanceof Error ? e : new Error(String(e));
    if (err.name === 'AbortError') {
      // Distinguish user-cancel from timeout
      if (mergedConfig.signal?.aborted) {
        throw new CanceledError('canceled', mergedConfig);
      }
      const message = mergedConfig.timeoutErrorMessage || `timeout of ${timeout}ms exceeded`;
      throw new FetchError(message, FetchError.ETIMEDOUT, mergedConfig, requestInfo);
    }
    throw new FetchError(
      err.message || 'Network Error',
      FetchError.ERR_NETWORK,
      mergedConfig,
      requestInfo
    );
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }

  const responseHeaders = headersToRecord(res.headers);
  const rawData = await parseResponseBody<T>(res, mergedConfig);

  // Apply response transformers
  const data = applyTransformResponse(
    rawData,
    responseHeaders,
    res.status,
    mergedConfig.transformResponse
  ) as T;

  const response: FetchResponse<T> = {
    data,
    status: res.status,
    statusText: res.statusText,
    headers: responseHeaders,
    config: mergedConfig,
    request: requestInfo,
  };

  // Validate status (settle)
  return settle(response, mergedConfig);
}
