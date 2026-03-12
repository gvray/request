import { axiosAdapter, fetchAdapter } from '../adapters';
import type {
  GvrayInstance,
  Engine,
  GvrayRequestInterceptorConfig,
  GvrayRequestInterceptor,
  GvrayResponseInterceptorConfig,
  GvrayResponseInterceptor,
  GvrayErrorInterceptor,
} from '../types';

/**
 * 根据引擎类型获取对应的适配器
 */
export function getAdapter(engine: Engine = 'axios') {
  return engine === 'fetch' ? fetchAdapter : axiosAdapter;
}

/**
 * 注册请求拦截器到实例
 */
export function registerRequestInterceptor(
  interceptor: GvrayRequestInterceptorConfig,
  instance: GvrayInstance
): number {
  // 判断是否为工厂函数：检查函数名是否包含 'create'
  const isFactory = typeof interceptor === 'function' && interceptor.name.includes('create');

  if (isFactory) {
    // 拦截器工厂函数，调用它并传入 instance
    const factory = interceptor as (
      instance: GvrayInstance
    ) =>
      | [GvrayRequestInterceptor, GvrayErrorInterceptor]
      | [GvrayRequestInterceptor]
      | GvrayRequestInterceptor;
    const result = factory(instance);
    if (Array.isArray(result)) {
      const [success, fail] = result;
      return instance.interceptors.request.use(success, fail);
    } else {
      return instance.interceptors.request.use(result);
    }
  } else if (Array.isArray(interceptor)) {
    const [success, fail] = interceptor;
    return instance.interceptors.request.use(success, fail);
  } else {
    // 普通的请求拦截器函数
    return instance.interceptors.request.use(interceptor as GvrayRequestInterceptor);
  }
}

/**
 * 注册响应拦截器到实例
 */
export function registerResponseInterceptor(
  interceptor: GvrayResponseInterceptorConfig,
  instance: GvrayInstance
): number {
  // 判断是否为工厂函数：检查函数名是否包含 'create'
  const isFactory = typeof interceptor === 'function' && interceptor.name.includes('create');

  if (isFactory) {
    // 拦截器工厂函数，调用它并传入 instance
    const factory = interceptor as (
      instance: GvrayInstance
    ) =>
      | [GvrayResponseInterceptor, GvrayErrorInterceptor]
      | [GvrayResponseInterceptor]
      | GvrayResponseInterceptor;
    const result = factory(instance);
    if (Array.isArray(result)) {
      const [success, fail] = result;
      return instance.interceptors.response.use(success, fail);
    } else {
      return instance.interceptors.response.use(result);
    }
  } else if (Array.isArray(interceptor)) {
    const [success, fail] = interceptor;
    return instance.interceptors.response.use(success, fail);
  } else {
    // 普通的响应拦截器函数
    return instance.interceptors.response.use(interceptor as GvrayResponseInterceptor);
  }
}
