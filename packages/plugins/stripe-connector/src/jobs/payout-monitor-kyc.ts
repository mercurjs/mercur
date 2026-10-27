import { MedusaContainer } from "@medusajs/framework/types"

import { jobHandler } from "../pipeline/jobs"
import { JobTrigger, PAYOUT_JOB_SCHEDULES } from "../types/common"
import { runJob } from "../utils/run-job"

export default async function payoutMonitorKycJob(container: MedusaContainer) {
  await runJob(container, "payout-monitor-kyc", JobTrigger.SCHEDULE, jobHandler("payout-monitor-kyc"))
}

export const config = {
  name: "payout-monitor-kyc",
  schedule: PAYOUT_JOB_SCHEDULES["payout-monitor-kyc"],
}
