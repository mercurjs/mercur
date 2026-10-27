import { MedusaContainer } from "@medusajs/framework/types"

import { jobHandler } from "../pipeline/jobs"
import { JobTrigger, PAYOUT_JOB_SCHEDULES } from "../types/common"
import { runJob } from "../utils/run-job"

export default async function payoutAlertFailedOperationsJob(container: MedusaContainer) {
  await runJob(container, "payout-alert-failed-operations", JobTrigger.SCHEDULE, jobHandler("payout-alert-failed-operations"))
}

export const config = {
  name: "payout-alert-failed-operations",
  schedule: PAYOUT_JOB_SCHEDULES["payout-alert-failed-operations"],
}
