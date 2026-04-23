import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { validateSellerOrder } from "../../helpers"
import { mercurCancelOrderWorkflow } from "../../../../../workflows/order/cancel-order"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorOrderResponse>
) => {
  const { id } = req.params
  const sellerId = req.seller_context!.seller_id

  await validateSellerOrder(req.scope, sellerId, id)

  await mercurCancelOrderWorkflow(req.scope).run({
    input: {
      order_id: id,
      canceled_by: sellerId,
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

  res.json({ order })
}
