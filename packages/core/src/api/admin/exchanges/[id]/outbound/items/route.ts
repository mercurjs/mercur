import { orderExchangeAddNewItemWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import { resolveOfferItems, AddItemInput } from "../../../../../vendor/orders/resolve-offer-items"
import { resolveOrderSellerId } from "../../../../orders/resolve-order-seller-id"

type AdminAddItemsBody = {
  items: Array<{
    variant_id: string
    quantity: number
    unit_price?: number | null
    internal_note?: string | null
    allow_backorder?: boolean
    metadata?: Record<string, unknown> | null
  }>
}

/**
 * Mercur override of Medusa's `POST /admin/exchanges/:id/outbound/items`.
 * Mirrors the order-edits items override: keep the strict variant_id
 * payload, smuggle the offer id via `metadata.offer_id`, resolve the
 * offer's price in the order's currency, and let the existing
 * `link-order-line-items-to-offers` subscriber attach the offer link on
 * `order.exchange_created`.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminAddItemsBody>,
  res: MedusaResponse<HttpTypes.AdminExchangePreviewResponse>
) => {
  const { id } = req.params

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [exchange],
  } = await query.graph({
    entity: "order_exchange",
    fields: ["id", "order_id"],
    filters: { id },
  })

  if (!exchange?.order_id) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Exchange ${id} not found`
    )
  }

  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "currency_code"],
    filters: { id: exchange.order_id },
  })

  const currencyCode = (
    orders?.[0] as { currency_code?: string } | undefined
  )?.currency_code

  if (!currencyCode) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Order for exchange ${id} not found`
    )
  }

  const sellerId = await resolveOrderSellerId(req.scope, exchange.order_id)

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
    currencyCode,
    items: resolverInput,
  })

  const { result } = await orderExchangeAddNewItemWorkflow(req.scope).run({
    input: { items, exchange_id: id },
  })

  const {
    data: [orderExchangeRefreshed],
  } = await query.graph({
    entity: "order_exchange",
    fields: req.queryConfig.fields,
    filters: { id, ...req.filterableFields },
  })

  res.json({
    order_preview: result as unknown as HttpTypes.AdminOrderPreview,
    exchange: orderExchangeRefreshed as unknown as HttpTypes.AdminExchange,
  })
}
