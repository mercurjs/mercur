import { AuthenticatedMedusaRequest } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { IAuthModuleService } from "@medusajs/types"

export async function resolveMemberActorId(
  req: AuthenticatedMedusaRequest
): Promise<string | undefined> {
  if (req.auth_context.actor_id) {
    return req.auth_context.actor_id
  }

  const authIdentityId = req.auth_context.auth_identity_id

  if (!authIdentityId) {
    return undefined
  }

  const authService: IAuthModuleService = req.scope.resolve(Modules.AUTH)
  const authIdentity = await authService.retrieveAuthIdentity(authIdentityId)
  const memberId = authIdentity.app_metadata?.member_id

  if (typeof memberId !== "string" || !memberId) {
    return undefined
  }

  req.auth_context.actor_id = memberId

  return memberId
}
