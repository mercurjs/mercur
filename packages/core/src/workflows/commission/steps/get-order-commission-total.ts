import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import CommissionModuleService from "../../../modules/commission/service"

type GetOrderCommissionTotalStepInput = {
  item_ids: string[]
  shipping_method_ids: string[]
}

export const getOrderCommissionTotalStepId = "get-order-commission-total"

/**
 * Sums an order's commission (item + shipping lines) straight from the
 * commission module — robust against the order→shipping-method link
 * traversal, which the remote joiner does not resolve in every context.
 */
export const getOrderCommissionTotalStep = createStep(
  getOrderCommissionTotalStepId,
  async (
    input: GetOrderCommissionTotalStepInput,
    { container }
  ): Promise<StepResponse<number>> => {
    const service = container.resolve<CommissionModuleService>(
      MercurModules.COMMISSION
    )

    const total = await service.sumCommissionForOrderItems({
      item_ids: input.item_ids,
      shipping_method_ids: input.shipping_method_ids,
    })

    return new StepResponse(total)
  }
)
