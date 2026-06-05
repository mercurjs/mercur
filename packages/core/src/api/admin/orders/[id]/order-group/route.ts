import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { getOrderGroupDetailWorkflow } from "../../../../../workflows/order-group"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminOrderGroupResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: orderGroupOrders } = await query.graph({
    entity: "order_group_order",
    fields: ["order_group_id"],
    filters: {
      order_id: req.params.id,
    },
  })

  const link = orderGroupOrders[0]

  if (!link) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Order group for order ${req.params.id} was not found`
    )
  }

  const { result: order_group } = await getOrderGroupDetailWorkflow(
    req.scope
  ).run({
    input: {
      order_group_id: link.order_group_id,
      fields: req.queryConfig.fields ?? [],
    },
  })

  res.json({ order_group })
}
