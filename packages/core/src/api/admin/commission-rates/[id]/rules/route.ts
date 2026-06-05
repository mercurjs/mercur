import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@mercurjs/types"

import { AdminBatchCommissionRulesType } from "../../validators"
import { batchCommissionRulesWorkflow } from "../../../../../workflows/commission"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminBatchCommissionRulesType>,
  res: MedusaResponse<HttpTypes.AdminBatchCommissionRulesResponse>
) => {
  const { result } = await batchCommissionRulesWorkflow(req.scope).run({
    input: {
      commission_rate_id: req.params.id,
      create: req.validatedBody.create,
      update: req.validatedBody.update,
      delete: req.validatedBody.delete,
    },
  })

  res.json({
    created: result.created,
    updated: result.updated,
    deleted: result.deleted,
  })
}
