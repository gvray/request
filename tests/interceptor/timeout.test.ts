import { describe, it, expect } from 'vitest';
import { timeout, defaultTimeout } from '../../src/interceptor/timeout';
import type { HttpRequestOptions } from '../../src/types';

describe('timeout', () => {
  it('should set timeout from number', async () => {
    const interceptor = timeout(5000);

    const config: HttpRequestOptions = {
      url: '/api/users',
      headers: {},
    };

    const result = await interceptor(config);

    expect(result.timeout).toBe(5000);
  });

  it('should set timeout from options object', async () => {
    const interceptor = timeout({ timeout: 10000 });

    const config: HttpRequestOptions = {
      url: '/api/users',
      headers: {},
    };

    const result = await interceptor(config);

    expect(result.timeout).toBe(10000);
  });

  it('should set timeout error message', async () => {
    const interceptor = timeout({
      timeout: 5000,
      message: 'Request timed out',
    });

    const config: HttpRequestOptions = {
      url: '/api/users',
      headers: {},
    };

    const result = await interceptor(config);

    expect(result.timeout).toBe(5000);
    expect((result as any).timeoutErrorMessage).toBe('Request timed out');
  });

  it('should NOT override existing timeout', async () => {
    const interceptor = timeout(5000);

    const config: HttpRequestOptions = {
      url: '/api/users',
      headers: {},
      timeout: 10000,
    };

    const result = await interceptor(config);

    expect(result.timeout).toBe(10000);
  });

  it('should preserve other config options', async () => {
    const interceptor = timeout(5000);

    const config: HttpRequestOptions = {
      url: '/api/users',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: { name: 'test' },
    };

    const result = await interceptor(config);

    expect(result.timeout).toBe(5000);
    expect(result.url).toBe('/api/users');
    expect(result.method).toBe('POST');
    expect(result.headers).toHaveProperty('Content-Type', 'application/json');
    expect(result.data).toEqual({ name: 'test' });
  });
});

describe('defaultTimeout', () => {
  it('should set timeout to 60 seconds', async () => {
    const interceptor = defaultTimeout();

    const config: HttpRequestOptions = {
      url: '/api/users',
      headers: {},
    };

    const result = await interceptor(config);

    expect(result.timeout).toBe(60000);
  });

  it('should NOT override existing timeout', async () => {
    const interceptor = defaultTimeout();

    const config: HttpRequestOptions = {
      url: '/api/users',
      headers: {},
      timeout: 30000,
    };

    const result = await interceptor(config);

    expect(result.timeout).toBe(30000);
  });
});
