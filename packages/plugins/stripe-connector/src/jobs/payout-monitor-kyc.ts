import { MedusaContainer } from "@medusajs/framework/types"

import { JobTrigger, PAYOUT_JOB_SCHEDULES } from "../types/common"
import { runJob } from "../utils/run-job"
import { jobWorkflow } from "../workflows/jobs"

export default async function payoutMonitorKycJob(container: MedusaContainer) {
  await runJob(container, "payout-monitor-kyc", JobTrigger.SCHEDULE, jobWorkflow("payout-monitor-kyc", container))
}

export const config = {
  name: "payout-monitor-kyc",
  schedule: PAYOUT_JOB_SCHEDULES["payout-monitor-kyc"],
}
