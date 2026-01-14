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

/**
 * 创建响应拦截器：在遇到 401/403 时自动刷新令牌并重试原请求；若刷新失败则可选跳转登录。
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

  let refreshPromise: Promise<string | null | undefined> | null = null;

  const onResponse: IResponseInterceptor = (response) => response;

  const onError: IErrorInterceptor = async (error: AxiosError) => {
    const status = error.response?.status;
    const originalConfig = (error.config || {}) as AxiosRequestConfig & { _retry?: boolean };

    if (!status || !statuses.includes(status)) {
      return Promise.reject(error) as Promise<AxiosError>;
    }

    // 避免无限重试
    if (originalConfig._retry) {
      if (loginRedirect) loginRedirect();
      return Promise.reject(error) as Promise<AxiosError>;
    }

    originalConfig._retry = true;

    // 多请求并发时复用同一个刷新流程
    if (!refreshPromise) {
      refreshPromise = refreshToken()
        .then(async (newToken) => {
          if (newToken && setToken) await setToken(newToken);
          return newToken ?? (getToken ? await getToken() : null);
        })
        .catch((err) => {
          refreshPromise = null;
          if (loginRedirect) loginRedirect();
          throw err;
        })
        .finally(() => {
          // 刷新流程完成后释放
          refreshPromise = null;
        });
    }

    try {
      const token = await refreshPromise;
      if (!token) {
        if (loginRedirect) loginRedirect();
        return Promise.reject(error) as Promise<AxiosError>;
      }

      // 更新原请求头并重试
      const headers = { ...(originalConfig.headers as any) };
      headers[header] = `${scheme} ${token}`;
      originalConfig.headers = headers;

      return axiosAdapter.request<any>({
        ...(originalConfig as any),
        getResponse: true,
        skipAuth: true,
      } as any) as Promise<AxiosResponse<any>>;
    } catch (_err) {
      return Promise.reject(error) as Promise<AxiosError>;
    }
  };

  return [onResponse, onError];
}
