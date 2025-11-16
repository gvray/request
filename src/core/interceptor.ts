import { IRequestInterceptor, IRequestInterceptorAxios, RequestConfig } from '@/types';

export const wrapInterceptor = (fn: IRequestInterceptor) => {
  return async (config: RequestConfig) => {
    const url = config.url || '';

    const isUrlStyle = fn.length >= 2;

    if (isUrlStyle) {
      const result = await (fn as any)(url, config);
      if (!result || typeof result !== 'object') return config;

      const { url: newUrl, options = {} } = result;

      return {
        ...config,
        ...options,
        url: newUrl ?? config.url,
      };
    }

    return (fn as IRequestInterceptorAxios)(config);
  };
};
