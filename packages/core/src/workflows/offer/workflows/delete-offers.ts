import {
  createHook,
  createWorkflow,
  parallelize,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { AdditionalData } from "@medusajs/framework/types"
import type { DeleteEntityInput } from "@medusajs/framework/modules-sdk"
import {
  deleteInventoryItemWorkflow,
  emitEventStep,
  removeRemoteLinkStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { MercurModules } from "@mercurjs/types"

import { deleteOffersStep, removeOfferPricesStep } from "../steps"
import { OfferWorkflowEvents } from "../../events"

export type DeleteOffersWorkflowInput = {
  ids: string[]
  /** Hard-delete branch (operator termination). Default: soft delete. */
  force?: boolean
} & AdditionalData

export const deleteOffersWorkflowId = "delete-offers"

export const deleteOffersWorkflow = createWorkflow(
  deleteOffersWorkflowId,
  function (input: DeleteOffersWorkflowInput) {
    // 1. Bulk-load every offer's relations.
    const { data: offerRows } = useQueryGraphStep({
      entity: "offer",
      fields: [
        "id",
        "prices.id",
        "inventory_item_link.inventory_item.id",
        "inventory_item_link.inventory_item.offers.id",
      ],
      filters: { id: input.ids },
    }).config({ name: "get-offers-for-delete" })

    const isForce = transform({ input }, ({ input }) => !!input.force)

    // 2/3. Branch on `force` — soft vs hard delete.
    when("hard-delete", { isForce }, ({ isForce }) => isForce).then(() => {
      // Compute orphan inventory_item IDs (linked exclusively to this batch).
      const orphanInventoryIds = transform(
        { input, offerRows },
        ({ input, offerRows }) => {
          const deleteIds = new Set(input.ids)
          const ids = new Set<string>()
          for (const offer of offerRows as Array<{
            id: string
            inventory_item_link?: Array<{
              inventory_item?: {
                id: string
                offers?: Array<{ id: string }>
              } | null
            }>
          }>) {
            for (const link of offer.inventory_item_link ?? []) {
              const item = link.inventory_item
              if (!item) continue
              const linkedOffers = item.offers ?? []
              if (linkedOffers.every((o) => deleteIds.has(o.id))) {
                ids.add(item.id)
              }
            }
          }
          return Array.from(ids)
        },
      )

      // Union of every offer-owned Price ID across the batch.
      const allOfferPriceIds = transform({ offerRows }, ({ offerRows }) => {
        const ids: string[] = []
        for (const offer of offerRows as Array<{
          prices?: Array<{ id: string }>
        }>) {
          for (const price of offer.prices ?? []) {
            ids.push(price.id)
          }
        }
        return ids
      })

      const removeLinksInput = transform(
        { input },
        ({ input }): DeleteEntityInput[] => [
          { [MercurModules.OFFER]: { offer_id: input.ids ?? [] } },
        ],
      )

      parallelize(
        removeRemoteLinkStep(removeLinksInput),
        removeOfferPricesStep(allOfferPriceIds),
        deleteInventoryItemWorkflow.runAsStep({
          input: orphanInventoryIds,
        }),
        deleteOffersStep({ ids: input.ids, force: true }).config({
          name: "hard-delete-offers",
        }),
      )
    })

    when("soft-delete", { isForce }, ({ isForce }) => !isForce).then(() => {
      deleteOffersStep({ ids: input.ids, force: false }).config({
        name: "soft-delete-offers",
      })
    })

    const eventData = transform({ input }, ({ input }) =>
      input.ids.map((id) => ({ id })),
    )

    emitEventStep({
      eventName: OfferWorkflowEvents.DELETED,
      data: eventData,
    })

    const offersDeleted = createHook("offersDeleted", {
      ids: input.ids,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(void 0, { hooks: [offersDeleted] })
  },
)
