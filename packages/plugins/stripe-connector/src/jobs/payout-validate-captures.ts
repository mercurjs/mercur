import { MedusaContainer } from "@medusajs/framework/types"

import { JobTrigger, PAYOUT_JOB_SCHEDULES } from "../types/common"
import { runJob } from "../utils/run-job"
import { jobWorkflow } from "../workflows/jobs"

export default async function payoutValidateCapturesJob(container: MedusaContainer) {
  await runJob(container, "payout-validate-captures", JobTrigger.SCHEDULE, jobWorkflow("payout-validate-captures", container))
}

export const config = {
  name: "payout-validate-captures",
  schedule: PAYOUT_JOB_SCHEDULES["payout-validate-captures"],
}
