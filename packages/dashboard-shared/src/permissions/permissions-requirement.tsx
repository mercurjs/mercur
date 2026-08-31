import type { PropsWithChildren } from "react"
import {
  resolvePermissionProps,
  type PermissionProps,
} from "./resolve-permission-props"
import { useRegisterPermissions } from "./use-register-permissions"

export type PermissionsRequirementProps = PropsWithChildren<PermissionProps>

/**
 * Declares a permission requirement for the surrounding subtree without
 * gating it. Use `PermissionGuard` when the children should be hidden.
 */
export const PermissionsRequirement = ({
  children,
  source,
  enabled = true,
  ...props
}: PermissionsRequirementProps) => {
  const { permissions, requireAll } = resolvePermissionProps(
    props as PermissionProps
  )

  useRegisterPermissions(permissions, { requireAll, source, enabled })

  return <>{children}</>
}
