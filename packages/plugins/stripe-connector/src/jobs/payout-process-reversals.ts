import { MedusaContainer } from "@medusajs/framework/types"

import { jobHandler } from "../pipeline/jobs"
import { JobTrigger, PAYOUT_JOB_SCHEDULES } from "../types/common"
import { runJob } from "../utils/run-job"

export default async function payoutProcessReversalsJob(container: MedusaContainer) {
  await runJob(container, "payout-process-reversals", JobTrigger.SCHEDULE, jobHandler("payout-process-reversals"))
}

export const config = {
  name: "payout-process-reversals",
  schedule: PAYOUT_JOB_SCHEDULES["payout-process-reversals"],
}
