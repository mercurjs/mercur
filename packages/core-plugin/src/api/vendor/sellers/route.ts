import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { VendorCreateSellerType } from "./validators"
import { createSellersWorkflow } from "../../../workflows/seller"

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
  req: AuthenticatedMedusaRequest<VendorCreateSellerType>,
  res: MedusaResponse<HttpTypes.VendorSellerResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { result: sellers } = await createSellersWorkflow(req.scope).run({
    input: {
      sellers: [req.validatedBody],
    },
  })

  const {
    data: [result],
  } = await query.graph({
    entity: "seller",
    fields: req.queryConfig.fields,
    filters: { id: sellers[0].id },
  })

  res.status(201).json({ seller: result })
}
