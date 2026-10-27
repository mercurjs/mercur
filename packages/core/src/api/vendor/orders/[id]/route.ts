import { getOrderDetailWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { HttpTypes } from "@mercurjs/types"

import {
  normalizeOrderPaymentCollections,
  validateSellerOrder,
  withCartPaymentCollectionFields,
} from "../helpers"
import { wrapOrdersWithExpectedDelivery } from "../../../utils"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorOrderResponse>
) => {
  const sellerId = req.seller_context!.seller_id

  await validateSellerOrder(req.scope, sellerId, req.params.id)

  const workflow = getOrderDetailWorkflow(req.scope)
  const { result } = await workflow.run({
    input: {
      fields: withCartPaymentCollectionFields(req.queryConfig.fields),
      order_id: req.params.id,
    },
  })

  normalizeOrderPaymentCollections(result as never)

  const order = result as unknown as HttpTypes.VendorOrderResponse["order"] & { id: string }
  await wrapOrdersWithExpectedDelivery(req, [order])

  res.json({ order })
}
