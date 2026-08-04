import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import OfferModuleService from "../../../modules/offer/service"

export type UpdateOffersStepInput = Array<{
  id: string
  sku?: string
  shipping_profile_id?: string
  manage_inventory?: boolean
  allow_backorder?: boolean
  metadata?: Record<string, unknown> | null
}>

export const updateOffersStep = createStep(
  "update-offers",
  async (data: UpdateOffersStepInput, { container }) => {
    const service = container.resolve<OfferModuleService>(MercurModules.OFFER)

    const ids = data.map((d) => d.id)
    const before = await service.listOffers({ id: ids })
    const beforeById = new Map(before.map((o) => [o.id, o]))

    const offers = await service.updateOffers(
      data.map(({ id, ...update }) => ({
        selector: { id },
        data: update,
      }))
    )

    const compensation = data.map(({ id }) => {
      const prev = beforeById.get(id)
      return {
        id,
        sku: prev?.sku,
        shipping_profile_id: prev?.shipping_profile_id,
        manage_inventory: prev?.manage_inventory,
        allow_backorder: prev?.allow_backorder,
        metadata: prev?.metadata ?? null,
      }
    })

    return new StepResponse(offers, compensation)
  },
  async (compensation, { container }) => {
    if (!compensation?.length) {
      return
    }
    const service = container.resolve<OfferModuleService>(MercurModules.OFFER)
    await service.updateOffers(
      compensation.map(({ id, ...data }) => ({
        selector: { id },
        data,
      }))
    )
  }
)
