import { getOrderDetailWorkflow } from "@medusajs/core-flows"
import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { HttpTypes } from "@medusajs/types"

import {
  normalizeOrderPaymentCollections,
  withCartPaymentCollectionFields,
} from "../../../utils/split-order-payment-status"

// Only GET is overridden; the stock POST on this matcher stays in place.
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminOrderResponse>
) => {
  const workflow = getOrderDetailWorkflow(req.scope)
  const { result } = await workflow.run({
    input: {
      fields: withCartPaymentCollectionFields(req.queryConfig.fields),
      order_id: req.params.id,
      version: (req.validatedQuery as { version?: number }).version,
    },
  })

  normalizeOrderPaymentCollections(result as never)

  res.json({ order: result as HttpTypes.AdminOrderResponse["order"] })
}
