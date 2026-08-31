import type { PropsWithChildren, ReactNode } from "react"
import {
  resolvePermissionProps,
  type PermissionProps,
} from "./resolve-permission-props"
import { usePermissions } from "./use-permissions"
import { useRegisterPermissions } from "./use-register-permissions"

export type PermissionGuardProps = PropsWithChildren<
  PermissionProps & {
    /** Rendered when access is denied. Nothing renders when omitted. */
    fallback?: ReactNode
    showLoading?: boolean
    loadingComponent?: ReactNode
  }
>

/**
 * Hides its children unless the actor holds the declared permission, and
 * registers the requirement so the page can surface what is missing.
 *
 * @example
 * ```tsx
 * <PermissionGuard resource="product" operation="create">
 *   <Button>Create</Button>
 * </PermissionGuard>
 * ```
 */
export const PermissionGuard = ({
  children,
  fallback = null,
  showLoading = false,
  loadingComponent = null,
  source,
  enabled = true,
  ...props
}: PermissionGuardProps) => {
  const { permissions, requireAll } = resolvePermissionProps(
    props as PermissionProps
  )

  useRegisterPermissions(permissions, { requireAll, source, enabled })

  const { hasAnyPermission, hasAllPermissions, isLoading } = usePermissions()

  if (isLoading && showLoading) {
    return <>{loadingComponent}</>
  }

  const hasAccess = requireAll
    ? hasAllPermissions(permissions ?? [])
    : hasAnyPermission(permissions ?? [])

  if (!hasAccess) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
