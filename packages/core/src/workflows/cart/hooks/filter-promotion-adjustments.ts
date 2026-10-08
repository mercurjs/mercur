import { StepResponse } from "@medusajs/framework/workflows-sdk"
import { filterSellerAdjustments } from "../utils/seller-promotion-scope"
import { updateCartPromotionsWorkflow } from "../workflows/promotion-hooks"

updateCartPromotionsWorkflow.hooks.filterAdjustments(
  async (
    { lineItemAdjustmentsToCreate, shippingMethodAdjustmentsToCreate },
    { container },
  ) => {
    return new StepResponse(
      await filterSellerAdjustments(container, {
        lineItemAdjustmentsToCreate,
        shippingMethodAdjustmentsToCreate,
      }),
    )
  },
)
