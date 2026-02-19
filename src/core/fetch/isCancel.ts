/**
 * isCancel — mirrors axios isCancel
 * Checks whether an error is a cancellation.
 */

import { CanceledError } from './CanceledError';

export function isCancel(value: unknown): value is CanceledError {
  return value instanceof CanceledError;
}
