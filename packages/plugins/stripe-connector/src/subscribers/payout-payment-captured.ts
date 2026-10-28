import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { PaymentEvents } from "@medusajs/framework/utils"

import { JobTrigger } from "../types/common"
import { runJob } from "../utils/run-job"
import { processPaymentCapturedPayoutsWorkflow } from "../workflows/payouts/workflows/process-payment-captured-payouts"

export default async function payoutPaymentCapturedHandler({ event, container }: SubscriberArgs<{ id: string }>) {
  await runJob(container, "payout-process-transfers", JobTrigger.SUBSCRIBER, async () => {
    const { result } = await processPaymentCapturedPayoutsWorkflow(container).run({
      input: { payment_id: event.data.id },
    })
    return result
  })
}

export const config: SubscriberConfig = {
  event: PaymentEvents.CAPTURED,
  context: { subscriberId: "stripe-connector-payout-payment-captured" },
}
