import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  Modules,
  OrderEditWorkflowEvents,
  OrderWorkflowEvents,
} from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

/**
 * Links newly-added order line items back to their originating offer.
 *
 * When a vendor adds items via:
 *  - `POST /vendor/order-edits/:id/items`
 *  - `POST /vendor/exchanges/:id/outbound/items`
 *  - `POST /vendor/claims/:id/outbound/items`
 *
 * the route resolves the seller's `offer_id` into the variant_id + unit_price
 * the underlying Medusa workflow expects, and stashes the offer id in
 * `item.metadata.offer_id`. The new line item only gets a real id
 * once the edit/exchange/claim is confirmed, so this subscriber listens for
 * the three confirm events and creates the `order_line_item ↔ offer` link
 * lazily, mirroring what `mirrorLineItemOfferLinksToOrderStep` does for
 * fresh checkouts.
 *
 * The metadata key is cleared after the link is created so the same item is
 * never re-linked on subsequent confirm events for the same order.
 */
const METADATA_KEY = "offer_id"

type LineItem = {
  id: string
  metadata?: Record<string, unknown> | null
  offer?: { id?: string | null } | null
}

export default async function linkOrderLineItemsToOffersHandler({
  event,
  container,
}: SubscriberArgs<{ order_id?: string; id?: string }>) {
  // Different events surface the order id under different keys; fall back to
  // `id` for backwards compatibility with payloads that pass the order id
  // directly (e.g. some emit-event call-sites in Medusa).
  const orderId = event.data.order_id ?? event.data.id
  if (!orderId) {
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const orderModuleService = container.resolve(Modules.ORDER)

  const { data: orders } = await query.graph({
    entity: "orders",
    fields: [
      "id",
      "items.id",
      "items.metadata",
      "items.offer.id",
    ],
    filters: { id: orderId },
  })

  const order = orders?.[0] as { items?: LineItem[] } | undefined
  const items = order?.items ?? []

  const pairs: Array<{ line_item_id: string; offer_id: string }> = []

  for (const item of items) {
    const metadata = (item.metadata ?? {}) as Record<string, unknown>
    const offerId = metadata[METADATA_KEY]
    if (typeof offerId !== "string" || !offerId) {
      continue
    }
    // Skip if already linked — guards against re-running on follow-up events
    // before the metadata cleanup commits.
    if (item.offer?.id) {
      continue
    }
    pairs.push({ line_item_id: item.id, offer_id: offerId })
  }

  if (!pairs.length) {
    return
  }

  await link.create(
    pairs.map((pair) => ({
      [Modules.ORDER]: { order_line_item_id: pair.line_item_id },
      [MercurModules.OFFER]: { offer_id: pair.offer_id },
    }))
  )

  // Clean up the metadata marker so the link isn't re-attempted on later
  // events for the same order.
  const updates = pairs.map((pair) => {
    const item = items.find((i) => i.id === pair.line_item_id)
    const nextMetadata = { ...(item?.metadata ?? {}) }
    delete nextMetadata[METADATA_KEY]
    return {
      selector: { id: pair.line_item_id },
      data: { metadata: nextMetadata },
    }
  })

  await orderModuleService.updateOrderLineItems(updates)
}

export const config: SubscriberConfig = {
  event: [
    OrderEditWorkflowEvents.CONFIRMED,
    OrderWorkflowEvents.EXCHANGE_CREATED,
    OrderWorkflowEvents.CLAIM_CREATED,
  ],
  context: {
    subscriberId: "link-order-line-items-to-offers-handler",
  },
}
