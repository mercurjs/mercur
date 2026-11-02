import { MedusaContainer } from "@medusajs/framework/types"

import { JobTrigger, PAYOUT_JOB_SCHEDULES } from "../types/common"
import { runJob } from "../utils/run-job"
import { jobWorkflow } from "../workflows/jobs"

export default async function payoutProcessSettlementsJob(container: MedusaContainer) {
  await runJob(container, "payout-process-settlements", JobTrigger.SCHEDULE, jobWorkflow("payout-process-settlements", container))
}

export const config = {
  name: "payout-process-settlements",
  schedule: PAYOUT_JOB_SCHEDULES["payout-process-settlements"],
}
