import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import { VendorSelectSellerType } from "../validators"
import { resolveMemberActorId } from "../../../utils"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorSelectSellerType>,
  res: MedusaResponse
) => {
  const { seller_id } = req.validatedBody
  const memberId = await resolveMemberActorId(req)

  if (!memberId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "You must be authenticated to select a seller account."
    )
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: sellerMembers } = await query.graph(
    {
      entity: "seller_member",
      fields: ["id", "seller_id", "member_id"],
      filters: {
        seller_id,
        member_id: memberId,
      },
    },
    { cache: { enable: true } }
  )

  if (!sellerMembers.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "You are not a member of this seller account"
    )
  }

  req.session.seller_id = seller_id

  res.json({ success: true })
}
