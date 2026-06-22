import { orderEditAddNewItemWorkflow } from "@medusajs/core-flows"
import { HttpTypes } from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import { resolveOfferItems } from "../../../orders/resolve-offer-items"
import { VendorPostOrderEditsAddItemsReqType } from "../../validators"

/**
 * `POST /vendor/order-edits/:id/items` — mirrors
 * `POST /admin/order-edits/:id/items`. Adds new items to the
 * draft edit on the seller-owned order.
 *
 * Mercur extension: items can be provided as `{ offer_id, quantity }` and the
 * server resolves the offer to its `variant_id + unit_price` for the
 * underlying workflow. The originating offer is stashed in
 * `metadata.offer_id` so the `order-edit-confirmed` subscriber can
 * persist the `order_line_item ↔ offer` link once the new line items are
 * created at confirm time.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorPostOrderEditsAddItemsReqType>,
  res: MedusaResponse<HttpTypes.AdminOrderEditPreviewResponse>
) => {
  const { id } = req.params

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: orders } = await query.graph({
    entity: "orders",
    fields: ["id", "currency_code"],
    filters: { id },
  })

  const order = orders?.[0] as { currency_code?: string } | undefined
  if (!order?.currency_code) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Order ${id} not found`
    )
  }

  const items = await resolveOfferItems({
    container: req.scope,
    sellerId: req.seller_context!.seller_id,
    currencyCode: order.currency_code,
    items: req.validatedBody.items,
  })

  const { result } = await orderEditAddNewItemWorkflow(req.scope).run({
    input: { items, order_id: id },
  })

  res.json({
    order_preview: result as unknown as HttpTypes.AdminOrderPreview,
  })
}
