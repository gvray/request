/**
 * buildFullPath — mirrors axios core/buildFullPath
 * Combines baseURL with a relative url, unless url is already absolute.
 */

export function buildFullPath(baseURL: string | undefined, url: string | undefined): string {
  const base = baseURL || '';
  const path = url || '';
  if (base && path && !/^https?:\/\//i.test(path)) {
    return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
  }
  return path || base;
}
