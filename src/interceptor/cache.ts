import type { IRequestInterceptorAxios, IResponseInterceptor, IErrorInterceptor } from '../types';
import type { AxiosResponse } from 'axios';

export type CacheEntry = {
  data: any;
  timestamp: number;
  expiresAt: number;
};

export type CacheOptions = {
  // 缓存过期时间（毫秒，默认 5 分钟）
  ttl?: number;
  // 缓存存储（默认内存）
  storage?: CacheStorage;
  // 生成缓存 key 的函数
  keyGenerator?: (url: string, config: any) => string;
  // 只缓存 GET 请求（默认 true）
  onlyGet?: boolean;
  // 排除的 URL 模式
  exclude?: Array<string | RegExp>;
  // 缓存命中回调
  onCacheHit?: (key: string, entry: CacheEntry) => void;
  // 缓存未命中回调
  onCacheMiss?: (key: string) => void;
};

export interface CacheStorage {
  get(key: string): CacheEntry | null | Promise<CacheEntry | null>;
  set(key: string, value: CacheEntry): void | Promise<void>;
  delete(key: string): void | Promise<void>;
  clear(): void | Promise<void>;
}

// 内存缓存实现
class MemoryCacheStorage implements CacheStorage {
  private cache = new Map<string, CacheEntry>();

  get(key: string): CacheEntry | null {
    return this.cache.get(key) || null;
  }

  set(key: string, value: CacheEntry): void {
    this.cache.set(key, value);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

function defaultKeyGenerator(url: string, config: any): string {
  const params = config.params ? JSON.stringify(config.params) : '';
  return `${config.method || 'GET'}:${url}:${params}`;
}

function shouldExclude(url: string, exclude?: Array<string | RegExp>): boolean {
  if (!exclude || !url) return false;
  return exclude.some((rule) =>
    typeof rule === 'string' ? url.includes(rule) : rule.test(url)
  );
}

/**
 * 创建缓存拦截器
 * 缓存 GET 请求的响应，减少重复请求
 */
export function createCacheInterceptor(options: CacheOptions = {}): {
  request: IRequestInterceptorAxios;
  response: [IResponseInterceptor, IErrorInterceptor];
  storage: CacheStorage;
  clear: () => void | Promise<void>;
} {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes
    storage = new MemoryCacheStorage(),
    keyGenerator = defaultKeyGenerator,
    onlyGet = true,
    exclude,
    onCacheHit,
    onCacheMiss,
  } = options;

  const requestInterceptor: IRequestInterceptorAxios = async (config) => {
    const method = ((config as any).method || 'GET').toUpperCase();
    const url = (config as any).url || '';

    // 只缓存 GET 请求
    if (onlyGet && method !== 'GET') {
      return config as any;
    }

    // 检查是否排除
    if (shouldExclude(url, exclude)) {
      return config as any;
    }

    // 检查是否强制刷新
    if ((config as any).forceRefresh || (config as any).noCache) {
      return config as any;
    }

    const cacheKey = keyGenerator(url, config);
    const entry = await storage.get(cacheKey);

    if (entry && Date.now() < entry.expiresAt) {
      // 缓存命中
      if (onCacheHit) onCacheHit(cacheKey, entry);

      // 使用特殊标记表示从缓存返回
      (config as any)._fromCache = true;
      (config as any)._cacheData = entry.data;
      (config as any)._cacheKey = cacheKey;
    } else {
      // 缓存未命中
      if (onCacheMiss) onCacheMiss(cacheKey);
      (config as any)._cacheKey = cacheKey;
    }

    return config as any;
  };

  const responseInterceptor: IResponseInterceptor = async (response: AxiosResponse) => {
    const config = response.config as any;

    // 如果是从缓存返回，直接返回缓存数据
    if (config._fromCache) {
      return {
        ...response,
        data: config._cacheData,
        headers: { ...response.headers, 'x-cache': 'HIT' },
      } as AxiosResponse;
    }

    // 缓存新响应
    const method = (config.method || 'GET').toUpperCase();
    if ((!onlyGet || method === 'GET') && config._cacheKey) {
      const entry: CacheEntry = {
        data: response.data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
      };
      await storage.set(config._cacheKey, entry);
    }

    return response;
  };

  const errorInterceptor: IErrorInterceptor = (error) => {
    return Promise.reject(error);
  };

  return {
    request: requestInterceptor,
    response: [responseInterceptor, errorInterceptor],
    storage,
    clear: () => storage.clear(),
  };
}

/**
 * 简单缓存拦截器（使用默认配置）
 */
export function cache(ttl = 5 * 60 * 1000): ReturnType<typeof createCacheInterceptor> {
  return createCacheInterceptor({ ttl });
}

// 导出内存缓存类供外部使用
export { MemoryCacheStorage };
