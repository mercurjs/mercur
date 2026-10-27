import { MedusaContainer } from "@medusajs/framework/types"

import { jobHandler } from "../pipeline/jobs"
import { JobTrigger, PAYOUT_JOB_SCHEDULES } from "../types/common"
import { runJob } from "../utils/run-job"

export default async function payoutProcessTransfersJob(container: MedusaContainer) {
  await runJob(container, "payout-process-transfers", JobTrigger.SCHEDULE, jobHandler("payout-process-transfers"))
}

export const config = {
  name: "payout-process-transfers",
  schedule: PAYOUT_JOB_SCHEDULES["payout-process-transfers"],
}
