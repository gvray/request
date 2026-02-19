import { describe, it, expect, vi } from 'vitest';
import { jsonContentType, acceptLanguage } from '../../src/interceptor/headers';
import type { HttpRequestOptions } from '../../src/types';

describe('jsonContentType', () => {
  it('should add Content-Type header for POST request', async () => {
    const interceptor = jsonContentType();

    const config: HttpRequestOptions = {
      url: '/api/users',
      method: 'POST',
      headers: {},
    };

    const result = await interceptor(config);

    expect(result.headers).toHaveProperty('Content-Type', 'application/json');
  });

  it('should add Content-Type header for PUT request', async () => {
    const interceptor = jsonContentType();

    const config: HttpRequestOptions = {
      url: '/api/users',
      method: 'PUT',
      headers: {},
    };

    const result = await interceptor(config);

    expect(result.headers).toHaveProperty('Content-Type', 'application/json');
  });

  it('should add Content-Type header for PATCH request', async () => {
    const interceptor = jsonContentType();

    const config: HttpRequestOptions = {
      url: '/api/users',
      method: 'PATCH',
      headers: {},
    };

    const result = await interceptor(config);

    expect(result.headers).toHaveProperty('Content-Type', 'application/json');
  });

  it('should add Content-Type header for DELETE request', async () => {
    const interceptor = jsonContentType();

    const config: HttpRequestOptions = {
      url: '/api/users',
      method: 'DELETE',
      headers: {},
    };

    const result = await interceptor(config);

    expect(result.headers).toHaveProperty('Content-Type', 'application/json');
  });

  it('should NOT add Content-Type header for GET request', async () => {
    const interceptor = jsonContentType();

    const config: HttpRequestOptions = {
      url: '/api/users',
      method: 'GET',
      headers: {},
    };

    const result = await interceptor(config);

    expect(result.headers).not.toHaveProperty('Content-Type');
  });

  it('should NOT add Content-Type header for HEAD request', async () => {
    const interceptor = jsonContentType();

    const config: HttpRequestOptions = {
      url: '/api/users',
      method: 'HEAD',
      headers: {},
    };

    const result = await interceptor(config);

    expect(result.headers).not.toHaveProperty('Content-Type');
  });

  it('should NOT override existing Content-Type header', async () => {
    const interceptor = jsonContentType();

    const config: HttpRequestOptions = {
      url: '/api/users',
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    const result = await interceptor(config);

    expect(result.headers).toHaveProperty('Content-Type', 'multipart/form-data');
  });

  it('should handle lowercase method', async () => {
    const interceptor = jsonContentType();

    const config: HttpRequestOptions = {
      url: '/api/users',
      method: 'post',
      headers: {},
    };

    const result = await interceptor(config);

    expect(result.headers).toHaveProperty('Content-Type', 'application/json');
  });

  it('should default to GET when method is not specified', async () => {
    const interceptor = jsonContentType();

    const config: HttpRequestOptions = {
      url: '/api/users',
      headers: {},
    };

    const result = await interceptor(config);

    expect(result.headers).not.toHaveProperty('Content-Type');
  });
});

describe('acceptLanguage', () => {
  it('should add Accept-Language header', async () => {
    const getLocale = vi.fn().mockResolvedValue('zh-CN');
    const interceptor = acceptLanguage(getLocale);

    const config: HttpRequestOptions = {
      url: '/api/users',
      headers: {},
    };

    const result = await interceptor(config);

    expect(result.headers).toHaveProperty('Accept-Language', 'zh-CN');
    expect(getLocale).toHaveBeenCalledTimes(1);
  });

  it('should use custom header name', async () => {
    const getLocale = vi.fn().mockResolvedValue('en-US');
    const interceptor = acceptLanguage(getLocale, 'X-Locale');

    const config: HttpRequestOptions = {
      url: '/api/users',
      headers: {},
    };

    const result = await interceptor(config);

    expect(result.headers).toHaveProperty('X-Locale', 'en-US');
  });

  it('should not add header when locale is null', async () => {
    const getLocale = vi.fn().mockResolvedValue(null);
    const interceptor = acceptLanguage(getLocale);

    const config: HttpRequestOptions = {
      url: '/api/users',
      headers: {},
    };

    const result = await interceptor(config);

    expect(result.headers).not.toHaveProperty('Accept-Language');
  });

  it('should not add header when locale is undefined', async () => {
    const getLocale = vi.fn().mockResolvedValue(undefined);
    const interceptor = acceptLanguage(getLocale);

    const config: HttpRequestOptions = {
      url: '/api/users',
      headers: {},
    };

    const result = await interceptor(config);

    expect(result.headers).not.toHaveProperty('Accept-Language');
  });

  it('should preserve existing headers', async () => {
    const getLocale = vi.fn().mockResolvedValue('fr-FR');
    const interceptor = acceptLanguage(getLocale);

    const config: HttpRequestOptions = {
      url: '/api/users',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const result = await interceptor(config);

    expect(result.headers).toHaveProperty('Accept-Language', 'fr-FR');
    expect(result.headers).toHaveProperty('Content-Type', 'application/json');
  });

  it('should handle synchronous locale provider', async () => {
    const getLocale = vi.fn().mockReturnValue('de-DE');
    const interceptor = acceptLanguage(getLocale);

    const config: HttpRequestOptions = {
      url: '/api/users',
      headers: {},
    };

    const result = await interceptor(config);

    expect(result.headers).toHaveProperty('Accept-Language', 'de-DE');
  });
});
