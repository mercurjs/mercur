import type { Permission } from "@mercurjs/dashboard-sdk"
import type { Action, ActionGroup } from "./action-menu"

type PermissionCheck = {
  hasAnyPermission: (permissions: Permission[]) => boolean
  hasAllPermissions: (permissions: Permission[]) => boolean
}

/**
 * Drops actions the actor lacks the permission for, then drops groups left
 * empty. Hiding rather than disabling: the API would refuse the action anyway,
 * so offering it is misleading.
 *
 * A null `permissions` means no provider is mounted (public routes), in which
 * case nothing is filtered.
 */
export const filterActionGroups = (
  groups: ActionGroup[],
  permissions: PermissionCheck | null
): ActionGroup[] => {
  const allowed = (action: Action) => {
    if (!action.permission || !permissions) {
      return true
    }

    const required = Array.isArray(action.permission)
      ? action.permission
      : [action.permission]

    return action.requireAll
      ? permissions.hasAllPermissions(required)
      : permissions.hasAnyPermission(required)
  }

  return groups
    .map((group) => ({ ...group, actions: group.actions.filter(allowed) }))
    .filter((group) => group.actions.length)
}
