/**
 * CanceledError — mirrors axios CanceledError
 * Thrown when a request is canceled via AbortController.
 */

import { FetchError } from './FetchError';
import type { FetchRequestConfig } from './types';

export class CanceledError<T = unknown> extends FetchError<T> {
  constructor(message?: string, config?: FetchRequestConfig) {
    super(message || 'canceled', FetchError.ERR_CANCELED, config);
    this.name = 'CanceledError';
  }
}
