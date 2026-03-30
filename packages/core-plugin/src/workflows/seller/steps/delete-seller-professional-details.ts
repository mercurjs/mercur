import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules, ProfessionalDetailsDTO } from "@mercurjs/types"

import SellerModuleService from "../../../modules/seller/service"

export const deleteSellerProfessionalDetailsStep = createStep<
  { seller_id: string },
  void,
  ProfessionalDetailsDTO | null
>(
  "delete-seller-professional-details",
  async ({ seller_id }, { container }) => {
    const service =
      container.resolve<SellerModuleService>(MercurModules.SELLER)

    const existing = await service.listProfessionalDetails({
      seller_id,
    })

    if (existing.length > 0) {
      await service.deleteProfessionalDetails([existing[0].id])
      return new StepResponse(void 0, existing[0])
    }

    return new StepResponse(void 0, null)
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }

    const service =
      container.resolve<SellerModuleService>(MercurModules.SELLER)

    await service.createProfessionalDetails({
      corporate_name: previous.corporate_name,
      registration_number: previous.registration_number,
      tax_id: previous.tax_id,
      seller_id: (previous as any).seller_id,
    })
  }
)
