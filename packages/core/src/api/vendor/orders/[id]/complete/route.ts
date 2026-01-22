import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { completeOrderWorkflow } from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { validateSellerOrder } from "../../helpers"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorOrderResponse>
) => {
  const { id } = req.params
  const sellerId = req.auth_context.actor_id

  await validateSellerOrder(req.scope, sellerId, id)

  await completeOrderWorkflow(req.scope).run({
    input: {
      orderIds: [id],
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
