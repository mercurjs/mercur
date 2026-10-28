import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, PaymentEvents } from "@medusajs/framework/utils"

import { JobTrigger } from "../types/common"
import { resolveConnector } from "../utils/payout-module"
import { runJob } from "../utils/run-job"
import { syncCapturesWorkflow } from "../workflows/captures/workflows/sync-captures"
import { jobWorkflow } from "../workflows/jobs"

export default async function payoutPaymentCapturedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [payment],
  } = await query.graph({
    entity: "payment",
    fields: ["id", "payment_collection_id", "payment_collection.order.id"],
    filters: { id: event.data.id },
  })
  if (!payment) {
    return
  }

  const [capture] = await resolveConnector(container).listStripeCaptures(
    { payment_collection_id: payment.payment_collection_id },
    { select: ["order_group_id"] }
  )
  if (capture) {
    await syncCapturesWorkflow(container).run({ input: { order_group_ids: [capture.order_group_id] } })
  }

  const orderId = payment.payment_collection?.order?.id
  if (!orderId) {
    return
  }

  await runJob(
    container,
    "payout-process-transfers",
    JobTrigger.SUBSCRIBER,
    jobWorkflow("payout-process-transfers", container, { order_id: orderId })
  )
}

export const config: SubscriberConfig = {
  event: PaymentEvents.CAPTURED,
  context: { subscriberId: "stripe-connector-payout-payment-captured" },
}
