/**
 * mergeConfig — mirrors axios core/mergeConfig
 * Deep-merges defaults with per-request config.
 * Headers are merged shallowly (per-request overrides defaults).
 */

import type { FetchRequestConfig } from './types';

const DEEP_MERGE_KEYS: ReadonlyArray<string> = ['headers', 'params'];

export function mergeConfig<D = unknown>(
  defaults: FetchRequestConfig<D>,
  config: FetchRequestConfig<D>
): FetchRequestConfig<D> {
  const merged: FetchRequestConfig<D> = { ...defaults };

  for (const key of Object.keys(config)) {
    const val = config[key];
    if (val === undefined) continue;

    if (
      DEEP_MERGE_KEYS.includes(key) &&
      typeof val === 'object' &&
      val !== null &&
      !Array.isArray(val)
    ) {
      merged[key] = {
        ...((defaults[key] as Record<string, unknown>) || {}),
        ...(val as Record<string, unknown>),
      };
    } else {
      merged[key] = val;
    }
  }

  return merged;
}
