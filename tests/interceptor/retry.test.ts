import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createResponseRetry, responseRetry } from '../../src/interceptor/retry';
import type { AxiosError } from 'axios';
import type { GvrayInstance } from '../../src/types';

function createMockInstance(overrides: Partial<GvrayInstance> = {}): GvrayInstance {
  return {
    request: vi
      .fn()
      .mockResolvedValue({ data: {}, status: 200, statusText: 'OK', headers: {}, config: {} }),
    ...overrides,
  } as unknown as GvrayInstance;
}

describe('createRetryInterceptor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('should return response and error interceptor tuple', () => {
    const [onResponse, onError] = createResponseRetry(undefined, createMockInstance());

    expect(typeof onResponse).toBe('function');
    expect(typeof onError).toBe('function');
  });

  it('should pass through successful responses', async () => {
    const [onResponse] = createResponseRetry(undefined, createMockInstance());

    const mockResponse = { data: { success: true }, status: 200 };
    const result = await onResponse(mockResponse as any);

    expect(result).toBe(mockResponse);
  });

  it('should reject non-retryable errors', async () => {
    const [, onError] = createResponseRetry(undefined, createMockInstance());

    const mockError = {
      response: { status: 400 },
      config: {},
    } as AxiosError;

    await expect(onError(mockError)).rejects.toBe(mockError);
  });

  it('should reject errors without config', async () => {
    const [, onError] = createResponseRetry(undefined, createMockInstance());

    const mockError = {
      response: { status: 500 },
    } as AxiosError;

    await expect(onError(mockError)).rejects.toBe(mockError);
  });

  it('should reject after max retries exceeded', async () => {
    const [, onError] = createResponseRetry({ maxRetries: 2 }, createMockInstance());

    const mockError = {
      response: { status: 500 },
      config: { _retryCount: 2 },
    } as AxiosError & { config: { _retryCount: number } };

    await expect(onError(mockError)).rejects.toBe(mockError);
  });

  it('should call onRetry callback', async () => {
    const onRetryCallback = vi.fn();
    const mockInstance = createMockInstance();
    const [, onError] = createResponseRetry(
      {
        maxRetries: 3,
        onRetry: onRetryCallback,
      },
      mockInstance
    );

    const mockError = {
      response: { status: 500 },
      config: { url: '/api/test' },
    } as AxiosError;

    // Start the error handler - it will try to retry
    void Promise.resolve(onError(mockError)).catch(() => {});

    // Advance timers to trigger the retry delay
    await vi.advanceTimersByTimeAsync(1000);

    // The onRetry should have been called
    expect(onRetryCallback).toHaveBeenCalledWith(1, mockError, expect.any(Object));
  });

  it('should use custom retryable statuses', async () => {
    const [, onError] = createResponseRetry(
      {
        retryableStatuses: [418],
      },
      createMockInstance()
    );

    const mockError = {
      response: { status: 500 },
      config: {},
    } as AxiosError;

    // 500 is not in custom list, should reject immediately
    await expect(onError(mockError)).rejects.toBe(mockError);
  });

  it('should use custom retry condition', async () => {
    const retryCondition = vi.fn().mockReturnValue(false);
    const [, onError] = createResponseRetry(
      {
        retryCondition,
      },
      createMockInstance()
    );

    const mockError = {
      response: { status: 500 },
      config: {},
    } as AxiosError;

    await expect(onError(mockError)).rejects.toBe(mockError);
    expect(retryCondition).toHaveBeenCalledWith(mockError);
  });

  it('should retry on network errors', async () => {
    const onRetryCallback = vi.fn();
    const [, onError] = createResponseRetry(
      {
        onRetry: onRetryCallback,
      },
      createMockInstance()
    );

    const mockError = {
      code: 'ERR_NETWORK',
      config: { url: '/api/test' },
    } as AxiosError;

    void Promise.resolve(onError(mockError)).catch(() => {});
    await vi.advanceTimersByTimeAsync(1000);

    expect(onRetryCallback).toHaveBeenCalled();
  });

  it('should retry on timeout errors', async () => {
    const onRetryCallback = vi.fn();
    const [, onError] = createResponseRetry(
      {
        onRetry: onRetryCallback,
      },
      createMockInstance()
    );

    const mockError = {
      code: 'ECONNABORTED',
      message: 'timeout of 5000ms exceeded',
      config: { url: '/api/test' },
    } as AxiosError;

    void Promise.resolve(onError(mockError)).catch(() => {});
    await vi.advanceTimersByTimeAsync(1000);

    expect(onRetryCallback).toHaveBeenCalled();
  });
});

describe('retry helper', () => {
  it('should create retry interceptor with default max retries', () => {
    const [onResponse, onError] = responseRetry()(createMockInstance());

    expect(typeof onResponse).toBe('function');
    expect(typeof onError).toBe('function');
  });

  it('should create retry interceptor with custom max retries', () => {
    const [onResponse, onError] = responseRetry(5)(createMockInstance());

    expect(typeof onResponse).toBe('function');
    expect(typeof onError).toBe('function');
  });
});
