import {
  buildPermission,
  type Permission,
  type PermissionOperation,
  type PermissionResource,
} from "@mercurjs/dashboard-sdk"

interface BasePermissionProps {
  source?: string
  enabled?: boolean
}

export interface WithPermission extends BasePermissionProps {
  permission: Permission
  permissions?: never
  resource?: never
  operation?: never
  requireAll?: never
}

export interface WithPermissions extends BasePermissionProps {
  permissions: Permission[]
  /** If true, ALL permissions are required. Defaults to ANY. */
  requireAll?: boolean
  permission?: never
  resource?: never
  operation?: never
}

export interface WithResourceOperation extends BasePermissionProps {
  resource: PermissionResource
  operation: PermissionOperation
  permission?: never
  permissions?: never
  requireAll?: never
}

export type PermissionProps =
  | WithPermission
  | WithPermissions
  | WithResourceOperation

export const resolvePermissionProps = (
  props: PermissionProps
): { permissions: Permission[] | null; requireAll: boolean } => {
  if (props.permission) {
    return { permissions: [props.permission], requireAll: false }
  }

  if (props.permissions) {
    return { permissions: props.permissions, requireAll: !!props.requireAll }
  }

  if (props.resource && props.operation) {
    return {
      permissions: [buildPermission(props.resource, props.operation)],
      requireAll: false,
    }
  }

  return { permissions: null, requireAll: false }
}
