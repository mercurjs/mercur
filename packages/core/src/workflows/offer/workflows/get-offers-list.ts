import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"

export type GetOffersListWorkflowInput = {
  fields: string[]
  filters?: Record<string, unknown>
  pagination?: {
    skip?: number
    take?: number
    order?: Record<string, string>
  }
}

export type GroupedOfferRow = {
  id: string
  row_id: string
  product_id: string
  seller_id: string
  offer_ids: string[]
  variant_count: number
  [key: string]: unknown
}

export type GetOffersListWorkflowOutput = {
  rows: GroupedOfferRow[]
  metadata: { count: number; skip: number; take: number }
}

export const getOffersListWorkflowId = "get-offers-list"

/**
 * Lists offers grouped by `(product_id, seller_id)` — one row per product+store.
 * The grouping + count + pagination happen in `OfferModuleService.listAndCountOffers`
 * (triggered by `group_by_seller`); a second ungrouped read aggregates each group's
 * offer ids and offered-variant count for the list UI.
 */
export const getOffersListWorkflow = createWorkflow(
  getOffersListWorkflowId,
  (input: GetOffersListWorkflowInput) => {
    const groupedFilters = transform({ input }, ({ input }) => ({
      ...(input.filters ?? {}),
      group_by_seller: true,
    }))

    const { data: rows, metadata } = useQueryGraphStep({
      entity: "offer",
      fields: input.fields,
      filters: groupedFilters,
      pagination: input.pagination,
    }).config({ name: "list-grouped-offers" })

    const memberFilters = transform({ rows }, ({ rows }) => ({
      product_id: Array.from(
        new Set(rows.map((row) => row.product_id).filter(Boolean))
      ),
      seller_id: Array.from(
        new Set(rows.map((row) => row.seller_id).filter(Boolean))
      ),
    }))

    const { data: memberOffers } = useQueryGraphStep({
      entity: "offer",
      fields: ["id", "product_id", "seller_id", "variant_id"],
      filters: memberFilters,
      pagination: { take: 10000 },
    }).config({ name: "list-offer-members" })

    const result = transform(
      { rows, memberOffers, metadata },
      ({ rows, memberOffers, metadata }) => {
        const aggregates = new Map<
          string,
          { offerIds: string[]; variantIds: Set<string> }
        >()
        for (const offer of memberOffers) {
          const key = `${offer.product_id}:${offer.seller_id}`
          const entry = aggregates.get(key) ?? {
            offerIds: [],
            variantIds: new Set<string>(),
          }
          entry.offerIds.push(offer.id)
          if (offer.variant_id) {
            entry.variantIds.add(offer.variant_id)
          }
          aggregates.set(key, entry)
        }

        const shaped = rows.map((row) => {
          const key = `${row.product_id}:${row.seller_id}`
          const entry = aggregates.get(key)
          return {
            ...row,
            id: row.product_id,
            row_id: key,
            offer_ids: entry?.offerIds ?? [],
            variant_count: entry?.variantIds.size ?? 0,
          }
        })

        return {
          rows: shaped,
          metadata: {
            count: metadata?.count ?? shaped.length,
            skip: metadata?.skip ?? 0,
            take: metadata?.take ?? shaped.length,
          },
        }
      }
    )

    return new WorkflowResponse(result)
  }
)
