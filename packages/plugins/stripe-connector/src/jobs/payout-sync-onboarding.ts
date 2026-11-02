import { MedusaContainer } from "@medusajs/framework/types"

import { JobTrigger, PAYOUT_JOB_SCHEDULES } from "../types/common"
import { runJob } from "../utils/run-job"
import { jobWorkflow } from "../workflows/jobs"

export default async function payoutSyncOnboardingJob(container: MedusaContainer) {
  await runJob(container, "payout-sync-onboarding", JobTrigger.SCHEDULE, jobWorkflow("payout-sync-onboarding", container))
}

export const config = {
  name: "payout-sync-onboarding",
  schedule: PAYOUT_JOB_SCHEDULES["payout-sync-onboarding"],
}
