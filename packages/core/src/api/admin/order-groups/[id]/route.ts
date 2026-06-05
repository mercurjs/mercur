import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { HttpTypes } from "@mercurjs/types"

import { getOrderGroupDetailWorkflow } from "../../../../workflows/order-group"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminOrderGroupResponse>
) => {
  const { result: order_group } = await getOrderGroupDetailWorkflow(
    req.scope
  ).run({
    input: {
      order_group_id: req.params.id,
      fields: req.queryConfig.fields ?? [],
    },
  })

  res.json({ order_group })
}
