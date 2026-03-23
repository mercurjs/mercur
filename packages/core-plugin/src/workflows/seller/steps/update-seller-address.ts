import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules, UpdateSellerAddressDTO } from "@mercurjs/types"

import SellerModuleService from "../../../modules/seller/service"

export const updateSellerAddressStep = createStep(
  "update-seller-address",
  async (
    {
      seller_id,
      data,
    }: { seller_id: string; data: UpdateSellerAddressDTO },
    { container }
  ) => {
    const service =
      container.resolve<SellerModuleService>(MercurModules.SELLER)

    const [seller] = await service.listSellers(
      { id: seller_id },
      { relations: ["address"] }
    )

    if (seller.address) {
      const updated = await service.updateSellerAddresss({
        id: seller.address.id,
        ...data,
      })
      return new StepResponse(updated, {
        existing: seller.address,
        seller_id,
      })
    }

    const created = await service.createSellerAddresss({
      ...data,
      seller_id,
    })
    return new StepResponse(created, { existing: null, seller_id })
  },
  async ({ existing, seller_id }, { container }) => {
    const service =
      container.resolve<SellerModuleService>(MercurModules.SELLER)
    if (existing) {
      await service.updateSellerAddresss(existing.id, existing)
    } else {
      const current = await service.listSellerAddresss({ seller_id })
      if (current.length > 0) {
        await service.deleteSellerAddresss([current[0].id])
      }
    }
  }
)
