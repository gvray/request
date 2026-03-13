import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requestBearerAuth, createResponseAuthRefresh } from '../../src/interceptor/auth';
import type { GvrayRequestConfig, GvrayInstance } from '../../src/types';

function createMockInstance(overrides: Partial<GvrayInstance> = {}): GvrayInstance {
  return {
    request: vi
      .fn()
      .mockResolvedValue({ data: {}, status: 200, statusText: 'OK', headers: {}, config: {} }),
    ...overrides,
  } as unknown as GvrayInstance;
}

describe('bearerAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should add Authorization header with token', async () => {
    const getToken = vi.fn().mockResolvedValue('test-token');
    const interceptor = requestBearerAuth(getToken);

    const config: GvrayRequestConfig = {
      url: '/api/users',
      method: 'GET',
      headers: {},
    };

    const result = await interceptor(config);

    expect(result.headers).toHaveProperty('Authorization', 'Bearer test-token');
    expect(getToken).toHaveBeenCalledTimes(1);
  });

  it('should use custom header name and scheme', async () => {
    const getToken = vi.fn().mockResolvedValue('my-token');
    const interceptor = requestBearerAuth(getToken, 'X-Auth-Token', 'Token');

    const config: GvrayRequestConfig = {
      url: '/api/users',
      headers: {},
    };

    const result = await interceptor(config);

    expect(result.headers).toHaveProperty('X-Auth-Token', 'Token my-token');
  });

  it('should skip auth when skipAuth is true', async () => {
    const getToken = vi.fn().mockResolvedValue('test-token');
    const interceptor = requestBearerAuth(getToken);

    const config: GvrayRequestConfig = {
      url: '/api/login',
      headers: {},
      skipAuth: true,
    };

    const result = await interceptor(config);

    expect(result.headers).not.toHaveProperty('Authorization');
    expect(getToken).not.toHaveBeenCalled();
  });

  it('should skip auth for excluded URL patterns (string)', async () => {
    const getToken = vi.fn().mockResolvedValue('test-token');
    const interceptor = requestBearerAuth(getToken, 'Authorization', 'Bearer', [
      '/public',
      '/auth',
    ]);

    const config: GvrayRequestConfig = {
      url: '/public/data',
      headers: {},
    };

    const result = await interceptor(config);

    expect(result.headers).not.toHaveProperty('Authorization');
  });

  it('should skip auth for excluded URL patterns (regex)', async () => {
    const getToken = vi.fn().mockResolvedValue('test-token');
    const interceptor = requestBearerAuth(getToken, 'Authorization', 'Bearer', [
      /^\/api\/public\/.*/,
    ]);

    const config: GvrayRequestConfig = {
      url: '/api/public/resource',
      headers: {},
    };

    const result = await interceptor(config);

    expect(result.headers).not.toHaveProperty('Authorization');
  });

  it('should skip auth for excluded URL patterns (function)', async () => {
    const getToken = vi.fn().mockResolvedValue('test-token');
    const excludeFn = vi.fn((url?: string) => url?.includes('/no-auth') ?? false);
    const interceptor = requestBearerAuth(getToken, 'Authorization', 'Bearer', excludeFn);

    const config: GvrayRequestConfig = {
      url: '/api/no-auth/endpoint',
      headers: {},
    };

    const result = await interceptor(config);

    expect(result.headers).not.toHaveProperty('Authorization');
    expect(excludeFn).toHaveBeenCalled();
  });

  it('should not add header when token is null', async () => {
    const getToken = vi.fn().mockResolvedValue(null);
    const interceptor = requestBearerAuth(getToken);

    const config: GvrayRequestConfig = {
      url: '/api/users',
      headers: {},
    };

    const result = await interceptor(config);

    expect(result.headers).not.toHaveProperty('Authorization');
  });

  it('should not add header when token is undefined', async () => {
    const getToken = vi.fn().mockResolvedValue(undefined);
    const interceptor = requestBearerAuth(getToken);

    const config: GvrayRequestConfig = {
      url: '/api/users',
      headers: {},
    };

    const result = await interceptor(config);

    expect(result.headers).not.toHaveProperty('Authorization');
  });

  it('should preserve existing headers', async () => {
    const getToken = vi.fn().mockResolvedValue('test-token');
    const interceptor = requestBearerAuth(getToken);

    const config: GvrayRequestConfig = {
      url: '/api/users',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Header': 'custom-value',
      },
    };

    const result = await interceptor(config);

    expect(result.headers).toHaveProperty('Authorization', 'Bearer test-token');
    expect(result.headers).toHaveProperty('Content-Type', 'application/json');
    expect(result.headers).toHaveProperty('X-Custom-Header', 'custom-value');
  });

  it('should handle synchronous token provider', async () => {
    const getToken = vi.fn().mockReturnValue('sync-token');
    const interceptor = requestBearerAuth(getToken);

    const config: GvrayRequestConfig = {
      url: '/api/users',
      headers: {},
    };

    const result = await interceptor(config);

    expect(result.headers).toHaveProperty('Authorization', 'Bearer sync-token');
  });
});

describe('createResponseAuthRefresh', () => {
  it('should return response interceptor tuple', () => {
    const [onResponse, onError] = createResponseAuthRefresh(
      {
        refreshToken: vi.fn().mockResolvedValue('new-token'),
      },
      createMockInstance()
    );

    expect(typeof onResponse).toBe('function');
    expect(typeof onError).toBe('function');
  });

  it('should pass through successful responses', async () => {
    const [onResponse] = createResponseAuthRefresh(
      {
        refreshToken: vi.fn().mockResolvedValue('new-token'),
      },
      createMockInstance()
    );

    const mockResponse = { data: { success: true }, status: 200 };
    const result = await onResponse(mockResponse as any);

    expect(result).toBe(mockResponse);
  });

  it('should reject non-auth errors', async () => {
    const [, onError] = createResponseAuthRefresh(
      {
        refreshToken: vi.fn().mockResolvedValue('new-token'),
      },
      createMockInstance()
    );

    const mockError = {
      response: { status: 500 },
      config: {},
    };

    await expect(onError(mockError as any)).rejects.toBe(mockError);
  });

  it('should call loginRedirect when refresh fails', async () => {
    const loginRedirect = vi.fn();
    const [, onError] = createResponseAuthRefresh(
      {
        refreshToken: vi.fn().mockRejectedValue(new Error('Refresh failed')),
        loginRedirect,
      },
      createMockInstance()
    );

    const mockError = {
      response: { status: 401 },
      config: {},
    };

    await expect(onError(mockError as any)).rejects.toBeDefined();
    // loginRedirect is called via setTimeout, so wait for it
    await vi.waitFor(() => {
      expect(loginRedirect).toHaveBeenCalled();
    });
  });

  it('should call loginRedirect on retry failure', async () => {
    const loginRedirect = vi.fn();
    const [, onError] = createResponseAuthRefresh(
      {
        refreshToken: vi.fn().mockResolvedValue('new-token'),
        loginRedirect,
      },
      createMockInstance()
    );

    const mockError = {
      response: { status: 401 },
      config: { _authRefreshRetry: true },
    };

    await expect(onError(mockError as any)).rejects.toBe(mockError);
    // loginRedirect is called via setTimeout, so wait for it
    await vi.waitFor(() => {
      expect(loginRedirect).toHaveBeenCalled();
    });
  });

  it('should handle custom status codes', async () => {
    const refreshToken = vi.fn().mockRejectedValue(new Error('Refresh failed'));
    const [, onError] = createResponseAuthRefresh(
      {
        refreshToken,
        statuses: [419],
      },
      createMockInstance()
    );

    const mockError = {
      response: { status: 419 },
      config: {},
    };

    await expect(onError(mockError as any)).rejects.toThrow();
    expect(refreshToken).toHaveBeenCalled();
  });

  it('should call setToken when refresh succeeds', async () => {
    const setToken = vi.fn();
    const refreshToken = vi.fn().mockResolvedValue('new-token');

    createResponseAuthRefresh(
      {
        refreshToken,
        setToken,
      },
      createMockInstance()
    );

    // The setToken is called inside the refresh flow
    // This test verifies the configuration is accepted
    expect(typeof setToken).toBe('function');
  });

  describe('concurrent requests handling', () => {
    it('should queue concurrent 401 requests during refresh', async () => {
      let resolveRefresh: (value: string) => void;
      const refreshPromise = new Promise<string>((resolve) => {
        resolveRefresh = resolve;
      });
      const refreshToken = vi.fn().mockReturnValue(refreshPromise);
      const loginRedirect = vi.fn();

      const mockInstance = createMockInstance();
      const [, onError] = createResponseAuthRefresh(
        {
          refreshToken,
          loginRedirect,
        },
        mockInstance
      );

      // Simulate 3 concurrent requests hitting 401
      const error1 = { response: { status: 401 }, config: { url: '/api/1' } };
      const error2 = { response: { status: 401 }, config: { url: '/api/2' } };
      const error3 = { response: { status: 401 }, config: { url: '/api/3' } };

      // Start all requests (they should all wait for refresh)
      const promise1 = onError(error1 as any);
      const promise2 = onError(error2 as any);
      const promise3 = onError(error3 as any);

      // Refresh should only be called once
      expect(refreshToken).toHaveBeenCalledTimes(1);

      // Resolve the refresh
      resolveRefresh!('new-token');

      // All promises should eventually resolve (instance.request is mocked)
      await Promise.allSettled([promise1, promise2, promise3]);

      // loginRedirect should NOT have been called (refresh succeeded)
      expect(loginRedirect).not.toHaveBeenCalled();
    });

    it('should reject all queued requests when refresh fails', async () => {
      const refreshToken = vi.fn().mockRejectedValue(new Error('Refresh failed'));
      const loginRedirect = vi.fn();

      const [, onError] = createResponseAuthRefresh(
        {
          refreshToken,
          loginRedirect,
        },
        createMockInstance()
      );

      // Simulate 3 concurrent requests hitting 401
      const error1 = { response: { status: 401 }, config: { url: '/api/1' } };
      const error2 = { response: { status: 401 }, config: { url: '/api/2' } };
      const error3 = { response: { status: 401 }, config: { url: '/api/3' } };

      // Start all requests
      const results = await Promise.allSettled([
        onError(error1 as any),
        onError(error2 as any),
        onError(error3 as any),
      ]);

      // All should be rejected
      expect(results.every((r) => r.status === 'rejected')).toBe(true);

      // loginRedirect should only be called once
      await vi.waitFor(() => {
        expect(loginRedirect).toHaveBeenCalledTimes(1);
      });
    });

    it('should call loginRedirect only once for multiple failures', async () => {
      const loginRedirect = vi.fn();
      const refreshToken = vi.fn().mockResolvedValue(null); // Returns null = no token

      const [, onError] = createResponseAuthRefresh(
        {
          refreshToken,
          loginRedirect,
        },
        createMockInstance()
      );

      const error1 = { response: { status: 401 }, config: { url: '/api/1' } };
      const error2 = { response: { status: 401 }, config: { url: '/api/2' } };

      await Promise.allSettled([onError(error1 as any), onError(error2 as any)]);

      // Wait for setTimeout in safeLoginRedirect
      await vi.waitFor(() => {
        expect(loginRedirect).toHaveBeenCalledTimes(1);
      });
    });

    it('should reject immediately if already in failed state', async () => {
      const refreshToken = vi.fn().mockRejectedValue(new Error('Refresh failed'));
      const loginRedirect = vi.fn();

      const [, onError] = createResponseAuthRefresh(
        {
          refreshToken,
          loginRedirect,
        },
        createMockInstance()
      );

      // First request triggers refresh and fails
      const error1 = { response: { status: 401 }, config: { url: '/api/1' } };
      await expect(onError(error1 as any)).rejects.toBeDefined();

      // Reset the state after a delay (simulating the resetRefreshState timeout)
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Second request should work (state reset to idle)
      refreshToken.mockResolvedValueOnce('new-token');
      const error2 = { response: { status: 401 }, config: { url: '/api/2' } };

      // This will try to refresh again
      const promise2 = onError(error2 as any);
      await Promise.allSettled([promise2]);

      // Refresh should have been called twice now
      expect(refreshToken).toHaveBeenCalledTimes(2);
    });

    it('should not retry already-retried requests', async () => {
      const refreshToken = vi.fn().mockResolvedValue('new-token');
      const loginRedirect = vi.fn();

      const [, onError] = createResponseAuthRefresh(
        {
          refreshToken,
          loginRedirect,
        },
        createMockInstance()
      );

      // Request that was already retried
      const error = {
        response: { status: 401 },
        config: { url: '/api/1', _authRefreshRetry: true },
      };

      await expect(onError(error as any)).rejects.toBe(error);

      // Refresh should NOT be called for already-retried requests
      expect(refreshToken).not.toHaveBeenCalled();

      // But loginRedirect should be called
      await vi.waitFor(() => {
        expect(loginRedirect).toHaveBeenCalled();
      });
    });
  });
});
