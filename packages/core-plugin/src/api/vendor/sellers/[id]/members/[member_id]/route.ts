import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"

import { VendorUpdateMemberRoleType } from "../../../validators"
import {
  updateMemberRoleWorkflow,
  removeSellerMemberWorkflow,
} from "../../../../../../workflows/seller"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateMemberRoleType>,
  res: MedusaResponse
) => {
  await updateMemberRoleWorkflow(req.scope).run({
    input: {
      seller_member_id: req.params.member_id,
      role_handle: req.validatedBody.role_handle,
    },
  })

  res.status(200).json({})
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  await removeSellerMemberWorkflow(req.scope).run({
    input: {
      seller_member_id: req.params.member_id,
      seller_id: req.params.id,
    },
  })

  res.status(200).json({
    id: req.params.member_id,
    object: "seller_member",
    deleted: true,
  })
}
