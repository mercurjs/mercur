import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, PaymentEvents } from "@medusajs/framework/utils"
import { PayoutJobTrigger } from "@mercurjs/types"

import { processTransfers } from "../workflows/payout/pipeline"
import { runPayoutJob } from "../workflows/payout/utils/run-payout-job"

export default async function payoutPaymentCapturedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [payment],
  } = await query.graph({
    entity: "payment",
    fields: ["id", "payment_collection.order.id"],
    filters: { id: event.data.id },
  })

  const orderId = payment?.payment_collection?.order?.id
  if (!orderId) {
    return
  }

  await runPayoutJob(container, "payout-process-transfers", PayoutJobTrigger.SUBSCRIBER, (ctx) =>
    processTransfers(ctx, [orderId])
  )
}

export const config: SubscriberConfig = {
  event: PaymentEvents.CAPTURED,
  context: { subscriberId: "payout-payment-captured" },
}
