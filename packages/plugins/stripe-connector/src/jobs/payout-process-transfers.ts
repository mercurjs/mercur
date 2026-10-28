import { MedusaContainer } from "@medusajs/framework/types"

import { JobTrigger, PAYOUT_JOB_SCHEDULES } from "../types/common"
import { runJob } from "../utils/run-job"
import { jobWorkflow } from "../workflows/jobs"

export default async function payoutProcessTransfersJob(container: MedusaContainer) {
  await runJob(container, "payout-process-transfers", JobTrigger.SCHEDULE, jobWorkflow("payout-process-transfers", container))
}

export const config = {
  name: "payout-process-transfers",
  schedule: PAYOUT_JOB_SCHEDULES["payout-process-transfers"],
}
