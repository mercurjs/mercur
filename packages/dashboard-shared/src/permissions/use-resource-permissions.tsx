import { useMemo } from "react"
import type { PermissionKey } from "@mercurjs/dashboard-sdk"
import { usePermissions } from "./use-permissions"

/**
 * @example
 * ```tsx
 * const { canEdit } = useResourcePermissions("products")
 * ```
 */
export const useResourcePermissions = (key: PermissionKey) => {
  const { can, isLoading } = usePermissions()

  return useMemo(
    () => ({
      canView: can(key, "view"),
      canEdit: can(key, "edit"),
      canManage: can(key, "manage"),
      key,
      isLoading,
    }),
    [can, key, isLoading]
  )
}
