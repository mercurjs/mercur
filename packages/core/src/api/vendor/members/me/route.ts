import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { updateMemberWorkflow } from "../../../../workflows/seller/workflows"
import { VendorUpdateMemberType } from "../validators"

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

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateMemberType>,
  res: MedusaResponse<HttpTypes.VendorSellerMemberResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const memberId = req.auth_context.actor_id
  const sellerId = req.seller_context!.seller_id

  if (!memberId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "You must be authenticated to update your profile."
    )
  }

  await updateMemberWorkflow(req.scope).run({
    input: { selector: { id: memberId }, update: req.validatedBody },
  })

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

  res.json({ seller_member: sellerMembers[0] })
}
