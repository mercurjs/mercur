import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import sellerMemberInvite from "../../../links/seller-member-invite"
import { VendorMemberInviteListResponse, VendorMemberInviteResponse } from "../../../modules/member"
import { fetchSellerByAuthActorId } from "../members/_helpers/helpers"
import { inviteMemberWorkflow } from "../../../workflows/member/workflows/invite-member"
import { VendorInviteMemberType } from "./validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorInviteMemberType>,
  res: MedusaResponse<VendorMemberInviteResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // actor_id IS seller_id (set by core-plugin auth)
  const sellerId = req.auth_context.actor_id

  const { result: created } = await inviteMemberWorkflow(req.scope).run({
    input: {
      ...req.validatedBody,
      seller_id: sellerId,
    },
  })

  const {
    data: [invite],
  } = await query.graph(
    {
      entity: "member_invite",
      fields: req.queryConfig.fields,
      filters: { id: created.id },
    },
    { throwIfKeyNotFound: true }
  )

  res.status(201).json({ invite })
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<VendorMemberInviteListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: links, metadata } = await query.graph({
    entity: sellerMemberInvite.entryPoint,
    fields: req.queryConfig.fields.map((field) => `member_invite.${field}`),
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    invites: links.map((relation: any) => relation.member_invite),
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}
