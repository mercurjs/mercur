import { Modules, PaymentCollectionStatus } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import {
  hasSplitOrderCollections,
  isOrderCanceled,
  isPaymentCaptured,
  loadSplitOrderPaymentGroup,
} from "../utils"

export type VoidSplitOrderPaymentStepInput = {
  order_id: string
}

export const voidSplitOrderPaymentStepId = "void-split-order-payment"

/**
 * Canceling an order cancels only its own share: the authorization at the
 * provider is shared with the cart's other orders. Once every order of the
 * cart is canceled nothing needs it any more, and it is voided here.
 */
export const voidSplitOrderPaymentStep = createStep(
  voidSplitOrderPaymentStepId,
  async (input: VoidSplitOrderPaymentStepInput, { container }) => {
    const group = await loadSplitOrderPaymentGroup(container, input)
    const cartPayment = group?.payment

    if (
      !group ||
      !cartPayment ||
      !hasSplitOrderCollections(group.payment_collection) ||
      isPaymentCaptured(cartPayment) ||
      !group.orders.every(isOrderCanceled)
    ) {
      return new StepResponse(false)
    }

    const paymentModule = container.resolve(Modules.PAYMENT)

    await paymentModule.cancelPayment(cartPayment.id)
    await paymentModule.updatePaymentCollections(group.payment_collection.id, {
      status: PaymentCollectionStatus.CANCELED,
    })

    return new StepResponse(true)
  }
)
