import { refundPaymentWorkflow } from "@mercurjs/core/workflows"

import { JobTrigger } from "../../types/common"
import { runJob } from "../../utils/run-job"
import { jobWorkflow } from "../jobs"

refundPaymentWorkflow.hooks.paymentRefunded(async ({ order_id, is_replay }, { container }) => {
  if (!order_id || is_replay) {
    return
  }

  await runJob(
    container,
    "payout-process-reversals",
    JobTrigger.SUBSCRIBER,
    jobWorkflow("payout-process-reversals", container, { order_id })
  )
})
