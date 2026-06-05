import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { AdminSuspendSellerType } from "../../validators"
import { suspendSellerWorkflow } from "../../../../../workflows/seller"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminSuspendSellerType>,
  res: MedusaResponse<HttpTypes.AdminSellerResponse>
) => {
  await suspendSellerWorkflow(req.scope).run({
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
