import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { confirmProductChangeWorkflow } from "../../../../../workflows/product-edit/workflows/confirm-product-change"
import { AdminConfirmProductChangeType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminConfirmProductChangeType>,
  res: MedusaResponse
) => {
  await confirmProductChangeWorkflow(req.scope).run({
    input: {
      ids: [req.params.id],
      confirmed_by: req.auth_context?.actor_id,
      internal_note: req.validatedBody?.internal_note,
      additional_data: req.validatedBody?.additional_data,
    },
  })

  res.json({
    id: req.params.id,
    object: "product_change",
    deleted: true,
  })
}
