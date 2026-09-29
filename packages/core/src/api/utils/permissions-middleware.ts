import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework"
import { ConfigModule } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  IPermissionResolver,
  MISSING_PERMISSION_CODE,
  PERMISSIONS_MODULE,
  PermissionActor,
  PermissionMap,
  PermissionRequirement,
  PermissionRight,
  PermissionSurface,
} from "@mercurjs/types"

import {
  getPermissionCatalog,
  grantAll,
  satisfiesRight,
  validatePermissionCatalog,
} from "../../permissions"

declare module "express" {
  interface Request {
    permissions?: PermissionMap
    permissions_enforced?: boolean
    required_permissions?: PermissionRequirement[]
  }
}

export function isPermissionsModuleEnabled(config: ConfigModule): boolean {
  const modules = config.modules as Record<string, unknown> | undefined
  const entry = modules?.[PERMISSIONS_MODULE]

  if (!entry) {
    return false
  }

  return !(typeof entry === "object" && "disable" in entry && entry.disable)
}

function getResolver(
  req: AuthenticatedMedusaRequest
): IPermissionResolver | undefined {
  const config = req.scope.resolve<ConfigModule>(
    ContainerRegistrationKeys.CONFIG_MODULE
  )

  if (!isPermissionsModuleEnabled(config)) {
    return undefined
  }

  return req.scope.resolve<IPermissionResolver>(PERMISSIONS_MODULE)
}

let catalogValidated = false

export function resolvePermissionsMiddleware(surface: PermissionSurface) {
  return async (
    req: AuthenticatedMedusaRequest,
    _res: MedusaResponse,
    next: MedusaNextFunction
  ) => {
    const catalog = getPermissionCatalog()
    if (!catalogValidated) {
      validatePermissionCatalog(catalog)
      catalogValidated = true
    }
    const resolver = getResolver(req)
    const actorId = req.auth_context?.actor_id

    if (!resolver || !actorId) {
      req.permissions = grantAll(catalog)
      req.permissions_enforced = false
      return next()
    }

    const actor: PermissionActor = {
      actor_type: req.auth_context.actor_type,
      actor_id: actorId,
      surface,
      seller_id: req.seller_context?.seller_id,
      seller_member_id: req.seller_context?.seller_member?.id,
    }

    try {
      req.permissions = await resolver.resolvePermissions(actor, catalog)
      req.permissions_enforced = true
      next()
    } catch (error) {
      next(error)
    }
  }
}

export const REQUIRED_PERMISSION = Symbol.for("mercur:required-permission")

export function requirePermission(key: string, right: PermissionRight) {
  const middleware = (
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction
  ) => {
    req.required_permissions ??= []
    req.required_permissions.push({ key, right })

    // Routes reached before the resolving middleware (public or pre-seller
    // routes) have nothing to enforce against.
    if (!req.permissions_enforced) {
      return next()
    }

    if (satisfiesRight(req.permissions?.[key], right)) {
      return next()
    }

    res.status(403).json({
      type: "not_allowed",
      code: MISSING_PERMISSION_CODE,
      message: `Missing required permission: ${key}:${right}`,
      permission: key,
      right,
    })
  }

  return Object.assign(middleware, {
    [REQUIRED_PERMISSION]: { key, right } as PermissionRequirement,
  })
}

export const PERMISSIONS_FIELD = "permissions"

/**
 * `permissions` is a virtual field: pull it out of the query config before it
 * reaches `query.graph`, and report whether the client asked for it.
 */
export function takePermissionsField(req: AuthenticatedMedusaRequest): boolean {
  const fields = req.queryConfig?.fields ?? []
  const requested = fields.includes(PERMISSIONS_FIELD)

  if (requested) {
    req.queryConfig.fields = fields.filter((field) => field !== PERMISSIONS_FIELD)
  }

  return requested
}

export function attachPermissions<T extends object>(
  req: AuthenticatedMedusaRequest,
  entity: T,
  requested: boolean
): T & { permissions?: PermissionMap } {
  if (!requested || !req.permissions_enforced || !req.permissions) {
    return entity
  }
  return { ...entity, permissions: req.permissions }
}
