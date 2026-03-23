import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { ContainerRegistrationKeys, FeatureFlag, MedusaError } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { VendorCreateSellerAccountType } from "./validators"
import {
  createSellerAccountWorkflow,
  updateSellerAddressWorkflow,
} from "../../../workflows/seller"
import SellerRegistrationFeatureFlag from "../../../feature-flags/seller-registration"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const memberId = req.auth_context.actor_id

  const { data: sellerMembers, metadata } = await query.graph({
    entity: "seller_member",
    fields: req.queryConfig.fields,
    filters: {
      member_id: memberId,
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
  if (!FeatureFlag.isFeatureEnabled(SellerRegistrationFeatureFlag.key)) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Seller self-registration is not enabled."
    )
  }

  if (req.auth_context?.actor_id) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Already registered as a member."
    )
  }

  const { address, ...sellerData } = req.validatedBody

  const { result: seller } = await createSellerAccountWorkflow(req.scope).run({
    input: {
      auth_identity_id: req.auth_context.auth_identity_id,
      seller: sellerData,
      member: { email: sellerData.email },
    },
  })

  if (address) {
    await updateSellerAddressWorkflow(req.scope).run({
      input: {
        seller_id: seller.id,
        data: address,
      },
    })
  }

  res.status(201).json({ seller })
}
