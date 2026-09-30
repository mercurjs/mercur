import type { PermissionKey, PermissionRight } from "@mercurjs/dashboard-sdk"
import { usePermissions } from "./use-permissions"

/**
 * @example
 * ```tsx
 * const canViewCustomers = useCan("customers")
 *
 * useCustomers(query, { enabled: canViewCustomers })
 * ```
 */
export const useCan = (key: PermissionKey, right: PermissionRight = "view") =>
  usePermissions().can(key, right)
