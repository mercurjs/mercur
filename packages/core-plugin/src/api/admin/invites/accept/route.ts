import { acceptInviteWorkflow } from "@medusajs/core-flows"
import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { HttpTypes } from "@medusajs/framework/types"

type AcceptInviteBody = {
  invite_token: string
  email?: string | null
  first_name?: string | null
  last_name?: string | null
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AcceptInviteBody>,
  res: MedusaResponse<HttpTypes.AdminAcceptInviteResponse>
) => {
  if (req.auth_context.actor_id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "The user is already authenticated and cannot accept an invite."
    )
  }

  const input = {
    invite_token: req.validatedBody.invite_token,
    auth_identity_id: req.auth_context.auth_identity_id,
    user: {
      email: req.validatedBody.email ?? undefined,
      first_name: req.validatedBody.first_name ?? undefined,
      last_name: req.validatedBody.last_name ?? undefined,
    },
  }

  let users
  try {
    const { result } = await acceptInviteWorkflow(req.scope).run({ input })
    users = result
  } catch (e) {
    res.status(401).json({ message: "Unauthorized" })
    return
  }

  res.status(200).json({ user: users[0] })
}

export const AUTHENTICATE = false
