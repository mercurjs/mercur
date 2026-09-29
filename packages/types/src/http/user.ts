import { HttpTypes } from "@medusajs/types"
import { PermissionMap } from "../permissions"

export interface AdminUserWithPermissionsResponse {
  user: HttpTypes.AdminUser & { permissions?: PermissionMap }
}
