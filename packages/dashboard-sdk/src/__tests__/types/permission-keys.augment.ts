import { buildPermission, type Permission } from "@mercurjs/dashboard-sdk"

declare module "@mercurjs/dashboard-sdk" {
  interface PermissionKeys {
    messaging: true
  }
}

const plugin: Permission = buildPermission("messaging", "view")
const core: Permission = buildPermission("orders", "edit")

// @ts-expect-error unregistered keys stay rejected
buildPermission("not_a_key", "view")

export { plugin, core }
