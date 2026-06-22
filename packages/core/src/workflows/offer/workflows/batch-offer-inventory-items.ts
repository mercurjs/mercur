import { AdditionalData, LinkDefinition } from "@medusajs/framework/types"
import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import {
  batchLinksWorkflow,
  emitEventStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { BatchOfferInventoryItemsDTO, MercurModules } from "@mercurjs/types"

import { OfferWorkflowEvents } from "../../events"

export type BatchOfferInventoryItemsWorkflowInput =
  BatchOfferInventoryItemsDTO & AdditionalData

export type BatchOfferInventoryItemsWorkflowResult = {
  created: LinkDefinition[]
  updated: LinkDefinition[]
  deleted: string[]
}

export type BatchOfferInventoryItemsWorkflowHooks = [
  Hook<
    "validate",
    { input: BatchOfferInventoryItemsWorkflowInput },
    unknown
  >,
  Hook<
    "offerInventoryItemsBatched",
    {
      offer_id: string
      result: BatchOfferInventoryItemsWorkflowResult
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const batchOfferInventoryItemsWorkflowId = "batch-offer-inventory-items"

export const batchOfferInventoryItemsWorkflow: ReturnWorkflow<
  BatchOfferInventoryItemsWorkflowInput,
  BatchOfferInventoryItemsWorkflowResult,
  BatchOfferInventoryItemsWorkflowHooks
> = createWorkflow(
  batchOfferInventoryItemsWorkflowId,
  function (input: BatchOfferInventoryItemsWorkflowInput) {
    const validate = createHook("validate", { input })

    const { data: offerRows } = useQueryGraphStep({
      entity: "offer",
      fields: ["id"],
      filters: { id: input.offer_id },
    }).config({ name: "get-offer" })

    const { data: offerLinks } = useQueryGraphStep({
      entity: "offer",
      fields: ["inventory_items.id"],
      filters: { id: input.offer_id },
    }).config({ name: "get-offer-links" })

    const createInventoryItemIds = transform({ input }, ({ input }) =>
      (input.create ?? []).map((c) => c.inventory_item_id)
    )

    const { data: inventoryItems } = useQueryGraphStep({
      entity: "inventory_item",
      fields: ["id"],
      filters: { id: createInventoryItemIds },
    }).config({ name: "get-inventory-items" })

    const linkInput = transform(
      { input, offerRows, offerLinks, inventoryItems },
      ({ input, offerRows, offerLinks, inventoryItems }) => {
        const offer = offerRows[0]
        if (!offer) {
          throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            `Offer with id: ${input.offer_id} was not found`
          )
        }
        const linkedItems =
          (offerLinks[0]?.inventory_items as Array<{ id: string }> | undefined) ?? []

        const creates = input.create ?? []
        const updates = input.update ?? []
        const deletes = input.delete ?? []

        const createIds = new Set<string>()
        for (const c of creates) {
          if (createIds.has(c.inventory_item_id)) {
            throw new MedusaError(
              MedusaError.Types.INVALID_DATA,
              `Duplicate inventory_item_id '${c.inventory_item_id}' in create payload`
            )
          }
          createIds.add(c.inventory_item_id)
        }

        const updateIds = new Set<string>()
        for (const u of updates) {
          if (updateIds.has(u.inventory_item_id)) {
            throw new MedusaError(
              MedusaError.Types.INVALID_DATA,
              `Duplicate inventory_item_id '${u.inventory_item_id}' in update payload`
            )
          }
          if (createIds.has(u.inventory_item_id)) {
            throw new MedusaError(
              MedusaError.Types.INVALID_DATA,
              `inventory_item_id '${u.inventory_item_id}' cannot appear in both create and update`
            )
          }
          updateIds.add(u.inventory_item_id)
        }

        const deleteIds = new Set<string>()
        for (const id of deletes) {
          if (deleteIds.has(id)) {
            throw new MedusaError(
              MedusaError.Types.INVALID_DATA,
              `Duplicate inventory_item_id '${id}' in delete payload`
            )
          }
          if (createIds.has(id) || updateIds.has(id)) {
            throw new MedusaError(
              MedusaError.Types.INVALID_DATA,
              `inventory_item_id '${id}' cannot appear in delete and create/update`
            )
          }
          deleteIds.add(id)
        }

        if (creates.length) {
          const found = new Set(inventoryItems.map((i) => i.id))
          for (const c of creates) {
            if (!found.has(c.inventory_item_id)) {
              throw new MedusaError(
                MedusaError.Types.NOT_FOUND,
                `Inventory item ${c.inventory_item_id} was not found`
              )
            }
          }
        }

        // Medusa's dismissRemoteLinkStep silently no-ops on unknown links;
        // surface a 404 instead so the seller learns the link did not exist.
        if (deletes.length) {
          const linked = new Set(linkedItems.map((i) => i.id))
          for (const id of deletes) {
            if (!linked.has(id)) {
              throw new MedusaError(
                MedusaError.Types.NOT_FOUND,
                `Inventory item ${id} is not linked to offer ${input.offer_id}`
              )
            }
          }
        }

        const buildLink = (
          inventoryItemId: string,
          data?: Record<string, unknown>
        ): LinkDefinition => ({
          [MercurModules.OFFER]: { offer_id: input.offer_id },
          [Modules.INVENTORY]: { inventory_item_id: inventoryItemId },
          ...(data ? { data } : {}),
        })

        return {
          create: creates.map((c) =>
            buildLink(c.inventory_item_id, {
              required_quantity: c.required_quantity ?? 1,
            })
          ),
          update: updates.map((u) =>
            buildLink(u.inventory_item_id, {
              required_quantity: u.required_quantity,
            })
          ),
          delete: deletes.map((id) => buildLink(id)),
        }
      }
    )

    const linkResult = batchLinksWorkflow.runAsStep({
      input: linkInput,
    })

    emitEventStep({
      eventName: OfferWorkflowEvents.UPDATED,
      data: { id: input.offer_id },
    })

    const result = transform(
      { linkResult, input },
      ({ linkResult, input }) => ({
        created: linkResult.created,
        updated: linkResult.updated,
        deleted: input.delete ?? [],
      })
    )

    const offerInventoryItemsBatched = createHook(
      "offerInventoryItemsBatched",
      {
        offer_id: input.offer_id,
        result,
        additional_data: input.additional_data,
      }
    )

    return new WorkflowResponse(result, {
      hooks: [validate, offerInventoryItemsBatched],
    })
  }
)
