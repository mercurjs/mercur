import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorSellerMemberResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const memberId = req.auth_context.actor_id
  const sellerId = req.seller_context!.seller_id

  const { data: sellerMembers } = await query.graph({
    entity: "seller_member",
    fields: req.queryConfig.fields,
    filters: {
      seller_id: sellerId,
      member_id: memberId,
    },
  })

  if (!sellerMembers.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Seller member not found"
    )
  }

  const sellerMember = sellerMembers[0]

  res.json({ seller_member: sellerMember })
}
