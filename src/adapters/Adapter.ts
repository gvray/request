import type { HttpAdapter, HttpInstance, HttpOptions } from '../types';

export abstract class Adapter implements HttpAdapter {
  abstract create(options: HttpOptions): HttpInstance;
  abstract request<T = unknown>(options: HttpOptions): Promise<T>;
}
