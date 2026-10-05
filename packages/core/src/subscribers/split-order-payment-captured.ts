import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { PaymentEvents } from "@medusajs/framework/utils"

import { syncSplitOrderPaymentCapturesWorkflow } from "../workflows/payment"

export default async function splitOrderPaymentCapturedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  await syncSplitOrderPaymentCapturesWorkflow(container).run({
    input: { payment_id: event.data.id },
  })
}

export const config: SubscriberConfig = {
  event: PaymentEvents.CAPTURED,
  context: {
    subscriberId: "mercur-split-order-payment-captured",
  },
}
