import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@mercurjs/types"

import { AdminBatchServiceFeeRulesType } from "../../validators"
import { batchServiceFeeRulesWorkflow } from "../../../../../workflows/service-fee"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminBatchServiceFeeRulesType>,
  res: MedusaResponse<HttpTypes.AdminBatchServiceFeeRulesResponse>
) => {
  const { result } = await batchServiceFeeRulesWorkflow(req.scope).run({
    input: {
      service_fee_id: req.params.id,
      create: req.validatedBody.create,
      update: req.validatedBody.update,
      delete: req.validatedBody.delete,
    },
  })

  res.json(result)
}
