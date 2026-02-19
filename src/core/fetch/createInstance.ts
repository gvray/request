/**
 * createInstance — mirrors axios.create()
 * Returns a FetchInstance with all methods bound to the Fetch class.
 */

import { Fetch } from './Fetch';
import type { FetchRequestConfig, FetchInstance } from './types';

export function createInstance(config: FetchRequestConfig = {}): FetchInstance {
  const context = new Fetch(config);

  // Create the callable instance function (mirrors axios behavior)
  const instance = function (
    configOrUrl: FetchRequestConfig | string,
    maybeConfig?: FetchRequestConfig
  ) {
    if (typeof configOrUrl === 'string') {
      return context.request({ ...maybeConfig, url: configOrUrl });
    }
    return context.request(configOrUrl);
  } as FetchInstance;

  // Bind all methods
  instance.request = context.request.bind(context);
  instance.get = context.get.bind(context);
  instance.delete = context.delete.bind(context);
  instance.head = context.head.bind(context);
  instance.options = context.options.bind(context);
  instance.post = context.post.bind(context);
  instance.put = context.put.bind(context);
  instance.patch = context.patch.bind(context);

  // Attach interceptors and defaults
  instance.interceptors = context.interceptors;
  instance.defaults = context.defaults;

  return instance;
}
