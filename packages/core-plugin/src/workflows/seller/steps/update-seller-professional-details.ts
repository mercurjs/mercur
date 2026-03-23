import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  MercurModules,
  UpdateProfessionalDetailsDTO,
} from "@mercurjs/types"

import SellerModuleService from "../../../modules/seller/service"

export const updateSellerProfessionalDetailsStep = createStep(
  "update-seller-professional-details",
  async (
    {
      seller_id,
      data,
    }: { seller_id: string; data: UpdateProfessionalDetailsDTO },
    { container }
  ) => {
    const service =
      container.resolve<SellerModuleService>(MercurModules.SELLER)

    const [seller] = await service.listSellers(
      { id: seller_id },
      { relations: ["professional_details"] }
    )

    if (seller.professional_details) {
      const updated = await service.updateProfessionalDetailss({
        id: seller.professional_details.id,
        ...data,
      })
      return new StepResponse(updated, {
        existing: seller.professional_details,
        seller_id,
      })
    }

    const created = await service.createProfessionalDetailss({
      ...data,
      seller_id,
    })
    return new StepResponse(created, { existing: null, seller_id })
  },
  async ({ existing, seller_id }, { container }) => {
    const service =
      container.resolve<SellerModuleService>(MercurModules.SELLER)
    if (existing) {
      await service.updateProfessionalDetailss(existing.id, existing)
    } else {
      const current = await service.listProfessionalDetailss({ seller_id })
      if (current.length > 0) {
        await service.deleteProfessionalDetailss([current[0].id])
      }
    }
  }
)
