import { MedusaContainer } from "@medusajs/framework/types"

import { jobHandler } from "../pipeline/jobs"
import { JobTrigger, PAYOUT_JOB_SCHEDULES } from "../types/common"
import { runJob } from "../utils/run-job"

export default async function payoutValidateCapturesJob(container: MedusaContainer) {
  await runJob(container, "payout-validate-captures", JobTrigger.SCHEDULE, jobHandler("payout-validate-captures"))
}

export const config = {
  name: "payout-validate-captures",
  schedule: PAYOUT_JOB_SCHEDULES["payout-validate-captures"],
}
