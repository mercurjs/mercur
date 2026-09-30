import { isPermitted } from "@mercurjs/dashboard-shared"

import { getRoutePermission } from "./route-permissions"

type PermissionChecks = Parameters<typeof isPermitted>[0]

/** Every permission of the route is required, as `RoutePermissionGuard` does. */
export const canReachRoute = (checks: PermissionChecks, path: string) =>
  isPermitted(checks, getRoutePermission(path), true)
