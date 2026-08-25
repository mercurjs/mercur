import { useContext } from "react"
import { PermissionsContext } from "./permissions-context"

/**
 * @example
 * ```tsx
 * const { can, hasPermission } = usePermissions()
 *
 * if (can("customer", "create")) { ... }
 * if (hasPermission("customer:read")) { ... }
 * ```
 */
export const usePermissions = () => {
  const context = useContext(PermissionsContext)

  if (!context) {
    throw new Error("usePermissions must be used within a PermissionsProvider")
  }

  return context
}
