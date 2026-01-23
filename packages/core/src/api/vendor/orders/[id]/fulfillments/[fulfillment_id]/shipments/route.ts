import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { createOrderShipmentWorkflow } from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { validateSellerOrder } from "../../../../helpers"
import { VendorCreateShipmentType } from "../../../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateShipmentType>,
  res: MedusaResponse<HttpTypes.VendorOrderResponse>
) => {
  const { id, fulfillment_id } = req.params
  const sellerId = req.auth_context.actor_id

  await validateSellerOrder(req.scope, sellerId, id)

  await createOrderShipmentWorkflow(req.scope).run({
    input: {
      ...req.validatedBody,
      order_id: id,
      fulfillment_id,
      labels: req.validatedBody.labels ?? [],
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
