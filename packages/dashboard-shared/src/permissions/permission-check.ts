import {
  parsePermission,
  satisfiesPermission,
  type Permission,
  type PermissionMap,
  type PermissionsContextValue,
} from "@mercurjs/dashboard-sdk"

type PermissionChecks = Pick<
  PermissionsContextValue,
  "hasAnyPermission" | "hasAllPermissions"
>

export const toPermissionList = (
  permission?: Permission | Permission[]
): Permission[] =>
  !permission ? [] : Array.isArray(permission) ? permission : [permission]

/**
 * A null `checks` means no provider is mounted (public routes); nothing is
 * enforced there, so everything is permitted.
 */
export const isPermitted = (
  checks: PermissionChecks | null,
  permission?: Permission | Permission[],
  requireAll = false
): boolean => {
  const list = toPermissionList(permission)

  if (!checks || !list.length) {
    return true
  }

  return requireAll
    ? checks.hasAllPermissions(list)
    : checks.hasAnyPermission(list)
}

/** Same check against a raw permission map, for code outside React. */
export const permissionMapAllows = (
  map: PermissionMap | null | undefined,
  permission: Permission | Permission[],
  requireAll = true
): boolean => {
  const list = toPermissionList(permission)

  if (!map || !list.length) {
    return true
  }

  const allows = (entry: Permission) => {
    const parsed = parsePermission(entry)
    return !!parsed && satisfiesPermission(map, parsed.key, parsed.right)
  }

  return requireAll ? list.every(allows) : list.some(allows)
}

/** True for a 403 from the API (`ClientError.status`). */
export const isForbidden = (error: unknown): boolean =>
  !!error &&
  typeof error === "object" &&
  (error as { status?: unknown }).status === 403
