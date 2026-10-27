import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, PaymentEvents } from "@medusajs/framework/utils"

import { jobHandler } from "../pipeline/jobs"
import { JobTrigger } from "../types/common"
import { runJob } from "../utils/run-job"

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

  await runJob(
    container,
    "payout-process-transfers",
    JobTrigger.SUBSCRIBER,
    jobHandler("payout-process-transfers", { order_id: orderId })
  )
}

export const config: SubscriberConfig = {
  event: PaymentEvents.CAPTURED,
  context: { subscriberId: "stripe-connector-payout-payment-captured" },
}
