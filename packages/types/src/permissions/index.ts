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
 * Registered under `PERMISSION_RESOLVER` by an access-control module to turn
 * an actor into effective rights. Core falls back to granting everything when
 * nothing is registered.
 */
export interface IPermissionResolver {
  resolve(
    actor: PermissionActor,
    catalog: PermissionDefinition[]
  ): Promise<PermissionMap>
}

export const PERMISSION_RESOLVER = "mercurPermissionResolver"

export const MISSING_PERMISSION_CODE = "MISSING_PERMISSION"
