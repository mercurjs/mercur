export type PermissionRight = "view" | "edit" | "manage"

export const PERMISSION_RIGHTS: readonly PermissionRight[] = [
  "view",
  "edit",
  "manage",
]

export const PERMISSION_RIGHT_RANK: Record<PermissionRight, number> = {
  view: 1,
  edit: 2,
  manage: 3,
}

export type PermissionSurface = "admin" | "vendor"

export interface PermissionRequirement {
  key: string
  right: PermissionRight
}

export interface PermissionDefinition {
  key: string
  group: string
  surface: PermissionSurface[]
  rights: PermissionRight[]
  requires?: PermissionRequirement[]
  label?: string
  description?: string
}

export type PermissionMap = Record<string, PermissionRight>

export interface PermissionActor {
  actor_type: string
  actor_id: string
  surface: PermissionSurface
  seller_id?: string
  seller_member_id?: string
}

/**
 * Implemented by the service of the module registered under
 * `PERMISSIONS_MODULE` in the Medusa config. Without that module, core grants
 * everything.
 */
export interface IPermissionResolver {
  resolvePermissions(
    actor: PermissionActor,
    catalog: PermissionDefinition[]
  ): Promise<PermissionMap>
}

export const PERMISSIONS_MODULE = "rbac"

export const MISSING_PERMISSION_CODE = "MISSING_PERMISSION"
