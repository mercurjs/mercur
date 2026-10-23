import { PayoutJobTrigger } from "@mercurjs/types"

import { refundPaymentWorkflow } from "../../payment/workflows/payment-hooks"
import { processReversals } from "../pipeline/evaluate-reversals"
import { runPayoutJob } from "../utils/run-payout-job"

refundPaymentWorkflow.hooks.paymentRefunded(async ({ order_id, is_replay }, { container }) => {
  if (!order_id || is_replay) {
    return
  }

  await runPayoutJob(container, "payout-process-reversals", PayoutJobTrigger.SUBSCRIBER, (ctx) =>
    processReversals(ctx, [order_id])
  )
})
