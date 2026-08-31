import { getOrdersListWorkflow } from "@medusajs/core-flows"
import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { OrderDTO } from "@medusajs/framework/types"
import { HttpTypes } from "@medusajs/types"

import {
  normalizeOrderPaymentCollections,
  withCartPaymentCollectionFields,
} from "../../utils/split-order-payment-status"

// Overrides the stock Medusa route to surface the split order payment
// collection, which lives on the cart rather than on the order link.
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.StoreOrderListResponse>
) => {
  const variables = {
    filters: {
      ...req.filterableFields,
      is_draft_order: false,
      customer_id: req.auth_context.actor_id,
    },
    ...req.queryConfig.pagination,
  }

  const workflow = getOrdersListWorkflow(req.scope)
  const { result } = await workflow.run({
    input: {
      fields: withCartPaymentCollectionFields(req.queryConfig.fields),
      variables,
    },
  })

  const { rows, metadata } = result as { rows: OrderDTO[]; metadata: any }

  rows.forEach((order) => normalizeOrderPaymentCollections(order as never))

  res.json({
    orders: rows as unknown as HttpTypes.StoreOrderListResponse["orders"],
    count: metadata.count,
    offset: metadata.skip,
    limit: metadata.take,
  })
}
