import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules, UpdatePaymentDetailsDTO } from "@mercurjs/types"

import SellerModuleService from "../../../modules/seller/service"

export const updatePaymentDetailsStep = createStep(
  "update-payment-details",
  async (
    {
      seller_id,
      data,
    }: { seller_id: string; data: UpdatePaymentDetailsDTO },
    { container }
  ) => {
    const service =
      container.resolve<SellerModuleService>(MercurModules.SELLER)

    const [seller] = await service.listSellers(
      { id: seller_id },
      { relations: ["payment_details"] }
    )

    if (seller.payment_details) {
      const updated = await service.updatePaymentDetails({
        id: seller.payment_details.id,
        ...data,
      })
      return new StepResponse(updated, {
        existing: seller.payment_details,
        seller_id,
      })
    }

    const created = await service.createPaymentDetails({
      ...data,
      seller_id,
    })
    return new StepResponse(created, { existing: null, seller_id })
  },
  async ({ existing, seller_id }, { container }) => {
    const service =
      container.resolve<SellerModuleService>(MercurModules.SELLER)
    if (existing) {
      await service.updatePaymentDetails(existing.id, existing)
    } else {
      const current = await service.listPaymentDetailss({ seller_id })
      if (current.length > 0) {
        await service.deletePaymentDetailss([current[0].id])
      }
    }
  }
)
