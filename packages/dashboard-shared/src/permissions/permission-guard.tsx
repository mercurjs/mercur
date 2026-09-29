import type { PropsWithChildren, ReactNode } from "react"
import type { Permission } from "@mercurjs/dashboard-sdk"
import { usePermissions } from "./use-permissions"

export type PermissionGuardProps = PropsWithChildren<{
  permission: Permission | Permission[]
  /** When several permissions are given, require all of them. Defaults to any. */
  requireAll?: boolean
  /** Rendered when access is denied. Nothing renders when omitted. */
  fallback?: ReactNode
}>

/**
 * @example
 * ```tsx
 * <PermissionGuard permission="products:edit">
 *   <Button>Create</Button>
 * </PermissionGuard>
 * ```
 */
export const PermissionGuard = ({
  children,
  permission,
  requireAll = false,
  fallback = null,
}: PermissionGuardProps) => {
  const { hasAnyPermission, hasAllPermissions } = usePermissions()
  const list = Array.isArray(permission) ? permission : [permission]
  const allowed = requireAll ? hasAllPermissions(list) : hasAnyPermission(list)

  return <>{allowed ? children : fallback}</>
}
