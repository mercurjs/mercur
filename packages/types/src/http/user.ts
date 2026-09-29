import { HttpTypes } from "@medusajs/types"
import { PermissionMap } from "../permissions"

export interface AdminUserWithPermissionsResponse {
  /**
   * `permissions` is only present when requested with `fields=+permissions`
   * and an access-control module is enabled.
   */
  user: HttpTypes.AdminUser & { permissions?: PermissionMap }
}
