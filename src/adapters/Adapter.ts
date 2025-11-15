import type { HttpAdapter, RequestOptions } from '@/types';
export abstract class Adapter implements HttpAdapter {
  abstract create<T = any>(options: RequestOptions): T;
  abstract request<T = any>(options: RequestOptions): Promise<T>;
  abstract get<T = any>(options?: RequestOptions): Promise<T>;
  abstract delete<T = any>(options?: RequestOptions): Promise<T>;
  abstract head<T = any>(options?: RequestOptions): Promise<T>;
  abstract options<T = any>(options?: RequestOptions): Promise<T>;
  abstract post<T = any>(options?: RequestOptions): Promise<T>;
  abstract put<T = any>(options?: RequestOptions): Promise<T>;
  abstract patch<T = any>(options?: RequestOptions): Promise<T>;
}
