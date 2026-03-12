import type { GvrayAdapter, GvrayInstance, GvrayOptions } from '../types';

export abstract class Adapter implements GvrayAdapter {
  abstract create(options: GvrayOptions): GvrayInstance;
  abstract request<T = any>(options: GvrayOptions): Promise<T>;
}
