import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules, SellerAddressDTO, UpdateSellerAddressDTO } from "@mercurjs/types"

import SellerModuleService from "../../../modules/seller/service"

export const updateSellerAddressStep = createStep<
  { seller_id: string; data: UpdateSellerAddressDTO },
  SellerAddressDTO,
  any
>(
  "update-seller-address",
  async (
    {
      seller_id,
      data,
    },
    { container }
  ) => {
    const service =
      container.resolve<SellerModuleService>(MercurModules.SELLER)

    const [seller] = await service.listSellers(
      { id: seller_id },
      { relations: ["address"] }
    )

    if (seller.address) {
      const updated = await service.updateSellerAddresses({
        id: seller.address.id,
        ...data,
      })
      return new StepResponse(updated, {
        existing: seller.address,
        seller_id,
      })
    }

    const created = await service.createSellerAddresses({
      ...data,
      seller_id,
    })
    return new StepResponse(created, { existing: null, seller_id })
  },
  async ({ existing, seller_id }, { container }) => {
    const service =
      container.resolve<SellerModuleService>(MercurModules.SELLER)
    if (existing) {
      await service.updateSellerAddresses(existing.id, existing)
    } else {
      const current = await service.listSellerAddresses({ seller_id })
      if (current.length > 0) {
        await service.deleteSellerAddresses([current[0].id])
      }
    }
  }
)
