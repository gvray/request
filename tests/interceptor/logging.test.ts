import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLoggingInterceptor, logging } from '../../src/interceptor/logging';
import type { HttpRequestOptions, HttpResponse, HttpError } from '../../src/types';

describe('createLoggingInterceptor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return request and response interceptors', () => {
    const interceptors = createLoggingInterceptor();

    expect(typeof interceptors.request).toBe('function');
    expect(Array.isArray(interceptors.response)).toBe(true);
    expect(interceptors.response.length).toBe(2);
  });

  it('should log request info', async () => {
    const mockLogger = {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const { request } = createLoggingInterceptor({ logger: mockLogger });

    const config: HttpRequestOptions = {
      url: '/api/users',
      method: 'GET',
      headers: {},
    };

    await request(config);

    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('[Request]'));
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('GET'));
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('/api/users'));
  });

  it('should log request body when enabled', async () => {
    const mockLogger = {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const { request } = createLoggingInterceptor({
      logger: mockLogger,
      logRequestBody: true,
      level: 'debug',
    });

    const config: HttpRequestOptions = {
      url: '/api/users',
      method: 'POST',
      headers: {},
      data: { name: 'test' },
    };

    await request(config);

    expect(mockLogger.debug).toHaveBeenCalledWith('[Request Body]', { name: 'test' });
  });

  it('should NOT log request body when disabled', async () => {
    const mockLogger = {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const { request } = createLoggingInterceptor({
      logger: mockLogger,
      logRequestBody: false,
    });

    const config: HttpRequestOptions = {
      url: '/api/users',
      method: 'POST',
      headers: {},
      data: { name: 'test' },
    };

    await request(config);

    expect(mockLogger.debug).not.toHaveBeenCalledWith('[Request Body]', expect.anything());
  });

  it('should log response info', async () => {
    const mockLogger = {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const { request, response } = createLoggingInterceptor({ logger: mockLogger });
    const [responseInterceptor] = response;

    const config: HttpRequestOptions = {
      url: '/api/users',
      method: 'GET',
      headers: {},
    };

    await request(config);

    const mockResponse = {
      data: { users: [] },
      status: 200,
      config,
    } as HttpResponse;

    await responseInterceptor(mockResponse);

    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('[Response]'));
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('200'));
  });

  it('should log response body when enabled', async () => {
    const mockLogger = {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const { request, response } = createLoggingInterceptor({
      logger: mockLogger,
      logResponseBody: true,
      level: 'debug',
    });
    const [responseInterceptor] = response;

    const config: HttpRequestOptions = {
      url: '/api/users',
      method: 'GET',
      headers: {},
    };

    await request(config);

    const mockResponse = {
      data: { users: ['user1', 'user2'] },
      status: 200,
      config,
    } as HttpResponse;

    await responseInterceptor(mockResponse);

    expect(mockLogger.debug).toHaveBeenCalledWith('[Response Body]', { users: ['user1', 'user2'] });
  });

  it('should log error info', async () => {
    const mockLogger = {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const { response } = createLoggingInterceptor({ logger: mockLogger });
    const [, errorInterceptor] = response;

    const mockError = {
      message: 'Request failed',
      config: {
        url: '/api/users',
        method: 'GET',
      },
      response: {
        status: 500,
      },
    } as unknown as HttpError;

    await expect(errorInterceptor(mockError)).rejects.toBe(mockError);

    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('[Error]'));
    expect(mockLogger.error).toHaveBeenCalledWith('[Error Details]', 'Request failed');
  });

  it('should NOT log when level is none', async () => {
    const mockLogger = {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const { request } = createLoggingInterceptor({ logger: mockLogger, level: 'none' });

    const config: HttpRequestOptions = {
      url: '/api/users',
      method: 'GET',
      headers: {},
    };

    await request(config);

    expect(mockLogger.info).not.toHaveBeenCalled();
    expect(mockLogger.debug).not.toHaveBeenCalled();
  });

  it('should NOT log request when logRequest is false', async () => {
    const mockLogger = {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const { request } = createLoggingInterceptor({ logger: mockLogger, logRequest: false });

    const config: HttpRequestOptions = {
      url: '/api/users',
      method: 'GET',
      headers: {},
    };

    await request(config);

    expect(mockLogger.info).not.toHaveBeenCalledWith(expect.stringContaining('[Request]'));
  });

  it('should NOT log response when logResponse is false', async () => {
    const mockLogger = {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const { response } = createLoggingInterceptor({ logger: mockLogger, logResponse: false });
    const [responseInterceptor] = response;

    const config: HttpRequestOptions = {
      url: '/api/users',
      method: 'GET',
      headers: {},
    };

    const mockResponse = {
      data: { users: [] },
      status: 200,
      config,
    } as HttpResponse;

    await responseInterceptor(mockResponse);

    expect(mockLogger.info).not.toHaveBeenCalledWith(expect.stringContaining('[Response]'));
  });

  it('should NOT log error when logError is false', async () => {
    const mockLogger = {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const { response } = createLoggingInterceptor({ logger: mockLogger, logError: false });
    const [, errorInterceptor] = response;

    const mockError = {
      message: 'Request failed',
      config: {
        url: '/api/users',
        method: 'GET',
      },
    } as unknown as HttpError;

    await expect(errorInterceptor(mockError)).rejects.toBe(mockError);

    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  it('should record request start time', async () => {
    const { request } = createLoggingInterceptor();

    const config: HttpRequestOptions = {
      url: '/api/users',
      method: 'GET',
      headers: {},
    };

    const result = await request(config);

    expect((result as Record<string, unknown>)._requestStartTime).toBeDefined();
    expect(typeof (result as Record<string, unknown>)._requestStartTime).toBe('number');
  });

  it('should use custom timestamp key', async () => {
    const { request } = createLoggingInterceptor({ timestampKey: '_customTime' });

    const config: HttpRequestOptions = {
      url: '/api/users',
      method: 'GET',
      headers: {},
    };

    const result = await request(config);

    expect((result as Record<string, unknown>)._customTime).toBeDefined();
    expect((result as Record<string, unknown>)._requestStartTime).toBeUndefined();
  });
});

describe('logging helper', () => {
  it('should create logging interceptor with default options', () => {
    const interceptors = logging();

    expect(typeof interceptors.request).toBe('function');
    expect(Array.isArray(interceptors.response)).toBe(true);
  });
});
