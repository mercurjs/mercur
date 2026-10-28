import { MedusaContainer } from "@medusajs/framework/types"

import { JobTrigger, PAYOUT_JOB_SCHEDULES } from "../types/common"
import { runJob } from "../utils/run-job"
import { jobWorkflow } from "../workflows/jobs"

export default async function payoutProcessReversalsJob(container: MedusaContainer) {
  await runJob(container, "payout-process-reversals", JobTrigger.SCHEDULE, jobWorkflow("payout-process-reversals", container))
}

export const config = {
  name: "payout-process-reversals",
  schedule: PAYOUT_JOB_SCHEDULES["payout-process-reversals"],
}
