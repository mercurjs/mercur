import { refundPaymentWorkflow } from "@mercurjs/core/workflows"

import { jobHandler } from "../../pipeline/jobs"
import { JobTrigger } from "../../types/common"
import { runJob } from "../../utils/run-job"

refundPaymentWorkflow.hooks.paymentRefunded(async ({ order_id, is_replay }, { container }) => {
  if (!order_id || is_replay) {
    return
  }

  await runJob(
    container,
    "payout-process-reversals",
    JobTrigger.SUBSCRIBER,
    jobHandler("payout-process-reversals", { order_id })
  )
})
