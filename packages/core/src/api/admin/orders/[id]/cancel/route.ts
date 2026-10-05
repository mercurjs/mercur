import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { cancelSplitOrderWorkflow } from "../../../../../workflows/payment"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminOrderResponse>
) => {
  const { id } = req.params

  await cancelSplitOrderWorkflow(req.scope).run({
    input: {
      order_id: id,
      canceled_by: req.auth_context.actor_id,
    },
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: req.queryConfig.fields,
    filters: { id },
  })

  res.status(200).json({
    order: order as unknown as HttpTypes.AdminOrderResponse["order"],
  })
}
