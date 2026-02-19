/**
 * InterceptorManager — mirrors axios InterceptorManager
 * Manages a chain of fulfilled/rejected handlers.
 */

export interface InterceptorHandler<T> {
  fulfilled?: ((value: T) => T | Promise<T>) | null;
  rejected?: ((error: unknown) => unknown) | null;
}

export class InterceptorManager<T> {
  private handlers: Array<InterceptorHandler<T> | null> = [];

  use(
    fulfilled?: ((value: T) => T | Promise<T>) | null,
    rejected?: ((error: unknown) => unknown) | null
  ): number {
    this.handlers.push({ fulfilled: fulfilled ?? null, rejected: rejected ?? null });
    return this.handlers.length - 1;
  }

  eject(id: number): void {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }

  clear(): void {
    this.handlers = [];
  }

  forEach(fn: (handler: InterceptorHandler<T>) => void): void {
    this.handlers.forEach((handler) => {
      if (handler !== null) {
        fn(handler);
      }
    });
  }

  getHandlers(): Array<InterceptorHandler<T> | null> {
    return this.handlers;
  }
}
