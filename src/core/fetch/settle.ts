/**
 * settle — mirrors axios core/settle
 * Resolves or rejects based on validateStatus.
 */

import { FetchError } from './FetchError';
import type { FetchRequestConfig, FetchResponse } from './types';

export type ValidateStatus = (status: number) => boolean;

const defaultValidateStatus: ValidateStatus = (status) => status >= 200 && status < 300;

export function settle<T = unknown>(
  response: FetchResponse<T>,
  config: FetchRequestConfig
): FetchResponse<T> {
  const validate = config.validateStatus ?? defaultValidateStatus;

  if (!validate || validate(response.status)) {
    return response;
  }

  throw new FetchError(
    `Request failed with status code ${response.status}`,
    response.status >= 400 && response.status < 500
      ? FetchError.ERR_BAD_REQUEST
      : FetchError.ERR_BAD_RESPONSE,
    config,
    response.request,
    response
  );
}
