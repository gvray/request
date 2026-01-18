import type {
  IRequestInterceptorAxios,
  WithPromise,
  IResponseInterceptor,
  IErrorInterceptor,
} from '../types';
import type { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { axiosAdapter } from '../adapters';

// 返回字符串或异步字符串的提供者类型
export type StringProvider = () => WithPromise<string | null | undefined>;

/**
 * 在请求头中注入 Authorization: Bearer <token>
 */
export function bearerAuth(
  getToken: StringProvider,
  header = 'Authorization',
  scheme = 'Bearer',
  exclude?: Array<string | RegExp> | ((url?: string, options?: any) => boolean)
): IRequestInterceptorAxios {
  return async (config) => {
    const url = (config as any).url as string | undefined;

    // 判断是否需要跳过设置 Authorization
    let shouldExclude = false;
    if (typeof exclude === 'function') {
      shouldExclude = exclude(url, config as any) === true;
    } else if (Array.isArray(exclude) && url) {
      shouldExclude = exclude.some((rule) =>
        typeof rule === 'string' ? url.includes(rule) : !!url.match(rule as RegExp)
      );
    }

    // 运行时按请求配置跳过（例如登录接口传入 skipAuth: true）
    if ((config as any).skipAuth === true || shouldExclude) return config as any;

    const token = await getToken();
    if (token) {
      const headers: Record<string, any> = { ...(config.headers as any) };
      headers[header] = `${scheme} ${token}`;
      return { ...config, headers } as any;
    }
    return config as any;
  };
}

export type AuthRefreshOptions = {
  // 执行刷新令牌流程，返回新的 access token（也可通过 setToken 持久化）
  refreshToken: () => Promise<string | null | undefined>;
  // 将新的 token 持久化（可选）
  setToken?: (token: string) => Promise<void> | void;
  // 获取当前可用 token（若 refreshToken 不返回 token，可从此处获取）
  getToken?: () => Promise<string | null | undefined>;
  // 需要处理的状态码（默认 401/403）
  statuses?: number[];
  // 刷新失败时的登录跳转（可选）
  loginRedirect?: () => void;
  // 认证头部配置
  header?: string; // 默认 'Authorization'
  scheme?: string; // 默认 'Bearer'
};

// 刷新状态枚举
type RefreshState = 'idle' | 'refreshing' | 'failed';

// 等待队列中的请求项
interface PendingRequest {
  config: AxiosRequestConfig & { _retry?: boolean };
  error: AxiosError;
  resolve: (value: AxiosResponse | PromiseLike<AxiosResponse>) => void;
  reject: (reason: AxiosError) => void;
}

/**
 * 创建响应拦截器：在遇到 401/403 时自动刷新令牌并重试原请求；若刷新失败则可选跳转登录。
 *
 * 核心机制：
 * 1. 第一个遇到 401/403 的请求触发 token 刷新
 * 2. 后续遇到 401/403 的请求进入等待队列
 * 3. 刷新成功：按顺序重试所有等待的请求
 * 4. 刷新失败：拒绝所有等待的请求，只调用一次 loginRedirect
 *
 * 使用方式：在客户端的 responseInterceptors 中传入返回的 tuple。
 */
export function createAuthRefreshInterceptor(
  options: AuthRefreshOptions
): [IResponseInterceptor, IErrorInterceptor] {
  const {
    refreshToken,
    setToken,
    getToken,
    statuses = [401, 403],
    loginRedirect,
    header = 'Authorization',
    scheme = 'Bearer',
  } = options;

  // 刷新状态
  let refreshState: RefreshState = 'idle';
  // 等待队列
  let pendingQueue: PendingRequest[] = [];
  // 当前刷新的 Promise（用于取消/调试等场景，保留用于未来扩展）
  // @ts-ignore - intentionally unused, kept for future debugging/cancellation
  let refreshPromise: Promise<string | null | undefined> | null = null; // eslint-disable-line
  // 防止 loginRedirect 被多次调用
  let loginRedirectCalled = false;

  /**
   * 处理等待队列中的所有请求
   */
  const processQueue = async (token: string | null | undefined, error?: AxiosError) => {
    const queue = [...pendingQueue];
    pendingQueue = [];

    if (!token || error) {
      // 刷新失败：拒绝所有等待的请求
      for (const pending of queue) {
        pending.reject(error || pending.error);
      }
      return;
    }

    // 刷新成功：按顺序重试所有请求
    for (const pending of queue) {
      try {
        const headers: Record<string, string> = {};
        const existingHeaders = pending.config.headers as Record<string, unknown> | undefined;
        if (existingHeaders) {
          for (const [key, value] of Object.entries(existingHeaders)) {
            if (typeof value === 'string') headers[key] = value;
          }
        }
        headers[header] = `${scheme} ${token}`;
        pending.config.headers = headers;

        const response = await axiosAdapter.request<unknown>({
          ...(pending.config as Record<string, unknown>),
          getResponse: true,
          skipAuth: true,
        } as AxiosRequestConfig) as AxiosResponse;

        pending.resolve(response);
      } catch (retryError) {
        pending.reject(retryError as AxiosError);
      }
    }
  };

  /**
   * 执行 token 刷新流程
   */
  const doRefresh = async (): Promise<string | null | undefined> => {
    try {
      const newToken = await refreshToken();
      if (newToken && setToken) {
        await setToken(newToken);
      }
      return newToken ?? (getToken ? await getToken() : null);
    } catch (err) {
      throw err;
    }
  };

  /**
   * 安全地调用 loginRedirect（确保只调用一次）
   */
  const safeLoginRedirect = () => {
    if (loginRedirect && !loginRedirectCalled) {
      loginRedirectCalled = true;
      // 使用 setTimeout 确保所有请求都被处理后再跳转
      setTimeout(() => {
        loginRedirect();
        // 跳转后重置状态，允许用户重新登录后再次使用
        setTimeout(() => {
          loginRedirectCalled = false;
        }, 1000);
      }, 0);
    }
  };

  /**
   * 重置刷新状态（在刷新流程完全结束后调用）
   */
  const resetRefreshState = () => {
    // 延迟重置，确保所有并发请求都已处理完
    setTimeout(() => {
      if (pendingQueue.length === 0) {
        refreshState = 'idle';
        refreshPromise = null;
      }
    }, 100);
  };

  const onResponse: IResponseInterceptor = (response) => response;

  const onError: IErrorInterceptor = (error: AxiosError) => {
    const status = error.response?.status;
    const originalConfig = (error.config || {}) as AxiosRequestConfig & { _retry?: boolean };

    // 非目标状态码，直接拒绝
    if (!status || !statuses.includes(status)) {
      return Promise.reject(error) as Promise<AxiosError>;
    }

    // 已经是重试过的请求，说明新 token 也失效了，放弃重试
    if (originalConfig._retry) {
      safeLoginRedirect();
      return Promise.reject(error) as Promise<AxiosError>;
    }

    // 标记此请求已经尝试过刷新
    originalConfig._retry = true;

    // 如果刷新已经失败，直接拒绝（防止在失败状态下继续堆积请求）
    if (refreshState === 'failed') {
      return Promise.reject(error) as Promise<AxiosError>;
    }

    // 返回一个 Promise，将请求加入队列或立即处理
    return new Promise<AxiosResponse>((resolve, reject) => {
      // 将请求加入等待队列
      const pendingRequest: PendingRequest = {
        config: originalConfig,
        error,
        resolve,
        reject,
      };

      if (refreshState === 'refreshing') {
        // 正在刷新中，加入队列等待
        pendingQueue.push(pendingRequest);
        return;
      }

      // 开始刷新流程
      refreshState = 'refreshing';
      pendingQueue.push(pendingRequest);

      // 创建刷新 Promise（不抛出错误，避免 unhandled rejection）
      refreshPromise = doRefresh()
        .then(async (token) => {
          if (!token) {
            // 刷新成功但没有获取到 token
            refreshState = 'failed';
            safeLoginRedirect();
            await processQueue(null, error);
            resetRefreshState();
            return null;
          }

          // 刷新成功，处理队列
          await processQueue(token);
          resetRefreshState();
          return token;
        })
        .catch(async () => {
          // 刷新失败
          refreshState = 'failed';
          safeLoginRedirect();

          // 拒绝所有等待的请求（队列中的请求会通过 reject 收到错误）
          await processQueue(null, error);
          resetRefreshState();

          // 不再 throw，避免 unhandled rejection
          // 错误已通过 processQueue 传递给各个请求的 reject
          return null;
        });
    }) as Promise<AxiosResponse>;
  };

  return [onResponse, onError];
}
