import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { ContainerRegistrationKeys, FeatureFlag, MedusaError } from "@medusajs/framework/utils"
import { HttpTypes, SellerStatus } from "@mercurjs/types"

import { VendorCreateSellerAccountType } from "./validators"
import { createSellerAccountWorkflow } from "../../../workflows/seller"
import SellerRegistrationFeatureFlag from "../../../feature-flags/seller-registration"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorSellerMemberListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const memberId = req.auth_context?.actor_id

  if (!memberId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "You must be authenticated to access seller information."
    )
  }

  const { data: sellerMembers, metadata } = await query.graph({
    entity: "seller_member",
    fields: req.queryConfig.fields,
    filters: {
      member_id: memberId,
      seller: {
        status: {
          $ne: SellerStatus.TERMINATED,
        },
      },
    },
    pagination: req.queryConfig.pagination,
  })

  res.json({
    seller_members: sellerMembers,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateSellerAccountType>,
  res: MedusaResponse<HttpTypes.VendorSellerResponse>
) => {
  const { address, professional_details, payment_details, member_email, ...sellerData } = req.validatedBody

  const { result: seller } = await createSellerAccountWorkflow(req.scope).run({
    input: {
      auth_identity_id: req.auth_context.auth_identity_id,
      member_id: req.auth_context.actor_id || undefined,
      seller: sellerData,
      member_email,
      address,
      professional_details,
      payment_details,
    },
  })

  res.status(201).json({ seller })
}
