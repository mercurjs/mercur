import { useMemo } from "react"
import type { PermissionResource } from "@mercurjs/dashboard-sdk"
import { usePermissions } from "./use-permissions"

/**
 * @example
 * ```tsx
 * const { canCreate } = useResourcePermissions("product")
 * {canCreate && <Button>Create</Button>}
 * ```
 */
export const useResourcePermissions = (resource: PermissionResource) => {
  const { can, isLoading } = usePermissions()

  return useMemo(
    () => ({
      canRead: can(resource, "read"),
      canCreate: can(resource, "create"),
      canUpdate: can(resource, "update"),
      canDelete: can(resource, "delete"),
      can: (operation: "read" | "create" | "update" | "delete") =>
        can(resource, operation),
      resource,
      isLoading,
    }),
    [can, resource, isLoading]
  )
}
