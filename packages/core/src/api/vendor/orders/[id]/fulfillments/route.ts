import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@mercurjs/types"

import { createOrderFulfillmentWorkflow } from "../../../../../workflows/order/workflows/create-order-fulfillment"
import { validateSellerOrder } from "../../helpers"
import { VendorCreateFulfillmentType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateFulfillmentType>,
  res: MedusaResponse<HttpTypes.VendorFulfillmentResponse>
) => {
  const { id } = req.params
  const sellerId = req.seller_context!.seller_id

  await validateSellerOrder(req.scope, sellerId, id)

  const { result: fulfillment } = await createOrderFulfillmentWorkflow(
    req.scope
  ).run({
    input: {
      order_id: id,
      created_by: sellerId,
      ...req.validatedBody,
    },
  })

  res.json({ fulfillment })
}
