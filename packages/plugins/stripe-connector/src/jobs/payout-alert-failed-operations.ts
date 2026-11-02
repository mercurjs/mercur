import { MedusaContainer } from "@medusajs/framework/types"

import { JobTrigger, PAYOUT_JOB_SCHEDULES } from "../types/common"
import { runJob } from "../utils/run-job"
import { jobWorkflow } from "../workflows/jobs"

export default async function payoutAlertFailedOperationsJob(container: MedusaContainer) {
  await runJob(container, "payout-alert-failed-operations", JobTrigger.SCHEDULE, jobWorkflow("payout-alert-failed-operations", container))
}

export const config = {
  name: "payout-alert-failed-operations",
  schedule: PAYOUT_JOB_SCHEDULES["payout-alert-failed-operations"],
}
