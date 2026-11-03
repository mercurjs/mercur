import type { SearchTypes } from "@medusajs/framework/types"
import { defineSearchIndex, search } from "@medusajs/framework/utils"
import {
  OfferWorkflowEvents,
  ProductWorkflowEvents,
  SellerWorkflowEvents,
} from "@mercurjs/core/workflows"

import {
  buildProductDocuments,
  PRODUCT_SOURCE_FIELDS,
  type ProductSourceRow,
} from "./product-documents"

const SEED_BATCH_SIZE = 100

const productFields = search.define({
  id: search.keyword().filterable(),
  product_id: search.keyword().filterable(),
  currency_code: search.keyword().filterable(),
  title: search.text().searchable({ weight: 3 }),
  description: search.text().searchable(),
  handle: search.keyword(),
  thumbnail: search.keyword(),
  // `/store/search` narrows on `status` itself. It would also narrow on a
  // filterable `sales_channel_ids`, but Mercur's catalog is not scoped by
  // sales channel (`/store/products` ignores it), so the index doesn't carry it.
  status: search.keyword().filterable().retrievable(false),
  created_at: search.date().sortable(),
  collection_id: search.keyword().filterable(),
  type_id: search.keyword().filterable(),
  category_ids: search.keyword().array().filterable().facetable(),
  attribute_values: search.keyword().array().filterable().facetable(),
  seller_handles: search.keyword().array().filterable().facetable(),
  min_price: search
    .float()
    .filterable()
    .sortable()
    .facetable({ types: ["stats"] }),
})

type ConsumeEvent = Parameters<
  NonNullable<SearchTypes.SearchIndexDefinition["consume"]>
>[0]

type EventPayload = { id?: string; product_id?: string }

const toIds = (data: unknown, key: keyof EventPayload): string[] => {
  const payloads = (Array.isArray(data) ? data : [data]) as EventPayload[]
  return payloads
    .map((payload) => payload?.[key])
    .filter((value): value is string => typeof value === "string" && !!value)
}

const sellerEvents = [
  SellerWorkflowEvents.UPDATED,
  SellerWorkflowEvents.APPROVED,
  SellerWorkflowEvents.SUSPENDED,
  SellerWorkflowEvents.UNSUSPENDED,
  SellerWorkflowEvents.TERMINATED,
  SellerWorkflowEvents.UNTERMINATED,
  "seller.seller.updated",
]

const offerEvents = [
  OfferWorkflowEvents.CREATED,
  OfferWorkflowEvents.UPDATED,
  OfferWorkflowEvents.DELETED,
]

const resolveProductIds = async (
  event: ConsumeEvent,
  { container }: SearchTypes.SearchIngestionContext
): Promise<string[]> => {
  if (offerEvents.includes(event.name)) {
    const productIds = toIds(event.data, "product_id")
    if (productIds.length) {
      return productIds
    }
    const offerIds = toIds(event.data, "id")
    if (!offerIds.length) {
      return []
    }
    const { data } = await container.query.graph({
      entity: "offer",
      fields: ["product_id"],
      filters: { id: offerIds },
      withDeleted: true,
    })
    return data.map((offer: { product_id: string }) => offer.product_id)
  }

  if (sellerEvents.includes(event.name)) {
    const sellerIds = toIds(event.data, "id")
    if (!sellerIds.length) {
      return []
    }
    const { data } = await container.query.graph({
      entity: "offer",
      fields: ["product_id"],
      filters: { seller_id: sellerIds },
    })
    return Array.from(
      new Set(data.map((offer: { product_id: string }) => offer.product_id))
    )
  }

  return toIds(event.data, "id")
}

export const productIndex = defineSearchIndex({
  name: "product",
  entity: "product",
  fields: productFields,
  events: [
    "product.created",
    "product.updated",
    "product.deleted",
    ProductWorkflowEvents.PUBLISHED,
    ProductWorkflowEvents.REJECTED,
    ...offerEvents,
    ...sellerEvents,
  ],
  // Documents are keyed per currency, so a product's documents are replaced
  // as a set: delete everything under its product_id, then write the current
  // ones. A product that ends up with no visible offer simply gets none back.
  consume: async (event, context) => {
    const productIds = Array.from(new Set(await resolveProductIds(event, context)))
    if (!productIds.length) {
      return []
    }
    const mutations: SearchTypes.SearchMutation[] = [
      { action: "delete", filters: { product_id: productIds } },
    ]
    if (event.name === "product.deleted") {
      return mutations
    }
    const { data } = await container(context).graph({
      entity: "product",
      fields: PRODUCT_SOURCE_FIELDS,
      filters: { id: productIds },
    })
    const documents = await buildProductDocuments(
      container(context),
      data as ProductSourceRow[]
    )
    if (documents.length) {
      mutations.push({ action: "upsert", documents })
    }
    return mutations
  },
  seed: async function* (context) {
    const query = container(context)
    const { catchup, filters, last_key: lastKey } = context
    let cursor = lastKey

    while (true) {
      const constraints: Record<string, unknown>[] = [
        ...(catchup ? [{ updated_at: { $gte: catchup.since } }] : []),
        ...(cursor !== undefined ? [{ id: { $gt: cursor } }] : []),
      ]
      const { data } = await query.graph({
        entity: "product",
        fields: PRODUCT_SOURCE_FIELDS,
        filters: constraints.length
          ? { ...(filters ?? {}), $and: constraints }
          : filters ?? {},
        pagination: { take: SEED_BATCH_SIZE, order: { id: "ASC" } },
        withDeleted: !!catchup,
      })
      if (!data.length) {
        return
      }

      const rows = data as ProductSourceRow[]
      const documents = await buildProductDocuments(query, rows)
      const mutations: SearchTypes.SearchMutation[] = []
      // Only the catch-up pass can see a product leave the index: rows touched
      // during the seed are reset so stale currency documents don't linger.
      if (catchup) {
        mutations.push({
          action: "delete",
          filters: { product_id: rows.map((row) => row.id) },
        })
      }
      if (documents.length) {
        mutations.push({ action: "upsert", documents })
      }
      if (mutations.length) {
        yield mutations
      }
      if (data.length < SEED_BATCH_SIZE) {
        return
      }
      cursor = rows[rows.length - 1].id
    }
  },
})

function container(context: SearchTypes.SearchIngestionContext) {
  return context.container.query
}
