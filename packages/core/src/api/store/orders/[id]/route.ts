import { getOrderDetailWorkflow } from "@medusajs/core-flows"
import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { HttpTypes } from "@medusajs/types"

import {
  normalizeOrderPaymentCollections,
  withCartPaymentCollectionFields,
} from "../../../utils/split-order-payment-status"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.StoreOrderResponse>
) => {
  const workflow = getOrderDetailWorkflow(req.scope)
  const { result } = await workflow.run({
    input: {
      fields: withCartPaymentCollectionFields(req.queryConfig.fields),
      order_id: req.params.id,
      filters: { is_draft_order: false },
    },
  })

  normalizeOrderPaymentCollections(result as never)

  res.json({ order: result as HttpTypes.StoreOrderResponse["order"] })
}
