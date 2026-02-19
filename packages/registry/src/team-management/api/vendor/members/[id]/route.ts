import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { VendorMemberResponse } from "../../../../modules/member"
import { deleteMemberWorkflow } from "../../../../workflows/member/workflows/delete-member"
import { updateMemberWorkflow } from "../../../../workflows/member/workflows/update-member"
import { validateSellerMember } from "../_helpers/helpers"
import { VendorUpdateMemberType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<VendorMemberResponse>
) => {
  const { id } = req.params
  await validateSellerMember(req.scope, req.auth_context.actor_id, id!)

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [member],
  } = await query.graph(
    {
      entity: "member",
      fields: req.queryConfig.fields,
      filters: { id },
    },
    { throwIfKeyNotFound: true }
  )

  res.json({ member })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateMemberType>,
  res: MedusaResponse<VendorMemberResponse>
) => {
  const { id } = req.params
  await validateSellerMember(req.scope, req.auth_context.actor_id, id!)

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  await updateMemberWorkflow(req.scope).run({
    input: {
      id,
      ...req.validatedBody,
    },
  })

  const {
    data: [member],
  } = await query.graph(
    {
      entity: "member",
      fields: req.queryConfig.fields,
      filters: { id },
    },
    { throwIfKeyNotFound: true }
  )

  res.json({ member })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  await validateSellerMember(req.scope, req.auth_context.actor_id, id!)

  await deleteMemberWorkflow(req.scope).run({
    input: id,
  })

  res.json({
    id,
    object: "member",
    deleted: true,
  })
}
