import { describe, it, expect } from 'vitest';
import { withCredentials } from '../../src/interceptor/credentials';
import type { HttpRequestOptions } from '../../src/types';

describe('withCredentials', () => {
  it('should set withCredentials to true', async () => {
    const interceptor = withCredentials();

    const config: HttpRequestOptions = {
      url: '/api/users',
      headers: {},
    };

    const result = await interceptor(config);

    expect(result.withCredentials).toBe(true);
  });

  it('should preserve other config options', async () => {
    const interceptor = withCredentials();

    const config: HttpRequestOptions = {
      url: '/api/users',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: { name: 'test' },
    };

    const result = await interceptor(config);

    expect(result.withCredentials).toBe(true);
    expect(result.url).toBe('/api/users');
    expect(result.method).toBe('POST');
    expect(result.headers).toHaveProperty('Content-Type', 'application/json');
    expect(result.data).toEqual({ name: 'test' });
  });

  it('should override existing withCredentials value', async () => {
    const interceptor = withCredentials();

    const config: HttpRequestOptions = {
      url: '/api/users',
      headers: {},
      withCredentials: false,
    };

    const result = await interceptor(config);

    expect(result.withCredentials).toBe(true);
  });
});
