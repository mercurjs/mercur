import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { AdminTerminateSellerType } from "../../validators"
import { terminateSellerWorkflow } from "../../../../../workflows/seller"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminTerminateSellerType>,
  res: MedusaResponse<HttpTypes.AdminSellerResponse>
) => {
  await terminateSellerWorkflow(req.scope).run({
    input: {
      seller_id: req.params.id,
      reason: req.validatedBody.reason,
    },
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [seller],
  } = await query.graph({
    entity: "seller",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  res.json({ seller })
}
