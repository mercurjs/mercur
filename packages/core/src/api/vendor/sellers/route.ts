import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { HttpTypes, SellerStatus } from "@mercurjs/types"

import { VendorCreateSellerAccountType } from "./validators"
import { createSellerAccountWorkflow } from "../../../workflows/seller"

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
  const {
    address,
    professional_details,
    payment_details,
    member_email,
    first_name,
    last_name,
    additional_data,
    ...sellerData
  } = req.validatedBody

  const memberId = req.auth_context.actor_id || undefined

  if (!memberId && !member_email) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "member_email is required when creating a seller without an existing member"
    )
  }

  const { result: seller } = await createSellerAccountWorkflow(req.scope).run({
    input: {
      auth_identity_id: req.auth_context.auth_identity_id,
      member_id: memberId,
      seller: sellerData,
      member_email,
      first_name: first_name ?? undefined,
      last_name: last_name ?? undefined,
      address,
      professional_details,
      payment_details,
      additional_data,
    },
  })

  res.status(201).json({ seller })
}
