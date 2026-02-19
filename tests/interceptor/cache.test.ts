import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCacheInterceptor, cache, MemoryCacheStorage } from '../../src/interceptor/cache';
import type { HttpRequestOptions, HttpResponse } from '../../src/types';

describe('createCacheInterceptor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return request and response interceptors with storage', () => {
    const cacheInterceptor = createCacheInterceptor();

    expect(typeof cacheInterceptor.request).toBe('function');
    expect(Array.isArray(cacheInterceptor.response)).toBe(true);
    expect(cacheInterceptor.response.length).toBe(2);
    expect(typeof cacheInterceptor.storage).toBe('object');
    expect(typeof cacheInterceptor.clear).toBe('function');
  });

  it('should skip caching for non-GET requests by default', async () => {
    const { request } = createCacheInterceptor();

    const config: HttpRequestOptions = {
      url: '/api/users',
      method: 'POST',
      headers: {},
    };

    const result = await request(config);

    expect((result as any)._fromCache).toBeUndefined();
  });

  it('should skip caching for excluded URLs (string)', async () => {
    const { request } = createCacheInterceptor({
      exclude: ['/api/no-cache'],
    });

    const config: HttpRequestOptions = {
      url: '/api/no-cache/data',
      method: 'GET',
      headers: {},
    };

    const result = await request(config);

    expect((result as any)._fromCache).toBeUndefined();
  });

  it('should skip caching for excluded URLs (regex)', async () => {
    const { request } = createCacheInterceptor({
      exclude: [/\/api\/live\/.*/],
    });

    const config: HttpRequestOptions = {
      url: '/api/live/stream',
      method: 'GET',
      headers: {},
    };

    const result = await request(config);

    expect((result as any)._fromCache).toBeUndefined();
  });

  it('should skip caching when forceRefresh is true', async () => {
    const { request, storage } = createCacheInterceptor();

    // Pre-populate cache
    await storage.set('GET:/api/users:', {
      data: { cached: true },
      timestamp: Date.now(),
      expiresAt: Date.now() + 300000,
    });

    const config: HttpRequestOptions = {
      url: '/api/users',
      method: 'GET',
      headers: {},
      forceRefresh: true,
    } as any;

    const result = await request(config);

    expect((result as any)._fromCache).toBeUndefined();
  });

  it('should skip caching when noCache is true', async () => {
    const { request, storage } = createCacheInterceptor();

    // Pre-populate cache
    await storage.set('GET:/api/users:', {
      data: { cached: true },
      timestamp: Date.now(),
      expiresAt: Date.now() + 300000,
    });

    const config: HttpRequestOptions = {
      url: '/api/users',
      method: 'GET',
      headers: {},
      noCache: true,
    } as any;

    const result = await request(config);

    expect((result as any)._fromCache).toBeUndefined();
  });

  it('should call onCacheHit callback when cache is hit', async () => {
    const onCacheHit = vi.fn();
    const { request, storage } = createCacheInterceptor({ onCacheHit });

    // Pre-populate cache
    const cacheKey = 'GET:/api/users:';
    const cacheEntry = {
      data: { cached: true },
      timestamp: Date.now(),
      expiresAt: Date.now() + 300000,
    };
    await storage.set(cacheKey, cacheEntry);

    const config: HttpRequestOptions = {
      url: '/api/users',
      method: 'GET',
      headers: {},
    };

    await request(config);

    expect(onCacheHit).toHaveBeenCalledWith(
      cacheKey,
      expect.objectContaining({ data: { cached: true } })
    );
  });

  it('should call onCacheMiss callback when cache is missed', async () => {
    const onCacheMiss = vi.fn();
    const { request } = createCacheInterceptor({ onCacheMiss });

    const config: HttpRequestOptions = {
      url: '/api/users',
      method: 'GET',
      headers: {},
    };

    await request(config);

    expect(onCacheMiss).toHaveBeenCalled();
  });

  it('should use custom key generator', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const keyGenerator = vi.fn((url, _config) => `custom-${url}`);
    const onCacheMiss = vi.fn();
    const { request } = createCacheInterceptor({ keyGenerator, onCacheMiss });

    const config: HttpRequestOptions = {
      url: '/api/users',
      method: 'GET',
      headers: {},
    };

    await request(config);

    expect(keyGenerator).toHaveBeenCalledWith('/api/users', expect.any(Object));
    expect(onCacheMiss).toHaveBeenCalledWith('custom-/api/users');
  });

  it('should cache response and return cached data', async () => {
    const { request, response, storage } = createCacheInterceptor();
    const [onResponse] = response;

    // First request - cache miss
    const config: HttpRequestOptions = {
      url: '/api/users',
      method: 'GET',
      headers: {},
    };

    const processedConfig = await request(config);

    // Simulate response
    const mockResponse = {
      data: { users: [] },
      status: 200,
      config: processedConfig,
    } as HttpResponse;

    await onResponse(mockResponse);

    // Verify data was cached
    const cached = await storage.get(
      (processedConfig as Record<string, unknown>)._cacheKey as string
    );
    expect(cached).not.toBeNull();
    expect(cached?.data).toEqual({ users: [] });
  });

  it('should return cached data when cache is valid', async () => {
    const { request, storage } = createCacheInterceptor();

    // Pre-populate cache
    const cacheKey = 'GET:/api/users:';
    await storage.set(cacheKey, {
      data: { cached: true },
      timestamp: Date.now(),
      expiresAt: Date.now() + 300000,
    });

    const config: HttpRequestOptions = {
      url: '/api/users',
      method: 'GET',
      headers: {},
    };

    const processedConfig = await request(config);

    expect((processedConfig as any)._fromCache).toBe(true);
    expect((processedConfig as any)._cacheData).toEqual({ cached: true });
  });

  it('should ignore expired cache entries', async () => {
    const { request, storage } = createCacheInterceptor();

    // Pre-populate cache with expired entry
    const cacheKey = 'GET:/api/users:';
    await storage.set(cacheKey, {
      data: { cached: true },
      timestamp: Date.now() - 600000,
      expiresAt: Date.now() - 300000, // Already expired
    });

    const config: HttpRequestOptions = {
      url: '/api/users',
      method: 'GET',
      headers: {},
    };

    const processedConfig = await request(config);

    expect((processedConfig as any)._fromCache).toBeUndefined();
  });

  it('should clear cache', async () => {
    const { storage, clear } = createCacheInterceptor();

    await storage.set('key1', { data: 1, timestamp: Date.now(), expiresAt: Date.now() + 1000 });
    await storage.set('key2', { data: 2, timestamp: Date.now(), expiresAt: Date.now() + 1000 });

    await clear();

    expect(await storage.get('key1')).toBeNull();
    expect(await storage.get('key2')).toBeNull();
  });
});

describe('cache helper', () => {
  it('should create cache interceptor with default TTL', () => {
    const cacheInterceptor = cache();

    expect(typeof cacheInterceptor.request).toBe('function');
    expect(Array.isArray(cacheInterceptor.response)).toBe(true);
  });

  it('should create cache interceptor with custom TTL', () => {
    const cacheInterceptor = cache(60000);

    expect(typeof cacheInterceptor.request).toBe('function');
    expect(Array.isArray(cacheInterceptor.response)).toBe(true);
  });
});

describe('MemoryCacheStorage', () => {
  it('should set and get values', async () => {
    const storage = new MemoryCacheStorage();
    const entry = { data: 'test', timestamp: Date.now(), expiresAt: Date.now() + 1000 };

    await storage.set('key', entry);
    const result = await storage.get('key');

    expect(result).toEqual(entry);
  });

  it('should return null for non-existent keys', async () => {
    const storage = new MemoryCacheStorage();

    const result = await storage.get('non-existent');

    expect(result).toBeNull();
  });

  it('should delete values', async () => {
    const storage = new MemoryCacheStorage();
    const entry = { data: 'test', timestamp: Date.now(), expiresAt: Date.now() + 1000 };

    await storage.set('key', entry);
    await storage.delete('key');
    const result = await storage.get('key');

    expect(result).toBeNull();
  });

  it('should clear all values', async () => {
    const storage = new MemoryCacheStorage();

    await storage.set('key1', { data: 1, timestamp: Date.now(), expiresAt: Date.now() + 1000 });
    await storage.set('key2', { data: 2, timestamp: Date.now(), expiresAt: Date.now() + 1000 });
    await storage.clear();

    expect(await storage.get('key1')).toBeNull();
    expect(await storage.get('key2')).toBeNull();
  });
});
