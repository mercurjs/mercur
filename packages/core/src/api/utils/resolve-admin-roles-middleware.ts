import { MedusaNextFunction, MedusaResponse } from "@medusajs/framework"
import { AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  FeatureFlag,
} from "@medusajs/framework/utils"

/**
 * Seeded by the RBAC module's initial-data loader; holds the `*:*` policy.
 */
export const SUPER_ADMIN_ROLE_ID = "role_super_admin"

/**
 * Resolves the acting admin user's RBAC roles per request.
 *
 * Medusa bakes roles into the JWT at login, which means a role change only
 * takes effect once the token is re-issued. Reading them here instead keeps
 * enforcement current, and mirrors what `ensureSellerMiddleware` already does
 * on the vendor side.
 *
 * A user with no roles falls back to super admin rather than being denied.
 * Route policy checks reject an actor with an empty role list outright, so
 * without this fallback every admin predating RBAC would lose access.
 */
export async function resolveAdminRolesMiddleware(
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  const actorId = req.auth_context?.actor_id

  // Route policies are only enforced while the flag is on, so skip the lookup
  // entirely otherwise — this runs on every admin request.
  if (!actorId || !FeatureFlag.isFeatureEnabled("rbac")) {
    return next()
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  let roles: string[] = []

  try {
    const { data } = await query.graph(
      {
        entity: "user",
        fields: ["rbac_roles.id"],
        filters: { id: actorId },
      },
      { cache: { enable: true } }
    )

    roles = (data?.[0]?.rbac_roles ?? [])
      .map((role: { id: string }) => role.id)
      .filter(Boolean)
  } catch {
    // The user <-> role link only exists while the rbac flag is on. Treat a
    // failed lookup the same as "no roles assigned".
  }

  // The link is the source of truth, but fall back to whatever the token
  // carries so callers that assign roles outside the link keep working.
  const tokenRoles = (req.auth_context.app_metadata?.roles as string[]) ?? []
  const resolved = roles.length ? roles : tokenRoles

  req.auth_context.app_metadata = {
    ...req.auth_context.app_metadata,
    roles: resolved.length ? resolved : [SUPER_ADMIN_ROLE_ID],
  }

  return next()
}
