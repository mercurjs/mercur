import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export type DecorateLineItemWithOfferInput = Array<{
  line_item_id: string
  sku: string
  shipping_profile_id: string
  seller_id: string
}>

export const decorateLineItemWithOfferStepId = "decorate-line-item-with-offer"

export const decorateLineItemWithOfferStep = createStep(
  decorateLineItemWithOfferStepId,
  async (input: DecorateLineItemWithOfferInput, { container }) => {
    if (!input?.length) {
      return new StepResponse([], [])
    }

    const cartModule = container.resolve(Modules.CART)

    const itemsBefore = await cartModule.listLineItems(
      { id: input.map((row) => row.line_item_id) },
      { select: ["id", "variant_sku", "metadata"] },
    )

    const previousByItem = new Map(itemsBefore.map((item) => [item.id, item]))

    const updates = input.map((row) => {
      const previous = previousByItem.get(row.line_item_id)
      return {
        selector: { id: row.line_item_id },
        data: {
          variant_sku: row.sku,
          metadata: {
            ...(previous?.metadata ?? {}),
            offer_sku: row.sku,
            seller_id: row.seller_id,
            shipping_profile_id: row.shipping_profile_id,
          },
        },
      }
    })

    await cartModule.updateLineItems(updates)

    const compensationData = itemsBefore.map((item) => ({
      selector: { id: item.id },
      data: {
        variant_sku: item.variant_sku ?? undefined,
        metadata: item.metadata ?? undefined,
      },
    }))

    return new StepResponse(input, compensationData)
  },
  async (compensationData, { container }) => {
    if (!compensationData?.length) {
      return
    }
    const cartModule = container.resolve(Modules.CART)
    await cartModule.updateLineItems(compensationData)
  },
)
