import { PAGE_PERMISSIONS } from '@/lib/permissions';

export function resolveRoles(pathname: string): number[] {
  const keys = Object.keys(PAGE_PERMISSIONS)
    .filter(k => pathname === k || pathname.startsWith(k + '/'))
    .sort((a, b) => b.length - a.length);

  return keys.length > 0 ? PAGE_PERMISSIONS[keys[0]] : [];
}
