import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { VendorInviteMemberType } from "../../validators"
import { createMemberInvitesWorkflow } from "../../../../../workflows/seller"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: sellerMembers, metadata } = await query.graph({
    entity: "seller_member",
    fields: req.queryConfig.fields,
    filters: {
      seller_id: req.params.id,
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
  req: AuthenticatedMedusaRequest<VendorInviteMemberType>,
  res: MedusaResponse
) => {
  const { result: invites } = await createMemberInvitesWorkflow(req.scope).run({
    input: [{
      seller_id: req.params.id,
      email: req.validatedBody.email,
      role_id: req.validatedBody.role_id,
    }],
  })

  res.status(201).json({ member_invite: invites[0] })
}
