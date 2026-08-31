import { getOrderDetailWorkflow } from "@medusajs/core-flows"
import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { HttpTypes } from "@medusajs/types"

import {
  normalizeOrderPaymentCollections,
  withCartPaymentCollectionFields,
} from "../../../utils/split-order-payment-status"

// Only GET is overridden. Medusa resolves duplicate routes per method, so the
// stock POST would keep working on its own — but the generated route manifest
// maps a path to a single module, so it has to be re-exported here for the
// typed client to keep seeing it.
export { POST } from "@medusajs/medusa/api/admin/orders/[id]/route"

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
