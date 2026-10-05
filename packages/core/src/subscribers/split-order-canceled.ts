import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { OrderWorkflowEvents } from "@medusajs/framework/utils"

import { voidSplitOrderPaymentWorkflow } from "../workflows/payment"

export default async function splitOrderCanceledHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  await voidSplitOrderPaymentWorkflow(container).run({
    input: { order_id: event.data.id },
  })
}

export const config: SubscriberConfig = {
  event: OrderWorkflowEvents.CANCELED,
  context: {
    subscriberId: "mercur-split-order-canceled",
  },
}
