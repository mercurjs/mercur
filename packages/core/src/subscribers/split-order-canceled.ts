import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { OrderWorkflowEvents } from "@medusajs/framework/utils"

import {
  resolveSplitOrderCartId,
  voidCanceledCartPaymentWorkflow,
} from "../workflows/payment"

export default async function splitOrderCanceledHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const cartId = await resolveSplitOrderCartId(container, {
    order_id: event.data.id,
  })

  if (!cartId) {
    return
  }

  await voidCanceledCartPaymentWorkflow(container).run({
    input: { cart_id: cartId },
  })
}

export const config: SubscriberConfig = {
  event: OrderWorkflowEvents.CANCELED,
  context: {
    subscriberId: "mercur-split-order-canceled",
  },
}
