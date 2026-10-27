import { MedusaContainer } from "@medusajs/framework/types"

import { jobHandler } from "../pipeline/jobs"
import { JobTrigger, PAYOUT_JOB_SCHEDULES } from "../types/common"
import { runJob } from "../utils/run-job"

export default async function payoutProcessSettlementsJob(container: MedusaContainer) {
  await runJob(container, "payout-process-settlements", JobTrigger.SCHEDULE, jobHandler("payout-process-settlements"))
}

export const config = {
  name: "payout-process-settlements",
  schedule: PAYOUT_JOB_SCHEDULES["payout-process-settlements"],
}
