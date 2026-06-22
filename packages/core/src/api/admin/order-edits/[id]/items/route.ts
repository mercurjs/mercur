import { orderEditAddNewItemWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import { resolveOfferItems, AddItemInput } from "../../../../vendor/orders/resolve-offer-items"
import { resolveOrderSellerId } from "../../../orders/resolve-order-seller-id"

type AdminAddItemsBody = {
  items: Array<{
    variant_id: string
    quantity: number
    unit_price?: number | null
    compare_at_unit_price?: number | null
    internal_note?: string | null
    allow_backorder?: boolean
    metadata?: Record<string, unknown> | null
  }>
}

/**
 * Mercur override of Medusa's `POST /admin/order-edits/:id/items`.
 *
 * The Medusa-shipped validator requires `variant_id`. To support
 * offer-aware admin flows without disabling that validator, the admin UI
 * passes the offer id in `metadata.offer_id`. This route pulls that key
 * out, resolves the offer's price in the order's currency, overrides
 * `unit_price`, and retains `metadata.offer_id` so the existing
 * `link-order-line-items-to-offers` subscriber persists the link on
 * confirm.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminAddItemsBody>,
  res: MedusaResponse<HttpTypes.AdminOrderEditPreviewResponse>
) => {
  const { id } = req.params

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: orders } = await query.graph({
    entity: "order",
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

  const sellerId = await resolveOrderSellerId(req.scope, id)

  const resolverInput: AddItemInput[] = req.validatedBody.items.map((i) => ({
    variant_id: i.variant_id,
    offer_id:
      typeof i.metadata?.offer_id === "string"
        ? (i.metadata.offer_id as string)
        : undefined,
    quantity: i.quantity,
    unit_price: i.unit_price,
    internal_note: i.internal_note,
    allow_backorder: i.allow_backorder,
    metadata: i.metadata ?? undefined,
  }))

  const items = await resolveOfferItems({
    container: req.scope,
    sellerId,
    currencyCode: order.currency_code,
    items: resolverInput,
  })

  const { result } = await orderEditAddNewItemWorkflow(req.scope).run({
    input: { items, order_id: id },
  })

  res.json({
    order_preview: result as unknown as HttpTypes.AdminOrderPreview,
  })
}
