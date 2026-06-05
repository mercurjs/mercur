import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { removeSellerMemberWorkflow } from "../../../../../../workflows/seller"

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
