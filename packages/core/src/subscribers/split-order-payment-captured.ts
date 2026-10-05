import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { PaymentEvents } from "@medusajs/framework/utils"

import {
  resolveSplitOrderCartId,
  splitCapturedCartPaymentWorkflow,
} from "../workflows/payment"

export default async function splitOrderPaymentCapturedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const cartId = await resolveSplitOrderCartId(container, {
    payment_id: event.data.id,
  })

  if (!cartId) {
    return
  }

  await splitCapturedCartPaymentWorkflow(container).run({
    input: { cart_id: cartId },
  })
}

export const config: SubscriberConfig = {
  event: PaymentEvents.CAPTURED,
  context: {
    subscriberId: "mercur-split-order-payment-captured",
  },
}
