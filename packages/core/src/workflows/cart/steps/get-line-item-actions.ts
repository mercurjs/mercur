import {
  ContainerRegistrationKeys,
  deepEqualObj,
  isPresent,
  MathBN,
  Modules,
} from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CreateCartCreateLineItemDTO } from "@medusajs/framework/types"

export type GetLineItemActionsInput = {
  id: string
  items: CreateCartCreateLineItemDTO[]
}

export const getLineItemActionsStepId = "get-line-item-actions-step"

/**
 * Mercur replacement for Medusa's `getLineItemActionsStep`. Keyed by
 * `(variant_id, offer_id)` so two offers on the same variant land as
 * two distinct cart lines instead of merging.
 */
export const getLineItemActionsStep = createStep(
  getLineItemActionsStepId,
  async (data: GetLineItemActionsInput, { container }) => {
    if (!data.items.length) {
      return new StepResponse({ itemsToCreate: [], itemsToUpdate: [] }, null)
    }

    const cartModule = container.resolve(Modules.CART)
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const variantIds = data.items.map((d) => d.variant_id!)

    const existingVariantItems = await cartModule.listLineItems(
      {
        cart_id: data.id,
        variant_id: variantIds,
      },
      {
        select: [
          "id",
          "metadata",
          "variant_id",
          "quantity",
          "unit_price",
          "compare_at_unit_price",
        ],
      },
    )

    let offerByLineItem = new Map<string, string>()
    if (existingVariantItems.length) {
      const { data: cartLines } = await query.graph({
        entity: "line_item",
        fields: ["id", "offer.id"],
        filters: { id: existingVariantItems.map((i) => i.id) },
      })
      const entries: Array<[string, string]> = []
      for (const row of cartLines) {
        const offerId = (row as { offer?: { id?: string } | null }).offer?.id
        if (offerId) {
          entries.push([row.id, offerId])
        }
      }
      offerByLineItem = new Map(entries)
    }

    const variantItemsMap = new Map<
      string,
      Array<(typeof existingVariantItems)[number]>
    >()
    for (const item of existingVariantItems) {
      if (!item.variant_id) continue
      const list = variantItemsMap.get(item.variant_id) ?? []
      list.push(item)
      variantItemsMap.set(item.variant_id, list)
    }

    const itemsToCreate: CreateCartCreateLineItemDTO[] = []
    const itemsToUpdate: Array<{
      id: string
      quantity: number
      variant_id: string
      unit_price?: number
      compare_at_unit_price?: number | null
    }> = []

    for (const item of data.items) {
      const candidates = variantItemsMap.get(item.variant_id!) ?? []
      const existingItem = candidates.find((candidate) => {
        const candidateOfferId = offerByLineItem.get(candidate.id)
        if (candidateOfferId !== item.offer_id) {
          return false
        }
        const metadataMatches =
          (!isPresent(candidate.metadata) && !isPresent(item.metadata)) ||
          deepEqualObj(candidate.metadata, item.metadata)
        return metadataMatches
      })

      if (existingItem) {
        const quantity = MathBN.sum(existingItem.quantity, item.quantity ?? 1)
        itemsToUpdate.push({
          id: existingItem.id,
          quantity: Number(quantity),
          variant_id: item.variant_id!,
          unit_price: item.unit_price ? Number(item.unit_price) : Number(existingItem.unit_price),
          compare_at_unit_price:
            item.compare_at_unit_price ? Number(item.compare_at_unit_price) : existingItem.compare_at_unit_price ? Number(existingItem.compare_at_unit_price) : undefined,
        })
      } else {
        itemsToCreate.push(item)
      }
    }

    return new StepResponse({ itemsToCreate, itemsToUpdate }, null)
  },
)
