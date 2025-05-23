import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { SPLIT_ORDER_PAYMENT_MODULE } from '../../../modules/split-order-payment'
import SplitOrderPaymentModuleService from '../../../modules/split-order-payment/service'
import {
  SplitOrderPaymentDTO,
  UpdateSplitOrderPaymentsDTO
} from '../../../modules/split-order-payment/types'

export const updateSplitOrderPaymentsStep = createStep(
  'update-split-order-payments',
  async (input: UpdateSplitOrderPaymentsDTO[], { container }) => {
    const service = container.resolve<SplitOrderPaymentModuleService>(
      SPLIT_ORDER_PAYMENT_MODULE
    )

    const previousData = await service.listSplitOrderPayments({
      id: input.map((i) => i.id)
    })

    const updatedData = await service.updateSplitOrderPayments(input)
    return new StepResponse(updatedData, previousData)
  },
  async (previousData: SplitOrderPaymentDTO[], { container }) => {
    const service = container.resolve<SplitOrderPaymentModuleService>(
      SPLIT_ORDER_PAYMENT_MODULE
    )
    await service.updateSplitOrderPayments(previousData)
  }
)
